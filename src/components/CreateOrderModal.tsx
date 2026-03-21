import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

const CRYPTOS = ["USDT", "BTC", "ETH", "BNB"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "NGN"];
const PAYMENT_OPTIONS = ["Bank Transfer", "UPI", "PayPal", "Wise", "Revolut", "Google Pay"];

const CreateOrderModal = ({ open, onClose }: CreateOrderModalProps) => {
  const [orderType, setOrderType] = useState<"buy" | "sell">("sell");
  const [crypto, setCrypto] = useState("USDT");
  const [currency, setCurrency] = useState("USD");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [minLimit, setMinLimit] = useState("");
  const [maxLimit, setMaxLimit] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const togglePayment = (method: string) => {
    setSelectedPayments((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-foreground mb-6">Create P2P Order</h2>

        {/* Buy/Sell Toggle */}
        <div className="flex rounded-lg bg-surface-2 p-1 mb-6">
          <button
            onClick={() => setOrderType("buy")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
              orderType === "buy" ? "bg-buy text-buy-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            I want to Buy
          </button>
          <button
            onClick={() => setOrderType("sell")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
              orderType === "sell" ? "bg-sell text-sell-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            I want to Sell
          </button>
        </div>

        <div className="space-y-4">
          {/* Crypto & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Crypto</Label>
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
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Fiat Currency</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Price per {crypto} ({currency})
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-surface-2 border-input"
            />
          </div>

          {/* Amount */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Total Amount ({crypto})
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-surface-2 border-input"
            />
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Min Limit ({currency})</Label>
              <Input
                type="number"
                placeholder="100"
                value={minLimit}
                onChange={(e) => setMinLimit(e.target.value)}
                className="bg-surface-2 border-input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Max Limit ({currency})</Label>
              <Input
                type="number"
                placeholder="10,000"
                value={maxLimit}
                onChange={(e) => setMaxLimit(e.target.value)}
                className="bg-surface-2 border-input"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Methods</Label>
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
            variant={orderType === "buy" ? "buy" : "sell"}
            className="w-full mt-2"
            size="lg"
          >
            Post {orderType === "buy" ? "Buy" : "Sell"} Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;
