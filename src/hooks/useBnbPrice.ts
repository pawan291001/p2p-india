import { useState, useEffect } from "react";

/**
 * Fetches the live BNB/USD price from Binance public API.
 * Refreshes every 30 seconds.
 */
export function useBnbPrice(enabled = true) {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const fetchPrice = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) {
          setPrice(parseFloat(data.price));
        }
      } catch {
        // Fallback: try CoinGecko
        try {
          const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd");
          if (!res.ok) throw new Error("Failed");
          const data = await res.json();
          if (!cancelled) {
            setPrice(data.binancecoin?.usd ?? null);
          }
        } catch {
          // keep previous price
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [enabled]);

  return { bnbPrice: price, isLoading };
}
