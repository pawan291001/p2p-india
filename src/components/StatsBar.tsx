import { TrendingUp, ShieldCheck, Zap, Wallet } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { USDT_ADDRESS } from "@/config/wagmi";
import { ERC20_ABI } from "@/config/abi";

const StatsBar = () => {
  const { address, isConnected } = useAccount();
  const { data: bnbBalance } = useBalance({ address, query: { enabled: !!address } });

  const { data: usdtRaw } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const bnbFormatted = bnbBalance ? parseFloat(formatUnits(bnbBalance.value, 18)).toFixed(4) : "0";
  const usdtFormatted = usdtRaw ? parseFloat(formatUnits(usdtRaw as bigint, 18)).toFixed(2) : "0";

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
    { icon: TrendingUp, label: "Network", value: isConnected ? "BSC Mainnet" : "Not Connected" },
    { icon: ShieldCheck, label: "Escrow", value: "Smart Contract" },
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
