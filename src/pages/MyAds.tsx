import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, Package, Loader2, Plus, CheckCircle2, XCircle, ExternalLink, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useContractAds } from "@/hooks/useContractAds";
import { useContractDeals } from "@/hooks/useContractDeals";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { P2P_CONTRACT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI } from "@/config/abi";
import { toast } from "sonner";
import CreateOrderModal from "@/components/CreateOrderModal";

const BSCSCAN_CONTRACT = "https://bscscan.com/address/0x0ACFC8034b92FB06F482541BBd7fF692d30B5F3f";

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

const MyAds = () => {
  const { address, isConnected } = useAccount();
  const { ads, isLoading } = useContractAds();
  const { deals } = useContractDeals();
  const [showCreate, setShowCreate] = useState(false);
  const [pendingAdId, setPendingAdId] = useState<number | null>(null);

  const { writeContract: cancelAd, data: cancelHash, isPending: cancelPending } = useWriteContract();
  const { isSuccess: cancelConfirmed } = useWaitForTransactionReceipt({ hash: cancelHash });

  const { writeContract: claimExpired, data: claimHash, isPending: claimPending } = useWriteContract();
  const { isSuccess: claimConfirmed } = useWaitForTransactionReceipt({ hash: claimHash });

  useEffect(() => {
    if (cancelConfirmed) { toast.success("Ad cancelled. Funds returned."); setPendingAdId(null); }
  }, [cancelConfirmed]);

  useEffect(() => {
    if (claimConfirmed) { toast.success("Expired ad claimed. Funds returned."); setPendingAdId(null); }
  }, [claimConfirmed]);

  const myAds = address
    ? ads.filter((ad) => ad.seller.toLowerCase() === address.toLowerCase())
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground" style={{ lineHeight: "1.1" }}>
            My Ads
          </h1>
          {isConnected && (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Post Ad
            </Button>
          )}
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center animate-fade-up">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-1">Connect your wallet</p>
            <p className="text-muted-foreground text-sm mb-4">Connect to manage your ads.</p>
            <ConnectButton />
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm animate-pulse">
            Loading ads from contract…
          </div>
        ) : myAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-3">You haven't created any ads yet.</p>
            <Button onClick={() => setShowCreate(true)} variant="outline" size="sm">
              Create your first ad
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myAds.map((ad, i) => {
              const st = STATUS_LABELS[ad.status] || STATUS_LABELS[0];
              const isExpired = ad.status === 0 && Date.now() / 1000 > ad.adExpiry;
              const isLive = ad.status === 0 && !isExpired;
              const expiryDate = new Date(ad.adExpiry * 1000);

              return (
                <div
                  key={ad.adId}
                  className="rounded-lg border border-border bg-card p-4 sm:p-5 transition-all hover:border-primary/30 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${isLive ? "bg-buy/10 text-buy" : "bg-surface-3 text-muted-foreground"}`}>
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

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Total INR</span>
                      <p className="text-foreground font-medium tabular-nums">₹{ad.inrTotal}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Deal Timeout</span>
                      <p className="text-foreground text-xs">{formatTimeout(ad.dealTimeout)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">{isExpired ? "Expired At" : "Expires"}</span>
                      <p className="text-foreground text-xs">{expiryDate.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Payment</span>
                      <p className="text-foreground text-xs truncate">{ad.paymentInfo}</p>
                    </div>
                  </div>

                  {/* Outcome for completed/cancelled ads */}
                  {(ad.status === 2 || ad.status === 3) && (() => {
                    const relatedDeal = deals.find((d) => d.adId === ad.adId);
                    const isAdCompleted = ad.status === 2;
                    return (
                      <div className={`mt-3 rounded-lg border p-3 space-y-2 ${isAdCompleted ? "border-buy/20 bg-buy/5" : "border-border bg-surface-1"}`}>
                        <div className="flex items-center gap-2">
                          {isAdCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-buy shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className={`text-sm font-semibold ${isAdCompleted ? "text-buy" : "text-muted-foreground"}`}>
                            {isAdCompleted ? "Deal Completed" : "Ad Cancelled"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {isAdCompleted && relatedDeal ? (
                            <>
                              <p>
                                Buyer <span className="font-mono text-foreground">{relatedDeal.buyer.slice(0, 6)}…{relatedDeal.buyer.slice(-4)}</span> paid ₹{relatedDeal.inrAmount}
                              </p>
                              <p>
                                You released <span className="font-medium text-foreground">{ad.tokenAmount} {ad.tokenSymbol}</span> to buyer
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-buy" />
                                  <span className="text-buy font-medium">Buyer paid</span>
                                </div>
                                <span>→</span>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-buy" />
                                  <span className="text-buy font-medium">You confirmed</span>
                                </div>
                                <span>→</span>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-buy" />
                                  <span className="text-buy font-medium">Tokens sent</span>
                                </div>
                              </div>
                            </>
                          ) : isAdCompleted ? (
                            <p>Your ad was accepted and the deal completed successfully. {ad.tokenAmount} {ad.tokenSymbol} was released to the buyer.</p>
                          ) : (
                            <p>You cancelled this ad. <span className="font-medium text-foreground">{ad.tokenAmount} {ad.tokenSymbol}</span> was returned to your wallet.</p>
                          )}
                        </div>
                        <a
                          href={BSCSCAN_CONTRACT}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on BscScan
                        </a>
                      </div>
                    );
                  })()}

                  {/* In Deal status */}
                  {ad.status === 1 && (() => {
                    const relatedDeal = deals.find((d) => d.adId === ad.adId);
                    return (
                      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-semibold text-primary">Deal In Progress</span>
                        </div>
                        {relatedDeal && (
                          <p className="text-xs text-muted-foreground">
                            Buyer <span className="font-mono text-foreground">{relatedDeal.buyer.slice(0, 6)}…{relatedDeal.buyer.slice(-4)}</span> accepted your ad.
                            {relatedDeal.buyerConfirmed ? " Buyer has confirmed payment — check your bank/UPI." : " Waiting for buyer to pay."}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  {(ad.status === 0) && (
                    <div className="mt-3 flex gap-2">
                      {!isExpired ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-sell border-sell/30 hover:bg-sell/10"
                          onClick={() => {
                            setPendingAdId(ad.adId);
                            cancelAd({
                              address: P2P_CONTRACT_ADDRESS,
                              abi: P2P_ESCROW_ABI,
                              functionName: "cancelAd",
                              args: [BigInt(ad.adId)],
                            } as any);
                          }}
                          disabled={cancelPending && pendingAdId === ad.adId}
                        >
                          {cancelPending && pendingAdId === ad.adId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Cancel Ad
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => {
                            setPendingAdId(ad.adId);
                            claimExpired({
                              address: P2P_CONTRACT_ADDRESS,
                              abi: P2P_ESCROW_ABI,
                              functionName: "claimExpiredAd",
                              args: [BigInt(ad.adId)],
                            } as any);
                          }}
                          disabled={claimPending && pendingAdId === ad.adId}
                        >
                          {claimPending && pendingAdId === ad.adId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Claim Funds
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CreateOrderModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};

export default MyAds;
