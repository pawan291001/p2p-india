import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { P2P_CONTRACT_ADDRESS, USDT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI } from "@/config/abi";

const NATIVE_BNB = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export interface LiveAd {
  adId: number;
  seller: string;
  token: string;
  tokenSymbol: string;
  tokenAmount: string;
  pricePerToken: string;
  inrTotal: string;
  dealTimeout: number;
  adExpiry: number;
  paymentInfo: string;
  status: number;
}

export function useContractAds() {
  const { data: nextAdId, isLoading: loadingCount } = useReadContract({
    address: P2P_CONTRACT_ADDRESS,
    abi: P2P_ESCROW_ABI,
    functionName: "nextAdId",
    query: { refetchInterval: 5000 },
  });

  // nextAdId is the next ID to assign, so existing ads are 1..(nextAdId-1)
  const adCount = nextAdId ? Number(nextAdId) - 1 : 0;

  const adCalls = Array.from({ length: Math.max(0, adCount) }, (_, i) => ({
    address: P2P_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2P_ESCROW_ABI as any,
    functionName: "getAd" as const,
    args: [BigInt(i + 1)],
  }));

  const { data: adsData, isLoading: loadingAds, refetch: refetchAds } = useReadContracts({
    contracts: adCalls,
    query: { enabled: adCount > 0, refetchInterval: 5000 },
  });

  const ads: LiveAd[] = [];

  if (adsData) {
    for (const res of adsData) {
      if (res.status !== "success" || !res.result) continue;
      const ad = res.result as any;

      // Handle both named and positional access (v3: adDuration at index 7)
      const id = ad.id !== undefined ? ad.id : ad[0];
      const seller = ad.seller || ad[1];
      const tokenAddr = ad.token || ad[2];
      const tokenAmount = ad.tokenAmount !== undefined ? ad.tokenAmount : ad[3];
      const pricePerToken = ad.pricePerToken !== undefined ? ad.pricePerToken : ad[4];
      const dealTimeout = ad.dealTimeout !== undefined ? ad.dealTimeout : ad[5];
      const adExpiry = ad.adExpiry !== undefined ? ad.adExpiry : ad[6];
      // v3: adDuration is at index 7, paymentInfo at 8, status at 9
      const paymentInfo = ad.paymentInfo !== undefined ? ad.paymentInfo : ad[8];
      const status = ad.status !== undefined ? ad.status : ad[9];

      if (id === undefined || tokenAmount === undefined) continue;

      const isBNB = String(tokenAddr).toLowerCase() === NATIVE_BNB.toLowerCase();
      const tokenSymbol = isBNB ? "BNB" : "USDT";
      const amountFormatted = formatUnits(BigInt(String(tokenAmount)), 18);
      const priceFormatted = formatUnits(BigInt(String(pricePerToken)), 2);
      // inrTotal = tokenAmount * pricePerToken, both raw → combined 20 decimals
      const rawInrTotal = BigInt(String(tokenAmount)) * BigInt(String(pricePerToken));
      const inrTotal = parseFloat(formatUnits(rawInrTotal, 20)).toFixed(2);

      ads.push({
        adId: Number(id),
        seller: String(seller),
        token: String(tokenAddr),
        tokenSymbol,
        tokenAmount: amountFormatted,
        pricePerToken: priceFormatted,
        inrTotal,
        dealTimeout: Number(dealTimeout),
        adExpiry: Number(adExpiry),
        paymentInfo: String(paymentInfo),
        status: Number(status),
      });
    }
  }

  const refetch = () => { refetchAds(); };
  return { ads, isLoading: loadingCount || loadingAds, refetch };
}
