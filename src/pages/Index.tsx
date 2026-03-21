import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import OrderCard from "@/components/OrderCard";
import CreateOrderModal from "@/components/CreateOrderModal";
import StatsBar from "@/components/StatsBar";
import CryptoFilter from "@/components/CryptoFilter";
import { mockOrders } from "@/data/mockOrders";

const Index = () => {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [crypto, setCrypto] = useState("USDT");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      const matchesType = order.type === tab;
      const matchesCrypto = order.crypto === crypto;
      const matchesSearch =
        !search || order.advertiser.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesCrypto && matchesSearch;
    });
  }, [tab, crypto, search]);

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
            Trade crypto directly with other users. Smart contract escrow ensures every trade is safe — no middlemen, no trust required.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsBar />
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Buy/Sell Toggle */}
            <div className="flex rounded-lg bg-surface-2 p-1">
              <button
                onClick={() => setTab("buy")}
                className={`rounded-md px-6 py-2 text-sm font-semibold transition-all ${
                  tab === "buy"
                    ? "bg-buy text-buy-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTab("sell")}
                className={`rounded-md px-6 py-2 text-sm font-semibold transition-all ${
                  tab === "sell"
                    ? "bg-sell text-sell-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sell
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search advertiser..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-surface-2 border-input pl-9"
                />
              </div>
              <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Post Ad</span>
              </Button>
            </div>
          </div>

          <CryptoFilter selected={crypto} onSelect={setCrypto} />
        </div>

        {/* Order List */}
        <div className="space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, i) => (
              <OrderCard key={order.id} {...order} index={i} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center animate-fade-up">
              <p className="text-muted-foreground text-sm">No orders found for {crypto}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowCreate(true)}
              >
                Be the first to post
              </Button>
            </div>
          )}
        </div>
      </main>

      <CreateOrderModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};

export default Index;
