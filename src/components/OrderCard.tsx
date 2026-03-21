import { Button } from "@/components/ui/button";
import { Shield, Clock } from "lucide-react";

interface OrderCardProps {
  advertiser: string;
  completedTrades: number;
  completionRate: number;
  price: string;
  currency: string;
  crypto: string;
  available: string;
  minLimit: string;
  maxLimit: string;
  paymentMethods: string[];
  type: "buy" | "sell";
  index: number;
}

const OrderCard = ({
  advertiser,
  completedTrades,
  completionRate,
  price,
  currency,
  crypto,
  available,
  minLimit,
  maxLimit,
  paymentMethods,
  type,
  index,
}: OrderCardProps) => {
  return (
    <div
      className="group rounded-lg border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.15)]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Advertiser Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {advertiser.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">{advertiser}</span>
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{completedTrades} trades</span>
              <span className="text-border">•</span>
              <span>{completionRate}% completion</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="sm:text-right">
          <div className="text-lg font-bold text-foreground">
            {price} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <span className="text-muted-foreground text-xs">Available</span>
          <p className="text-foreground font-medium">{available} {crypto}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Limit</span>
          <p className="text-foreground font-medium">{minLimit} – {maxLimit} {currency}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-muted-foreground text-xs">Payment</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-md bg-surface-3 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>15 min payment window</span>
        </div>
        <Button variant={type === "buy" ? "buy" : "sell"} size="sm">
          {type === "buy" ? "Buy" : "Sell"} {crypto}
        </Button>
      </div>
    </div>
  );
};

export default OrderCard;
