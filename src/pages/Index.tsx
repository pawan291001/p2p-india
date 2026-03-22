import { useState } from "react";
import { Plus, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Navbar from "@/components/Navbar";
import OrderCard from "@/components/OrderCard";
import CreateOrderModal from "@/components/CreateOrderModal";
import StatsBar from "@/components/StatsBar";
import CryptoFilter from "@/components/CryptoFilter";
import TradeWindow from "@/components/TradeWindow";
import { useContractAds, LiveAd } from "@/hooks/useContractAds";

const Index = () => {
  const { address, isConnected } = useAccount();
  const [crypto, setCrypto] = useState("USDT");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAd, setSelectedAd] = useState<LiveAd | null>(null);

  const { ads: liveAds, isLoading, refetch: refetchAds } = useContractAds();

  // Only show Live ads (status 0) that haven't expired
  const now = Date.now() / 1000;
  const filteredAds = liveAds.filter((ad) => {
    if (ad.status !== 0) return false;
    if (ad.adExpiry < now) return false;
    // Hide own ads — you can't buy from yourself
    if (address && ad.seller.toLowerCase() === address.toLowerCase()) return false;
    const matchesCrypto = ad.tokenSymbol === crypto;
    const matchesSearch = !search || ad.seller.toLowerCase().includes(search.toLowerCase());
    return matchesCrypto && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl" style={{ lineHeight: "1.1" }}>
            P2P Trading
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Trade BNB & USDT directly with other users on BNB Smart Chain. Smart contract escrow — no middlemen.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsBar />
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CryptoFilter selected={crypto} onSelect={setCrypto} />

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-surface-2 border-input pl-9"
                />
              </div>
              <Button
                onClick={() => setShowCreate(true)}
                className="gap-2 shrink-0"
                disabled={!isConnected}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Post Ad</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Connection prompt */}
        {!isConnected && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center animate-fade-up">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-1">Connect your wallet</p>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm">
              Connect your BNB Smart Chain wallet to view live ads, create orders, and start trading.
            </p>
            <ConnectButton />
          </div>
        )}

        {/* Order List */}
        {isConnected && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center animate-pulse">
                <p className="text-muted-foreground text-sm">Loading ads from contract…</p>
              </div>
            ) : filteredAds.length > 0 ? (
              filteredAds.map((ad, i) => (
                <OrderCard
                  key={ad.adId}
                  {...ad}
                  index={i}
                  onTrade={() => setSelectedAd(ad)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center animate-fade-up">
                <p className="text-muted-foreground text-sm mb-1">No live ads for {crypto}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Be the first to post a sell ad and start trading.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreate(true)}
                >
                  Create the first ad
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <CreateOrderModal open={showCreate} onClose={() => setShowCreate(false)} />

      {selectedAd && address && (
        <TradeWindow
          ad={selectedAd}
          userAddress={address}
          onClose={() => setSelectedAd(null)}
        />
      )}
    </div>
  );
};

export default Index;
