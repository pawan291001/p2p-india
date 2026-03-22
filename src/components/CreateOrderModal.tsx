import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Wallet, TrendingUp } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { P2P_CONTRACT_ADDRESS, USDT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI, ERC20_ABI } from "@/config/abi";
import { toast } from "sonner";
import { useBnbPrice } from "@/hooks/useBnbPrice";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

const NATIVE_BNB = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const CRYPTOS = [
  { symbol: "USDT", address: USDT_ADDRESS },
  { symbol: "BNB", address: NATIVE_BNB },
];

const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Google Pay", "PhonePe", "PayPal", "Wise", "Cash/Bank Deposit", "Digital Rupee"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
  const [step, setStep] = useState<Step>("form");

  // Payment fields
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | "">("");
  const [sellerName, setSellerName] = useState("");
  // UPI fields
  const [upiId, setUpiId] = useState("");
  // Bank Transfer fields
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  // Generic payment ID (Google Pay, PhonePe, PayPal, Wise)
  const [paymentId, setPaymentId] = useState("");

  const selectedToken = CRYPTOS.find((c) => c.symbol === crypto)!;
  const isBNB = crypto === "BNB";
  const tokenAmountWei = amount ? parseUnits(amount, 18) : BigInt(0);
  const pricePerTokenWei = price ? parseUnits(price, 2) : BigInt(0);

  // Balances
  const { data: bnbBalance } = useBalance({
    address,
    query: { enabled: isBNB && !!address && open },
  });
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

  // Allowance
  const { data: allowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, P2P_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !isBNB && !!address && open },
  });
  const needsApproval = !isBNB && (allowance === undefined || (allowance as bigint) < tokenAmountWei);

  // Transactions
  const { writeContract: approve, data: approveTxHash, isPending: isApproving, reset: resetApprove, error: approveError } = useWriteContract();
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const { writeContract: createAd, data: createTxHash, isPending: isCreating, reset: resetCreate, error: createError } = useWriteContract();
  const { isSuccess: createConfirmed } = useWaitForTransactionReceipt({ hash: createTxHash });

  // Handle tx errors — reset step and show toast
  useEffect(() => {
    if (approveError && step === "approving") {
      const msg = (approveError as any)?.shortMessage || approveError.message || "Approval failed";
      toast.error(msg.includes("insufficient") ? "Insufficient USDT balance in your wallet" : msg);
      setStep("form");
    }
  }, [approveError]);

  useEffect(() => {
    if (createError && step === "posting") {
      const msg = (createError as any)?.shortMessage || createError.message || "Transaction failed";
      toast.error(msg.includes("insufficient") ? `Insufficient ${crypto} balance in your wallet` : msg);
      setStep("form");
    }
  }, [createError]);

  useEffect(() => {
    if (approveConfirmed && step === "approving") {
      setStep("posting");
      submitCreateAd();
    }
  }, [approveConfirmed]);

  useEffect(() => {
    if (createConfirmed && step === "posting") {
      toast.success("Ad posted successfully! Your tokens are in escrow.");
      resetForm();
      onClose();
    }
  }, [createConfirmed]);

  // Build payment info string
  const buildPaymentInfo = (): string => {
    const parts: string[] = [];
    parts.push(`Name: ${sellerName.trim()}`);
    parts.push(`Method: ${selectedMethod}`);

    if (selectedMethod === "UPI") {
      parts.push(`UPI: ${upiId.trim()}`);
    } else if (selectedMethod === "Bank Transfer") {
      parts.push(`Bank: ${bankName.trim()}`);
      parts.push(`A/C: ${accountNumber.trim()}`);
      parts.push(`IFSC: ${ifscCode.trim()}`);
    } else if (selectedMethod === "Google Pay" || selectedMethod === "PhonePe") {
      parts.push(`Phone/UPI: ${paymentId.trim()}`);
    } else if (selectedMethod === "PayPal" || selectedMethod === "Wise") {
      parts.push(`Email/ID: ${paymentId.trim()}`);
    } else if (selectedMethod === "Cash/Bank Deposit") {
      parts.push(`Bank: ${bankName.trim()}`);
      parts.push(`A/C: ${accountNumber.trim()}`);
      parts.push(`IFSC: ${ifscCode.trim()}`);
    } else if (selectedMethod === "Digital Rupee") {
      parts.push(`Wallet/ID: ${paymentId.trim()}`);
    }

    return parts.join(" | ");
  };

  const isPaymentValid = (): boolean => {
    if (!sellerName.trim() || !selectedMethod) return false;
    if (selectedMethod === "UPI") return !!upiId.trim();
    if (selectedMethod === "Bank Transfer" || selectedMethod === "Cash/Bank Deposit") return !!bankName.trim() && !!accountNumber.trim() && !!ifscCode.trim();
    return !!paymentId.trim();
  };

  const resetForm = () => {
    setPrice(""); setAmount("");
    setSellerName(""); setSelectedMethod(""); setUpiId("");
    setBankName(""); setAccountNumber(""); setIfscCode(""); setPaymentId("");
    setStep("form");
    resetApprove(); resetCreate();
  };

  const submitCreateAd = () => {
    const paymentStr = buildPaymentInfo();
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
    if (!price || !amount || !isPaymentValid()) return;

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

  const inrTotal = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : "0.00";
  const isProcessing = step !== "form";
  const canSubmit = !!price && !!amount && isPaymentValid() && !isProcessing && !exceedsBalance;

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

            {/* Payment Method — FIRST */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Method</Label>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    onClick={() => { setSelectedMethod(method); setUpiId(""); setBankName(""); setAccountNumber(""); setIfscCode(""); setPaymentId(""); }}
                    disabled={isProcessing}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedMethod === method
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-surface-3 text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Seller Name — always shown once method selected */}
            {selectedMethod && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Your Name (shown to buyer)</Label>
                <Input
                  placeholder="e.g. Ravi Kumar"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="bg-surface-2 border-input"
                  disabled={isProcessing}
                  maxLength={100}
                />
              </div>
            )}

            {/* Dynamic payment detail fields */}
            {selectedMethod === "UPI" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">UPI ID</Label>
                <Input
                  placeholder="e.g. yourname@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="bg-surface-2 border-input"
                  disabled={isProcessing}
                  maxLength={100}
                />
              </div>
            )}

            {selectedMethod === "Bank Transfer" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Bank Name</Label>
                  <Input
                    placeholder="e.g. State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="bg-surface-2 border-input"
                    disabled={isProcessing}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Account Number</Label>
                  <Input
                    placeholder="e.g. 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-surface-2 border-input"
                    disabled={isProcessing}
                    maxLength={30}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">IFSC Code</Label>
                  <Input
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="bg-surface-2 border-input"
                    disabled={isProcessing}
                    maxLength={11}
                  />
                </div>
              </div>
            )}

            {(selectedMethod === "Google Pay" || selectedMethod === "PhonePe") && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Phone Number or UPI ID</Label>
                <Input
                  placeholder="e.g. 9876543210 or yourname@ybl"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  className="bg-surface-2 border-input"
                  disabled={isProcessing}
                  maxLength={100}
                />
              </div>
            )}

            {(selectedMethod === "PayPal" || selectedMethod === "Wise") && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{selectedMethod} Email or Username</Label>
                <Input
                  placeholder={`e.g. your@email.com`}
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  className="bg-surface-2 border-input"
                  disabled={isProcessing}
                  maxLength={100}
                />
              </div>
            )}

            {selectedMethod === "Cash/Bank Deposit" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground bg-surface-2 rounded-md px-2.5 py-1.5">
                  Buyer will deposit cash at your bank branch or ATM. Provide your bank details below.
                </p>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Bank Name</Label>
                  <Input
                    placeholder="e.g. State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="bg-surface-2 border-input"
                    disabled={isProcessing}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Account Number</Label>
                  <Input
                    placeholder="e.g. 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-surface-2 border-input"
                    disabled={isProcessing}
                    maxLength={30}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">IFSC Code</Label>
                  <Input
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="bg-surface-2 border-input"
                    disabled={isProcessing}
                    maxLength={11}
                  />
                </div>
              </div>
            )}

            {selectedMethod === "Digital Rupee" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Digital Rupee Wallet / ID</Label>
                <Input
                  placeholder="e.g. your e₹ wallet ID"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  className="bg-surface-2 border-input"
                  disabled={isProcessing}
                  maxLength={100}
                />
              </div>
            )}

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
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-muted-foreground">Amount ({crypto})</Label>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3 w-3" />
                  <span>{walletBalanceFormatted} {crypto}</span>
                  <button
                    type="button"
                    onClick={() => setAmount(walletBalance.toString())}
                    disabled={isProcessing || walletBalance <= 0}
                    className="text-primary font-medium hover:text-primary/80 transition-colors ml-1"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`bg-surface-2 border-input ${exceedsBalance && amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
                disabled={isProcessing}
              />
              {exceedsBalance && amount && (
                <p className="text-xs text-destructive mt-1">
                  Insufficient balance. You have {walletBalanceFormatted} {crypto}
                </p>
              )}
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

            {/* Status indicators */}
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
              disabled={!canSubmit}
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
