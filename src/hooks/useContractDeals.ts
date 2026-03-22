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
    query: { refetchInterval: 5000 },
  });

  const dealCount = nextDealId ? Number(nextDealId) - 1 : 0;

  const dealCalls = Array.from({ length: Math.max(0, dealCount) }, (_, i) => ({
    address: P2P_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2P_ESCROW_ABI as any,
    functionName: "getDeal" as const,
    args: [BigInt(i + 1)],
  }));

  const { data: dealsData, isLoading: loadingDeals, refetch: refetchDeals } = useReadContracts({
    contracts: dealCalls,
    query: { enabled: dealCount > 0, refetchInterval: 5000 },
  });

  const deals: LiveDeal[] = [];

  if (dealsData) {
    for (const res of dealsData) {
      if (res.status !== "success" || !res.result) continue;
      const d = res.result as any;
      const tokenAddr = d.token || d[4];
      const isBNB = tokenAddr.toLowerCase() === NATIVE_BNB.toLowerCase();

      const rawId = d.id !== undefined ? d.id : d[0];
      const rawAdId = d.adId !== undefined ? d.adId : d[1];
      const rawBuyer = d.buyer || d[2];
      const rawSeller = d.seller || d[3];
      const rawTokenAmount = d.tokenAmount !== undefined ? d.tokenAmount : d[5];
      const rawInrAmount = d.inrAmount !== undefined ? d.inrAmount : d[6];
      const rawDeadline = d.deadline !== undefined ? d.deadline : d[7];
      const rawBuyerConfirmed = d.buyerConfirmed !== undefined ? d.buyerConfirmed : d[8];
      const rawSellerConfirmed = d.sellerConfirmed !== undefined ? d.sellerConfirmed : d[9];
      const rawStatus = d.status !== undefined ? d.status : d[10];

      if (rawId === undefined || rawTokenAmount === undefined) continue;

      // inrAmount = tokenAmount * pricePerToken (no division in contract)
      // tokenAmount has 18 decimals, pricePerToken has 2 decimals → total 20 decimals
      const inrBigInt = BigInt(String(rawInrAmount));
      const inrFormatted = parseFloat(formatUnits(inrBigInt, 20)).toFixed(2);

      deals.push({
        dealId: Number(rawId),
        adId: Number(rawAdId),
        buyer: String(rawBuyer),
        seller: String(rawSeller),
        token: String(tokenAddr),
        tokenSymbol: isBNB ? "BNB" : "USDT",
        tokenAmount: formatUnits(BigInt(String(rawTokenAmount)), 18),
        inrAmount: inrFormatted,
        deadline: Number(rawDeadline),
        buyerConfirmed: Boolean(rawBuyerConfirmed),
        sellerConfirmed: Boolean(rawSellerConfirmed),
        status: Number(rawStatus),
      });
    }
  }

  const refetch = () => { refetchDeals(); };
  return { deals, isLoading: loadingCount || loadingDeals, refetch };
}
