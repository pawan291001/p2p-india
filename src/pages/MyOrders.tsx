import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, ShoppingCart, Loader2, Copy, CheckCircle2, Clock, AlertTriangle, MessageSquare, X } from "lucide-react";
import DealOutcome from "@/components/DealOutcome";
import DealTimeline from "@/components/DealTimeline";
import Navbar from "@/components/Navbar";
import { useContractAds } from "@/hooks/useContractAds";
import { useContractDeals } from "@/hooks/useContractDeals";
import { useDealTxHashes } from "@/hooks/useDealTxHashes";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { P2P_CONTRACT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI } from "@/config/abi";
import { toast } from "sonner";
import ChatPanel from "@/components/ChatPanel";
import { playSuccessChime, playAlertChime } from "@/lib/sounds";

const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const DEAL_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: "Active", color: "text-primary" },
  1: { label: "Buyer Paid", color: "text-buy" },
  2: { label: "Completed", color: "text-buy" },
  3: { label: "Cancelled", color: "text-sell" },
  4: { label: "Disputed", color: "text-sell" },
};

const formatTime = (seconds: number) => {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const MyOrders = () => {
  const { address, isConnected } = useAccount();
  const { ads, isLoading: loadingAds } = useContractAds();
  const { deals, isLoading: loadingDeals } = useContractDeals();
  const [chatDealId, setChatDealId] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  

  // Live tick every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);
  const [pendingDealId, setPendingDealId] = useState<number | null>(null);

  // Buyer confirm payment
  const { writeContract: confirmPayment, data: payHash, isPending: payPending } = useWriteContract();
  const { isSuccess: payConfirmed } = useWaitForTransactionReceipt({ hash: payHash });

  // Seller confirm receipt
  const { writeContract: sellerConfirm, data: sellerHash, isPending: sellerPending } = useWriteContract();
  const { isSuccess: sellerDone } = useWaitForTransactionReceipt({ hash: sellerHash });

  // Raise dispute
  const { writeContract: raiseDispute, data: disputeHash, isPending: disputePending } = useWriteContract();
  const { isSuccess: disputeDone } = useWaitForTransactionReceipt({ hash: disputeHash });

  // Cancel timed out
  const { writeContract: cancelDeal, data: cancelHash, isPending: cancelPending } = useWriteContract();
  const { isSuccess: cancelDone } = useWaitForTransactionReceipt({ hash: cancelHash });

  useEffect(() => { if (payConfirmed) { toast.success("Payment confirmed on-chain!"); playSuccessChime(); setPendingDealId(null); } }, [payConfirmed]);
  useEffect(() => { if (sellerDone) { toast.success("Tokens released! Trade completed."); playSuccessChime(); setPendingDealId(null); } }, [sellerDone]);
  useEffect(() => { if (disputeDone) { toast.info("Dispute raised. Admin will review."); playAlertChime(); setPendingDealId(null); } }, [disputeDone]);
  useEffect(() => { if (cancelDone) { toast.success("Deal cancelled. Funds returned."); playAlertChime(); setPendingDealId(null); } }, [cancelDone]);

  // Only show deals where user is the BUYER (accepted deals)
  const myDeals = address
    ? deals.filter((d) => d.buyer.toLowerCase() === address.toLowerCase())
    : [];

  const dealTxMap = useDealTxHashes(myDeals.map((d) => d.dealId));

  // Detect counterparty actions via polling changes
  const prevDealsRef = useRef<typeof myDeals>([]);
  useEffect(() => {
    const prev = prevDealsRef.current;
    if (prev.length === 0 || !address) {
      prevDealsRef.current = myDeals;
      return;
    }
    for (const deal of myDeals) {
      const old = prev.find((d) => d.dealId === deal.dealId);
      if (!old) continue;
      const isBuyer = deal.buyer.toLowerCase() === address.toLowerCase();

      // Counterparty confirmed payment (seller sees buyer confirmed)
      if (!isBuyer && !old.buyerConfirmed && deal.buyerConfirmed) {
        toast("💰 Buyer confirmed payment!", { description: `Deal #${deal.dealId} — ₹${deal.inrAmount}. Check your bank/UPI.` });
        playSuccessChime();
      }
      // Counterparty released tokens (buyer sees deal completed)
      if (isBuyer && old.status !== 2 && deal.status === 2) {
        toast("🎉 Tokens released!", { description: `Deal #${deal.dealId} — ${deal.tokenAmount} ${deal.tokenSymbol} received!` });
        playSuccessChime();
      }
      // Dispute raised by counterparty
      if (old.status !== 4 && deal.status === 4) {
        toast("⚠️ Dispute raised", { description: `Deal #${deal.dealId} — Admin will review.` });
        playAlertChime();
      }
    }
    prevDealsRef.current = myDeals;
  }, [myDeals, address]);

  // Sort newest first and split into sections
  const sortedDeals = [...myDeals].sort((a, b) => b.dealId - a.dealId);
  const activeDeals = sortedDeals.filter((d) => d.status === 0 || d.status === 1);
  const disputedDeals = sortedDeals.filter((d) => d.status === 4);
  const historyDeals = sortedDeals.filter((d) => d.status === 2 || d.status === 3);

  const [tab, setTab] = useState<"live" | "history">("live");

  const liveCount = activeDeals.length + disputedDeals.length;
  const historyCount = historyDeals.length;

  // Get payment info from associated ad
  const getPaymentInfo = (adId: number) => {
    const ad = ads.find((a) => a.adId === adId);
    return ad?.paymentInfo || "N/A";
  };

  const handleCopy = (text: string, dealId: number) => {
    navigator.clipboard.writeText(text);
    setCopied(dealId);
    setTimeout(() => setCopied(null), 2000);
  };

  const isProcessing = payPending || sellerPending || disputePending || cancelPending;

  const renderDealCard = (deal: typeof myDeals[0], i: number) => {
    const ds = DEAL_STATUS[deal.status] || DEAL_STATUS[0];
    const isBuyer = deal.buyer.toLowerCase() === address!.toLowerCase();
    const paymentInfo = getPaymentInfo(deal.adId);
    const timeLeft = deal.deadline - now;
    const isTimedOut = timeLeft <= 0 && (deal.status === 0 || deal.status === 1);
    const showChat = chatDealId === deal.dealId;

    return (
      <div
        key={deal.dealId}
        className="rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/30 animate-fade-up"
        style={{ animationDelay: `${i * 60}ms` }}
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isBuyer ? "bg-buy/10 text-buy" : "bg-sell/10 text-sell"} font-bold text-sm`}>
                {isBuyer ? "B" : "S"}
              </div>
              <div>
                <span className="font-medium text-foreground">Deal #{deal.dealId}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {isBuyer ? "Buying" : "Selling"} {deal.tokenAmount} {deal.tokenSymbol}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${ds.color}`}>{ds.label}</span>
              {(deal.status === 0 || deal.status === 1) && timeLeft > 0 && (
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono ${timeLeft < 120 ? "bg-sell/10 text-sell" : "bg-primary/10 text-primary"}`}>
                  <Clock className="h-3 w-3" />
                  {formatTime(timeLeft)}
                </span>
              )}
              {isTimedOut && (
                <span className="flex items-center gap-1 rounded-full bg-sell/10 px-2.5 py-1 text-xs font-semibold text-sell">
                  <AlertTriangle className="h-3 w-3" />
                  Expired
                </span>
              )}
            </div>
          </div>

          {(deal.status === 0 || deal.status === 1) && (
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${timeLeft < 120 ? "bg-sell" : "bg-primary"}`}
                  style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 900) * 100))}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
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
              <span className="text-muted-foreground text-xs">Buyer Confirmed</span>
              <p className={`text-xs font-medium ${deal.buyerConfirmed ? "text-buy" : "text-muted-foreground"}`}>
                {deal.buyerConfirmed ? "✓ Yes" : "✗ No"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Seller Confirmed</span>
              <p className={`text-xs font-medium ${deal.sellerConfirmed ? "text-buy" : "text-muted-foreground"}`}>
                {deal.sellerConfirmed ? "✓ Yes" : "✗ No"}
              </p>
            </div>
          </div>

          {isBuyer && (deal.status === 0 || deal.status === 1) && !isTimedOut && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Payment Details</p>
              <div className="flex items-center justify-between gap-2 rounded-md bg-surface-2 p-2">
                <p className="text-sm font-mono text-foreground break-all">{paymentInfo}</p>
                <button onClick={() => handleCopy(paymentInfo, deal.dealId)} className="shrink-0 text-primary hover:text-primary/80">
                  {copied === deal.dealId ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Send exactly ₹{deal.inrAmount} to the above details, then confirm payment.</p>
            </div>
          )}
          {isTimedOut && (
            <div className="mt-3 rounded-lg border border-sell/20 bg-sell/5 p-3">
              <p className="text-sm font-medium text-sell">⏰ Deal expired — time ran out. Cancel to return funds to the seller.</p>
            </div>
          )}

          <DealOutcome status={deal.status} isBuyer={isBuyer} buyerConfirmed={deal.buyerConfirmed} sellerConfirmed={deal.sellerConfirmed} tokenAmount={deal.tokenAmount} tokenSymbol={deal.tokenSymbol} inrAmount={deal.inrAmount} buyer={deal.buyer} seller={deal.seller} dealId={deal.dealId} txHash={dealTxMap[deal.dealId]?.completed || dealTxMap[deal.dealId]?.cancelled || dealTxMap[deal.dealId]?.resolved || dealTxMap[deal.dealId]?.created} />

          <div className="mt-3 flex flex-wrap gap-2">
            {isTimedOut ? (
              /* After timeout: only show cancel button */
              <Button variant="sell" size="sm" disabled={isProcessing} onClick={() => { setPendingDealId(deal.dealId); cancelDeal({ address: P2P_CONTRACT_ADDRESS, abi: P2P_ESCROW_ABI, functionName: "cancelTimedOutDeal", args: [BigInt(deal.dealId)] } as any); }}>
                {cancelPending && pendingDealId === deal.dealId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                Cancel &amp; Return Funds
              </Button>
            ) : (
              <>
                {isBuyer && deal.status === 0 && !deal.buyerConfirmed && (
                  <Button variant="buy" size="sm" disabled={isProcessing} onClick={() => { setPendingDealId(deal.dealId); confirmPayment({ address: P2P_CONTRACT_ADDRESS, abi: P2P_ESCROW_ABI, functionName: "buyerConfirmPayment", args: [BigInt(deal.dealId)] } as any); }}>
                    {payPending && pendingDealId === deal.dealId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    I've Paid — Confirm
                  </Button>
                )}
                {!isBuyer && deal.buyerConfirmed && !deal.sellerConfirmed && (deal.status === 0 || deal.status === 1) && (
                  <Button variant="buy" size="sm" disabled={isProcessing} onClick={() => { setPendingDealId(deal.dealId); sellerConfirm({ address: P2P_CONTRACT_ADDRESS, abi: P2P_ESCROW_ABI, functionName: "sellerConfirmReceived", args: [BigInt(deal.dealId)] } as any); }}>
                    {sellerPending && pendingDealId === deal.dealId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    I Received ₹{deal.inrAmount} — Release
                  </Button>
                )}
                {(deal.status === 0 || deal.status === 1) && (
                  <Button variant="outline" size="sm" className="text-sell border-sell/30" disabled={isProcessing} onClick={() => { setPendingDealId(deal.dealId); raiseDispute({ address: P2P_CONTRACT_ADDRESS, abi: P2P_ESCROW_ABI, functionName: "raiseDispute", args: [BigInt(deal.dealId), "Payment dispute"] } as any); }}>
                    {disputePending && pendingDealId === deal.dealId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    Dispute
                  </Button>
                )}
              </>
            )}
            {(deal.status === 0 || deal.status === 1 || deal.status === 4) && (
              <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto" onClick={() => setChatDealId(showChat ? null : deal.dealId)}>
                <MessageSquare className="h-3 w-3 mr-1" />
                {showChat ? "Hide Chat" : "Chat"}
              </Button>
            )}
          </div>
        </div>

        {showChat && (
          <div className="border-t border-border h-72">
            <ChatPanel dealId={deal.dealId} userAddress={address!} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6" style={{ lineHeight: "1.1" }}>My Deals</h1>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center animate-fade-up">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-1">Connect your wallet</p>
            <p className="text-muted-foreground text-sm mb-4">Connect to view your deals.</p>
            <ConnectButton />
          </div>
        ) : loadingDeals || loadingAds ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm animate-pulse">
            Loading deals from contract…
          </div>
        ) : myDeals.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            No deals yet. Accept an ad on the P2P Trading page to start.
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border">
              <button
                onClick={() => setTab("live")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === "live" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Live
                {liveCount > 0 && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${tab === "live" ? "bg-primary/15 text-primary" : "bg-surface-3 text-muted-foreground"}`}>{liveCount}</span>}
                {tab === "live" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
              <button
                onClick={() => setTab("history")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === "history" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                History
                {historyCount > 0 && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${tab === "history" ? "bg-primary/15 text-primary" : "bg-surface-3 text-muted-foreground"}`}>{historyCount}</span>}
                {tab === "history" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            </div>

            {tab === "live" ? (
              <div className="space-y-6">
                {activeDeals.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active</h2>
                    {activeDeals.map((deal, i) => renderDealCard(deal, i))}
                  </div>
                )}
                {disputedDeals.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-sell uppercase tracking-wider">Disputed</h2>
                    {disputedDeals.map((deal, i) => renderDealCard(deal, i))}
                  </div>
                )}
                {liveCount === 0 && (
                  <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                    No active or disputed deals. Check History for past deals.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {historyDeals.length > 0 ? (
                  historyDeals.map((deal, i) => renderDealCard(deal, i))
                ) : (
                  <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                    No completed or cancelled deals yet.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
