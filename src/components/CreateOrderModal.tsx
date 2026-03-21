import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Wallet } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from "wagmi";
import { parseEther, parseUnits, formatUnits } from "viem";
import { P2P_CONTRACT_ADDRESS, USDT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI, ERC20_ABI } from "@/config/abi";
import { toast } from "sonner";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

const NATIVE_BNB = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const CRYPTOS = [
  { symbol: "USDT", address: USDT_ADDRESS },
  { symbol: "BNB", address: NATIVE_BNB },
];

const PAYMENT_OPTIONS = ["Bank Transfer", "UPI", "PayPal", "Wise", "Google Pay", "PhonePe"];
const DEAL_TIMEOUTS = [
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "1 hour", value: 3600 },
  { label: "2 hours", value: 7200 },
];
const AD_DURATIONS = [
  { label: "30 min", value: 1800 },
  { label: "1 hour", value: 3600 },
  { label: "6 hours", value: 21600 },
  { label: "24 hours", value: 86400 },
  { label: "72 hours", value: 259200 },
];

type Step = "form" | "approving" | "posting";

const CreateOrderModal = ({ open, onClose }: CreateOrderModalProps) => {
  const { address, isConnected } = useAccount();
  const [crypto, setCrypto] = useState("USDT");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [dealTimeout, setDealTimeout] = useState(900);
  const [adDuration, setAdDuration] = useState(3600);
  const [paymentInfo, setPaymentInfo] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("form");

  const selectedToken = CRYPTOS.find((c) => c.symbol === crypto)!;
  const isBNB = crypto === "BNB";
  const tokenAmountWei = amount ? parseUnits(amount, 18) : BigInt(0);
  const pricePerTokenWei = price ? parseUnits(price, 2) : BigInt(0);

  // Read BNB balance
  const { data: bnbBalance } = useBalance({
    address,
    query: { enabled: isBNB && !!address && open },
  });

  // Read USDT balance
  const { data: usdtBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !isBNB && !!address && open },
  });

  const walletBalance = isBNB
    ? bnbBalance ? parseFloat(formatUnits(bnbBalance.value, 18)) : 0
    : usdtBalance ? parseFloat(formatUnits(usdtBalance as bigint, 18)) : 0;

  const walletBalanceFormatted = walletBalance.toFixed(4);
  const amountNum = amount ? parseFloat(amount) : 0;
  const exceedsBalance = amountNum > walletBalance;

  // Check current USDT allowance
  const { data: allowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, P2P_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !isBNB && !!address && open },
  });

  const needsApproval = !isBNB && (allowance === undefined || (allowance as bigint) < tokenAmountWei);

  // Approve tx
  const { writeContract: approve, data: approveTxHash, isPending: isApproving, reset: resetApprove } = useWriteContract();
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // CreateAd tx
  const { writeContract: createAd, data: createTxHash, isPending: isCreating, reset: resetCreate } = useWriteContract();
  const { isSuccess: createConfirmed } = useWaitForTransactionReceipt({ hash: createTxHash });

  // After approval confirmed, auto-proceed to createAd
  useEffect(() => {
    if (approveConfirmed && step === "approving") {
      setStep("posting");
      submitCreateAd();
    }
  }, [approveConfirmed]);

  // After createAd confirmed, close modal
  useEffect(() => {
    if (createConfirmed && step === "posting") {
      toast.success("Ad posted successfully! Your tokens are in escrow.");
      resetForm();
      onClose();
    }
  }, [createConfirmed]);

  const resetForm = () => {
    setPrice("");
    setAmount("");
    setPaymentInfo("");
    setSelectedPayments([]);
    setStep("form");
    resetApprove();
    resetCreate();
  };

  const submitCreateAd = () => {
    const paymentStr = selectedPayments.length > 0
      ? `${paymentInfo} | Methods: ${selectedPayments.join(", ")}`
      : paymentInfo;

    try {
      createAd({
        address: P2P_CONTRACT_ADDRESS,
        abi: P2P_ESCROW_ABI,
        functionName: "createAd",
        args: [selectedToken.address as `0x${string}`, tokenAmountWei, pricePerTokenWei, BigInt(dealTimeout), BigInt(adDuration), paymentStr],
        value: isBNB ? tokenAmountWei : BigInt(0),
      } as any);
    } catch (e: any) {
      toast.error(e?.shortMessage || "Transaction failed");
      setStep("form");
    }
  };

  const handleSubmit = () => {
    if (!price || !amount || !paymentInfo) return;

    if (isBNB) {
      setStep("posting");
      submitCreateAd();
    } else if (needsApproval) {
      setStep("approving");
      try {
        approve({
          address: USDT_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [P2P_CONTRACT_ADDRESS, tokenAmountWei],
        } as any);
      } catch (e: any) {
        toast.error(e?.shortMessage || "Approval failed");
        setStep("form");
      }
    } else {
      setStep("posting");
      submitCreateAd();
    }
  };

  const togglePayment = (method: string) => {
    setSelectedPayments((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const inrTotal = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : "0.00";
  const isProcessing = step !== "form";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { if (!isProcessing) { resetForm(); onClose(); } }}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isProcessing}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-foreground mb-6">Create Sell Ad</h2>

        {!isConnected ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-muted-foreground text-sm">Connect your wallet to create an ad</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Token */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Token to Sell</Label>
              <div className="flex flex-wrap gap-1.5">
                {CRYPTOS.map((c) => (
                  <button
                    key={c.symbol}
                    onClick={() => setCrypto(c.symbol)}
                    disabled={isProcessing}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      crypto === c.symbol
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-3 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Price per {crypto} (INR)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 95"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-surface-2 border-input"
                disabled={isProcessing}
              />
            </div>

            {/* Amount */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Amount ({crypto})
              </Label>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-surface-2 border-input"
                disabled={isProcessing}
              />
            </div>

            {/* INR Total */}
            {price && amount && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                <span className="text-xs text-muted-foreground">Buyer will pay </span>
                <span className="text-lg font-bold text-primary">₹{inrTotal}</span>
              </div>
            )}

            {/* Deal Timeout */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Deal Timeout (buyer must pay within)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {DEAL_TIMEOUTS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setDealTimeout(t.value)}
                    disabled={isProcessing}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      dealTimeout === t.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-3 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ad Duration */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Ad Duration (how long it stays live)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {AD_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setAdDuration(d.value)}
                    disabled={isProcessing}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      adDuration === d.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-3 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Payment Details (UPI ID / Bank account)
              </Label>
              <Input
                placeholder="e.g. yourname@upi or Bank details"
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                className="bg-surface-2 border-input"
                disabled={isProcessing}
              />
            </div>

            {/* Payment Methods */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Accepted Payment Methods</Label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((method) => (
                  <button
                    key={method}
                    onClick={() => togglePayment(method)}
                    disabled={isProcessing}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedPayments.includes(method)
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-surface-3 text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Status indicator */}
            {step === "approving" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center text-sm text-primary flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving USDT spend… confirm in wallet
              </div>
            )}
            {step === "posting" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center text-sm text-primary flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting ad… confirm in wallet
              </div>
            )}

            <Button
              variant="sell"
              className="w-full mt-2"
              size="lg"
              disabled={!price || !amount || !paymentInfo || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {step === "approving"
                ? "Approving…"
                : step === "posting"
                ? "Posting…"
                : isBNB
                ? `Post Sell Ad — Deposit ${amount || "0"} BNB`
                : needsApproval
                ? `Approve & Post — Deposit ${amount || "0"} USDT`
                : `Post Sell Ad — Deposit ${amount || "0"} USDT`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrderModal;
