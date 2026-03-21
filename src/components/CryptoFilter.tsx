interface CryptoFilterProps {
  selected: string;
  onSelect: (crypto: string) => void;
}

const CRYPTOS = ["USDT", "BNB"];

const CryptoFilter = ({ selected, onSelect }: CryptoFilterProps) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
    </div>
  );
};

export default CryptoFilter;
