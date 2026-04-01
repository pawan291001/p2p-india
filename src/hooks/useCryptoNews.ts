import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  image_url: string | null;
  source: string;
  published_at: string;
}

export function useCryptoNews(limit = 6) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("crypto_news")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(limit);
      setArticles((data as NewsArticle[]) || []);
      setIsLoading(false);
    };
    fetch();

    // Realtime subscription for new articles
    const channel = supabase
      .channel("crypto-news-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "crypto_news" },
        (payload) => {
          setArticles((prev) => [payload.new as NewsArticle, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { articles, isLoading };
}
