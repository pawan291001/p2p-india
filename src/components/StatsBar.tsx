import { TrendingUp, Users, ShieldCheck, Zap } from "lucide-react";

const stats = [
  { icon: TrendingUp, label: "24h Volume", value: "$4.2M" },
  { icon: Users, label: "Active Traders", value: "2,847" },
  { icon: ShieldCheck, label: "Escrow Protected", value: "100%" },
  { icon: Zap, label: "Avg. Settlement", value: "8 min" },
];

const StatsBar = () => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card p-4 animate-fade-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <stat.icon className="h-4 w-4 text-primary" />
            <span className="text-xs">{stat.label}</span>
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
