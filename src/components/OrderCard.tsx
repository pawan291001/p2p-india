import { Button } from "@/components/ui/button";
import { Shield, Clock } from "lucide-react";

interface OrderCardProps {
  adId: number;
  seller: string;
  tokenSymbol: string;
  tokenAmount: string;
  pricePerToken: string;
  inrTotal: string;
  dealTimeout: number;
  paymentInfo: string;
  onTrade: () => void;
  index: number;
}

const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const formatTimeout = (seconds: number) => {
  if (seconds >= 3600) return `${seconds / 3600}h`;
  return `${seconds / 60} min`;
};

const OrderCard = ({
  seller,
  tokenSymbol,
  tokenAmount,
  pricePerToken,
  inrTotal,
  dealTimeout,
  paymentInfo,
  onTrade,
  index,
}: OrderCardProps) => {
  return (
    <div
      className="group rounded-lg border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.15)] animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Seller Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {seller.slice(2, 4).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground font-mono text-sm">{shortAddr(seller)}</span>
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="sm:text-right">
          <div className="text-lg font-bold text-foreground tabular-nums">
            ₹{pricePerToken} <span className="text-sm font-normal text-muted-foreground">INR</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <span className="text-muted-foreground text-xs">Available</span>
          <p className="text-foreground font-medium tabular-nums">{tokenAmount} {tokenSymbol}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Total (INR)</span>
          <p className="text-foreground font-medium tabular-nums">₹{inrTotal}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-muted-foreground text-xs">Payment</span>
          <p className="text-foreground text-xs mt-1 truncate">{paymentInfo}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTimeout(dealTimeout)} payment window</span>
        </div>
        <Button variant="buy" size="sm" onClick={onTrade}>
          Buy {tokenSymbol}
        </Button>
      </div>
    </div>
  );
};

export default OrderCard;
