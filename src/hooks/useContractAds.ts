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
    query: { refetchInterval: 10000 },
  });

  const adCount = nextAdId ? Number(nextAdId) : 0;

  const adCalls = Array.from({ length: adCount }, (_, i) => ({
    address: P2P_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2P_ESCROW_ABI as any,
    functionName: "getAd" as const,
    args: [BigInt(i + 1)],
  }));

  const { data: adsData, isLoading: loadingAds } = useReadContracts({
    contracts: adCalls,
    query: { enabled: adCount > 0, refetchInterval: 10000 },
  });

  const ads: LiveAd[] = [];

  if (adsData) {
    for (const res of adsData) {
      if (res.status !== "success" || !res.result) continue;
      const ad = res.result as any;
      const tokenAddr = ad.token || ad[2];
      const seller = ad.seller || ad[1];
      const tokenAmount = ad.tokenAmount || ad[3];
      const pricePerToken = ad.pricePerToken || ad[4];
      const dealTimeout = ad.dealTimeout || ad[5];
      const adExpiry = ad.adExpiry || ad[6];
      const paymentInfo = ad.paymentInfo || ad[7];
      const status = Number(ad.status ?? ad[8]);
      const id = Number(ad.id ?? ad[0]);

      const isBNB = tokenAddr.toLowerCase() === NATIVE_BNB.toLowerCase();
      const tokenSymbol = isBNB ? "BNB" : "USDT";
      const amountFormatted = formatUnits(BigInt(tokenAmount), 18);
      const priceFormatted = formatUnits(BigInt(pricePerToken), 2);
      const inrTotal = (parseFloat(amountFormatted) * parseFloat(priceFormatted)).toFixed(2);

      ads.push({
        adId: id,
        seller,
        token: tokenAddr,
        tokenSymbol,
        tokenAmount: amountFormatted,
        pricePerToken: priceFormatted,
        inrTotal,
        dealTimeout: Number(dealTimeout),
        adExpiry: Number(adExpiry),
        paymentInfo,
        status,
      });
    }
  }

  return { ads, isLoading: loadingCount || loadingAds };
}
