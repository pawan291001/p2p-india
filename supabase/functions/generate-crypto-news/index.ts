import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RSS_FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", name: "CoinTelegraph" },
  { url: "https://bitcoinmagazine.com/feed", name: "Bitcoin Magazine" },
  { url: "https://decrypt.co/feed", name: "Decrypt" },
  { url: "https://www.theblock.co/rss.xml", name: "The Block" },
];

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

interface RssArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

async function fetchRssFeed(feedUrl: string, sourceName: string): Promise<RssArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "CryptoNewsBot/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`RSS fetch failed for ${sourceName}: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    if (!doc) return [];

    const items = doc.querySelectorAll("item");
    const articles: RssArticle[] = [];
    const cutoff = Date.now() - TWO_HOURS_MS;

    for (const item of items) {
      const title = item.querySelector("title")?.textContent?.trim() || "";
      const link = item.querySelector("link")?.textContent?.trim() || "";
      const pubDateStr = item.querySelector("pubDate")?.textContent?.trim() || "";
      const description = item.querySelector("description")?.textContent?.trim() || "";

      if (!title || !pubDateStr) continue;

      const pubDate = new Date(pubDateStr);
      if (isNaN(pubDate.getTime()) || pubDate.getTime() < cutoff) continue;

      articles.push({ title, link, pubDate: pubDate.toISOString(), description, source: sourceName });
    }

    console.log(`${sourceName}: found ${articles.length} recent articles`);
    return articles;
  } catch (e) {
    console.error(`RSS error for ${sourceName}:`, e instanceof Error ? e.message : e);
    return [];
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // 1. Cleanup: delete articles older than 4 days
    const fourDaysAgo = new Date(Date.now() - FOUR_DAYS_MS).toISOString();
    const { error: delError } = await supabase
      .from("crypto_news")
      .delete()
      .lt("published_at", fourDaysAgo);
    if (delError) console.error("Cleanup error:", delError);
    else console.log("Cleaned up articles older than 4 days");

    // 2. Get existing titles to deduplicate
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("crypto_news")
      .select("title")
      .gte("published_at", since);
    const existingTitles = new Set((existing || []).map((r: any) => r.title.toLowerCase()));

    // 3. Fetch all RSS feeds in parallel
    const feedResults = await Promise.all(
      RSS_FEEDS.map((f) => fetchRssFeed(f.url, f.name))
    );
    const allArticles = feedResults.flat();

    // 4. Deduplicate
    const newArticles = allArticles.filter(
      (a) => !existingTitles.has(a.title.toLowerCase())
    );

    if (newArticles.length === 0) {
      console.log("No new articles from RSS feeds");
      return new Response(
        JSON.stringify({ success: true, count: 0, message: "No new articles from RSS" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Take top 5 most recent, use AI to categorize and summarize
    const top = newArticles
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 5);

    let rows: any[];

    if (LOVABLE_API_KEY) {
      // Use AI to categorize and generate clean summaries
      const articleList = top.map((a, i) =>
        `${i + 1}. Title: ${a.title}\nSource: ${a.source}\nDescription: ${stripHtml(a.description).slice(0, 500)}`
      ).join("\n\n");

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You categorize and summarize crypto news articles. For each article, return:
- "category": one of "bitcoin", "ethereum", "defi", "regulation", "market", "technology", "security", "general"
- "summary": 1-2 sentence summary (max 200 chars)
- "content": 2-3 paragraph expanded article based on the description provided

Return a JSON array with objects in the same order as input. Each object: {"category": "...", "summary": "...", "content": "..."}.
Return ONLY the JSON array.`,
              },
              { role: "user", content: articleList },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          let content = aiData.choices?.[0]?.message?.content || "";
          content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          const parsed = JSON.parse(content);

          rows = top.map((a, i) => ({
            title: a.title,
            summary: parsed[i]?.summary || stripHtml(a.description).slice(0, 200),
            content: parsed[i]?.content || stripHtml(a.description),
            category: parsed[i]?.category || "general",
            source: a.link || a.source,
            image_url: null,
            published_at: a.pubDate,
          }));
        } else {
          console.error("AI categorization failed, using raw data:", aiRes.status);
          rows = top.map((a) => ({
            title: a.title,
            summary: stripHtml(a.description).slice(0, 200),
            content: stripHtml(a.description),
            category: "general",
            source: a.link || a.source,
            image_url: null,
            published_at: a.pubDate,
          }));
        }
      } catch (aiErr) {
        console.error("AI error:", aiErr);
        rows = top.map((a) => ({
          title: a.title,
          summary: stripHtml(a.description).slice(0, 200),
          content: stripHtml(a.description),
          category: "general",
          source: a.link || a.source,
          image_url: null,
          published_at: a.pubDate,
        }));
      }
    } else {
      // No AI key, store raw
      rows = top.map((a) => ({
        title: a.title,
        summary: stripHtml(a.description).slice(0, 200),
        content: stripHtml(a.description),
        category: "general",
        source: a.link || a.source,
        image_url: null,
        published_at: a.pubDate,
      }));
    }

    const { error: insertError } = await supabase.from("crypto_news").insert(rows);
    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Saved ${rows.length} real news articles from RSS feeds`);
    return new Response(
      JSON.stringify({ success: true, count: rows.length, sources: top.map((a) => a.source) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
