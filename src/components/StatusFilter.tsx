import { Button } from "@/components/ui/button";

interface StatusFilterProps {
  options: { value: string; label: string; count?: number }[];
  selected: string;
  onSelect: (value: string) => void;
}

const StatusFilter = ({ options, selected, onSelect }: StatusFilterProps) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onSelect(opt.value)}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          selected === opt.value
            ? "bg-primary text-primary-foreground"
            : "bg-surface-3 text-muted-foreground hover:text-foreground"
        }`}
      >
        {opt.label}
        {opt.count !== undefined && (
          <span className={`ml-1.5 tabular-nums ${selected === opt.value ? "opacity-80" : "opacity-60"}`}>
            {opt.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default StatusFilter;
