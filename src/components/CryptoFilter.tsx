import { useBnbPrice } from "@/hooks/useBnbPrice";
import { TrendingUp } from "lucide-react";

interface CryptoFilterProps {
  selected: string;
  onSelect: (crypto: string) => void;
}

const CRYPTOS = ["USDT", "BNB"];

const CryptoFilter = ({ selected, onSelect }: CryptoFilterProps) => {
  const { bnbPrice } = useBnbPrice(true);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {CRYPTOS.map((crypto) => (
        <button
          key={crypto}
          onClick={() => onSelect(crypto)}
          className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            selected === crypto
              ? "bg-primary text-primary-foreground"
              : "bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-surface-3"
          }`}
        >
          {crypto}
        </button>
      ))}

      {bnbPrice && (
        <div className="flex items-center gap-1.5 ml-2 rounded-md bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-buy" />
          <span>BNB</span>
          <span className="font-semibold text-foreground tabular-nums">${bnbPrice.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

export default CryptoFilter;
