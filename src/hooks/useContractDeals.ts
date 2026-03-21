import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { P2P_CONTRACT_ADDRESS, USDT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI } from "@/config/abi";

const NATIVE_BNB = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export interface LiveDeal {
  dealId: number;
  adId: number;
  buyer: string;
  seller: string;
  token: string;
  tokenSymbol: string;
  tokenAmount: string;
  inrAmount: string;
  deadline: number;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  status: number;
}

export function useContractDeals() {
  const { data: nextDealId, isLoading: loadingCount } = useReadContract({
    address: P2P_CONTRACT_ADDRESS,
    abi: P2P_ESCROW_ABI,
    functionName: "nextDealId",
    query: { refetchInterval: 10000 },
  });

  const dealCount = nextDealId ? Number(nextDealId) - 1 : 0;

  const dealCalls = Array.from({ length: Math.max(0, dealCount) }, (_, i) => ({
    address: P2P_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2P_ESCROW_ABI as any,
    functionName: "getDeal" as const,
    args: [BigInt(i + 1)],
  }));

  const { data: dealsData, isLoading: loadingDeals } = useReadContracts({
    contracts: dealCalls,
    query: { enabled: dealCount > 0, refetchInterval: 10000 },
  });

  const deals: LiveDeal[] = [];

  if (dealsData) {
    for (const res of dealsData) {
      if (res.status !== "success" || !res.result) continue;
      const d = res.result as any;
      const tokenAddr = d.token || d[4];
      const isBNB = tokenAddr.toLowerCase() === NATIVE_BNB.toLowerCase();

      deals.push({
        dealId: Number(d.id ?? d[0]),
        adId: Number(d.adId ?? d[1]),
        buyer: d.buyer || d[2],
        seller: d.seller || d[3],
        token: tokenAddr,
        tokenSymbol: isBNB ? "BNB" : "USDT",
        tokenAmount: formatUnits(BigInt(d.tokenAmount || d[5]), 18),
        inrAmount: formatUnits(BigInt(d.inrAmount || d[6]), 2),
        deadline: Number(d.deadline || d[7]),
        buyerConfirmed: Boolean(d.buyerConfirmed ?? d[8]),
        sellerConfirmed: Boolean(d.sellerConfirmed ?? d[9]),
        status: Number(d.status ?? d[10]),
      });
    }
  }

  return { deals, isLoading: loadingCount || loadingDeals };
}
