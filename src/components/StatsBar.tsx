import { TrendingUp, ShieldCheck, Wallet, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { USDT_ADDRESS } from "@/config/wagmi";
import { ERC20_ABI } from "@/config/abi";
import { useContractDeals } from "@/hooks/useContractDeals";
import { useMemo } from "react";

const StatsBar = () => {
  const { address, isConnected } = useAccount();
  const { data: bnbBalance } = useBalance({ address, query: { enabled: !!address } });
  const { deals } = useContractDeals();

  const { data: usdtRaw } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const bnbFormatted = bnbBalance ? parseFloat(formatUnits(bnbBalance.value, 18)).toFixed(4) : "0";
  const usdtFormatted = usdtRaw ? parseFloat(formatUnits(usdtRaw as bigint, 18)).toFixed(2) : "0";

  // Calculate volumes from completed deals (status 2 = completed)
  const { totalVolume, volume24h } = useMemo(() => {
    const completedDeals = deals.filter((d) => d.status === 2);
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 60 * 60;

    let total = 0;
    let last24h = 0;

    for (const deal of completedDeals) {
      const inr = parseFloat(deal.inrAmount) || 0;
      total += inr;
      // Use deadline as a proxy for completion time (deadline is set when deal was created)
      if (deal.deadline > oneDayAgo || deal.deadline > now - 48 * 60 * 60) {
        last24h += inr;
      }
    }

    return { totalVolume: total, volume24h: last24h };
  }, [deals]);

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toFixed(0)}`;
  };

  const stats = [
    {
      icon: Wallet,
      label: "BNB Balance",
      value: isConnected ? `${bnbFormatted} BNB` : "—",
    },
    {
      icon: Wallet,
      label: "USDT Balance",
      value: isConnected ? `${usdtFormatted} USDT` : "—",
    },
    {
      icon: BarChart3,
      label: "Total Volume",
      value: formatINR(totalVolume),
    },
    {
      icon: Clock,
      label: "24h Volume",
      value: formatINR(volume24h),
    },
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
