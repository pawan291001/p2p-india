import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, Package, ShoppingCart, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useContractAds, LiveAd } from "@/hooks/useContractAds";
import { useContractDeals, LiveDeal } from "@/hooks/useContractDeals";
import { Button } from "@/components/ui/button";
import { Clock, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import TradeWindow from "@/components/TradeWindow";
import { P2P_CONTRACT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI } from "@/config/abi";
import { toast } from "sonner";

const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const formatTimeout = (seconds: number) => {
  if (seconds >= 3600) return `${seconds / 3600}h`;
  return `${seconds / 60} min`;
};

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Live", color: "text-buy" },
  1: { label: "In Deal", color: "text-primary" },
  2: { label: "Completed", color: "text-muted-foreground" },
  3: { label: "Cancelled", color: "text-sell" },
  4: { label: "Expired", color: "text-muted-foreground" },
};

const DEAL_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: "Active", color: "text-primary" },
  1: { label: "Buyer Paid", color: "text-buy" },
  2: { label: "Completed", color: "text-buy" },
  3: { label: "Cancelled", color: "text-sell" },
  4: { label: "Disputed", color: "text-sell" },
};

const MyOrders = () => {
  const { address, isConnected } = useAccount();
  const { ads, isLoading: loadingAds } = useContractAds();
  const { deals, isLoading: loadingDeals } = useContractDeals();
  const [selectedAd, setSelectedAd] = useState<LiveAd | null>(null);

  const myAds = address
    ? ads.filter((ad) => ad.seller.toLowerCase() === address.toLowerCase())
    : [];

  const myDeals = address
    ? deals.filter(
        (d) =>
          d.buyer.toLowerCase() === address.toLowerCase() ||
          d.seller.toLowerCase() === address.toLowerCase()
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6" style={{ lineHeight: "1.1" }}>
          My Orders
        </h1>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center animate-fade-up">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-1">Connect your wallet</p>
            <p className="text-muted-foreground text-sm mb-4">Connect to view your ads and deals.</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Ads */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">My Ads ({myAds.length})</h2>
              </div>
              {loadingAds ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm animate-pulse">
                  Loading ads from contract…
                </div>
              ) : myAds.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                  You haven't created any ads yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myAds.map((ad, i) => {
                    const st = STATUS_LABELS[ad.status] || STATUS_LABELS[0];
                    const isExpired = ad.status === 0 && Date.now() / 1000 > ad.adExpiry;
                    return (
                      <div
                        key={ad.adId}
                        className="rounded-lg border border-border bg-card p-4 sm:p-5 transition-all hover:border-primary/30 animate-fade-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                              #{ad.adId}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                {ad.tokenAmount} {ad.tokenSymbol}
                              </span>
                              <span className="text-muted-foreground text-sm ml-2">@ ₹{ad.pricePerToken}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold ${isExpired ? "text-muted-foreground" : st.color}`}>
                            {isExpired ? "Expired" : st.label}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Total INR</span>
                            <p className="text-foreground font-medium tabular-nums">₹{ad.inrTotal}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Deal Timeout</span>
                            <p className="text-foreground text-xs">{formatTimeout(ad.dealTimeout)}</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-muted-foreground text-xs">Payment</span>
                            <p className="text-foreground text-xs truncate">{ad.paymentInfo}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* My Deals */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">My Deals ({myDeals.length})</h2>
              </div>
              {loadingDeals ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm animate-pulse">
                  Loading deals from contract…
                </div>
              ) : myDeals.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                  No active deals.
                </div>
              ) : (
                <div className="space-y-3">
                  {myDeals.map((deal, i) => {
                    const ds = DEAL_STATUS[deal.status] || DEAL_STATUS[0];
                    const isBuyer = deal.buyer.toLowerCase() === address!.toLowerCase();
                    return (
                      <div
                        key={deal.dealId}
                        className="rounded-lg border border-border bg-card p-4 sm:p-5 transition-all hover:border-primary/30 animate-fade-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isBuyer ? "bg-buy/10 text-buy" : "bg-sell/10 text-sell"} font-bold text-sm`}>
                              {isBuyer ? "B" : "S"}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                Deal #{deal.dealId}
                              </span>
                              <span className="text-muted-foreground text-sm ml-2">
                                {isBuyer ? "Buying" : "Selling"} {deal.tokenAmount} {deal.tokenSymbol}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold ${ds.color}`}>{ds.label}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">INR Amount</span>
                            <p className="text-foreground font-medium tabular-nums">₹{deal.inrAmount}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Counterparty</span>
                            <p className="text-foreground text-xs font-mono">
                              {shortAddr(isBuyer ? deal.seller : deal.buyer)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Confirmations</span>
                            <p className="text-foreground text-xs">
                              Buyer: {deal.buyerConfirmed ? "✓" : "✗"} | Seller: {deal.sellerConfirmed ? "✓" : "✗"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {selectedAd && address && (
        <TradeWindow ad={selectedAd} userAddress={address} onClose={() => setSelectedAd(null)} />
      )}
    </div>
  );
};

export default MyOrders;
