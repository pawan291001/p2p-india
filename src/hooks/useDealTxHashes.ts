import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { P2P_CONTRACT_ADDRESS } from "@/config/wagmi";

export interface DealTxInfo {
  created?: string;
  buyerConfirmed?: string;
  sellerConfirmed?: string;
  completed?: string;
  cancelled?: string;
  disputed?: string;
  resolved?: string;
}

export interface DealTxMap {
  [dealId: number]: DealTxInfo;
}

const EVENTS = [
  { name: "created", abi: parseAbiItem("event DealCreated(uint256 indexed dealId, uint256 indexed adId, address indexed buyer, uint256 inrAmount, uint256 deadline)") },
  { name: "buyerConfirmed", abi: parseAbiItem("event BuyerConfirmedPayment(uint256 indexed dealId)") },
  { name: "sellerConfirmed", abi: parseAbiItem("event SellerConfirmedReceipt(uint256 indexed dealId)") },
  { name: "completed", abi: parseAbiItem("event DealCompleted(uint256 indexed dealId)") },
  { name: "cancelled", abi: parseAbiItem("event DealCancelled(uint256 indexed dealId, string reason)") },
  { name: "disputed", abi: parseAbiItem("event DealDisputed(uint256 indexed dealId, address indexed by)") },
  { name: "resolved", abi: parseAbiItem("event DisputeResolved(uint256 indexed dealId, address indexed recipient)") },
] as const;

export function useDealTxHashes(dealIds: number[]): DealTxMap {
  const client = usePublicClient();
  const [txMap, setTxMap] = useState<DealTxMap>({});

  useEffect(() => {
    if (!client || dealIds.length === 0) return;

    const key = dealIds.sort().join(",");
    let cancelled = false;

    (async () => {
      const map: DealTxMap = {};

      // Fetch logs for all events in parallel
      const results = await Promise.allSettled(
        EVENTS.map((evt) =>
          client.getLogs({
            address: P2P_CONTRACT_ADDRESS,
            event: evt.abi as any,
            fromBlock: "earliest",
            toBlock: "latest",
          }).then((logs) => ({ name: evt.name, logs }))
        )
      );

      for (const res of results) {
        if (res.status !== "fulfilled") continue;
        const { name, logs } = res.value;
        for (const log of logs) {
          const dealId = Number((log as any).args?.dealId);
          if (!dealIds.includes(dealId)) continue;
          if (!map[dealId]) map[dealId] = {};
          (map[dealId] as any)[name] = log.transactionHash;
        }
      }

      if (!cancelled) setTxMap(map);
    })();

    return () => { cancelled = true; };
  }, [client, dealIds.join(",")]);

  return txMap;
}
