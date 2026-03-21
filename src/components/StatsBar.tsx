import { TrendingUp, ShieldCheck, Zap, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

const StatsBar = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const stats = [
    {
      icon: Wallet,
      label: "Your Balance",
      value: isConnected && balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "—",
    },
    { icon: TrendingUp, label: "Network", value: isConnected ? "BSC Mainnet" : "Not Connected" },
    { icon: ShieldCheck, label: "Escrow", value: "Smart Contract" },
    { icon: Zap, label: "Tokens", value: "BNB · USDT" },
  ];

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
          <p className="text-sm font-bold text-foreground tabular-nums truncate">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
