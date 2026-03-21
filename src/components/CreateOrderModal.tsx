import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useAccount } from "wagmi";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

const CRYPTOS = ["USDT", "BNB"];
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

const CreateOrderModal = ({ open, onClose }: CreateOrderModalProps) => {
  const { isConnected } = useAccount();
  const [crypto, setCrypto] = useState("USDT");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [dealTimeout, setDealTimeout] = useState(900);
  const [adDuration, setAdDuration] = useState(3600);
  const [paymentInfo, setPaymentInfo] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const togglePayment = (method: string) => {
    setSelectedPayments((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const inrTotal = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : "0.00";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
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
            {/* Crypto */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Token to Sell</Label>
              <div className="flex flex-wrap gap-1.5">
                {CRYPTOS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCrypto(c)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      crypto === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-3 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
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

            <Button
              variant="sell"
              className="w-full mt-2"
              size="lg"
              disabled={!price || !amount || !paymentInfo}
            >
              Post Sell Ad — Deposit {amount || "0"} {crypto}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrderModal;
