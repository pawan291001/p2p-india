import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

function extractTag(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : "";
}

function parseRssItems(xml: string): Array<{ title: string; link: string; pubDate: string; description: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; description: string }> = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    let link = extractTag(itemXml, "link");
    // Some feeds put link as self-closing or empty — try guid as fallback
    if (!link || link.length < 5) {
      link = extractTag(itemXml, "guid");
    }
    const pubDate = extractTag(itemXml, "pubDate");
    const description = extractTag(itemXml, "description");

    if (title) {
      items.push({ title, link, pubDate, description });
    }
  }

  return items;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/&#\d+;/g, " ").replace(/\s+/g, " ").trim();
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
    const items = parseRssItems(xml);
    const articles: RssArticle[] = [];
    const cutoff = Date.now() - TWO_HOURS_MS;

    for (const item of items) {
      if (!item.pubDate) continue;
      const pubDate = new Date(item.pubDate);
      if (isNaN(pubDate.getTime()) || pubDate.getTime() < cutoff) continue;

      articles.push({
        title: stripHtml(item.title),
        link: item.link,
        pubDate: pubDate.toISOString(),
        description: item.description,
        source: sourceName,
      });
    }

    console.log(`${sourceName}: found ${articles.length} recent articles`);
    return articles;
  } catch (e) {
    console.error(`RSS error for ${sourceName}:`, e instanceof Error ? e.message : e);
    return [];
  }
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
    console.log(`Total RSS articles found (last 2h): ${allArticles.length}`);

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

    // 5. Take top 5 most recent
    const top = newArticles
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 5);

    let rows: any[];

    if (LOVABLE_API_KEY) {
      const articleList = top.map((a, i) =>
        `${i + 1}. Title: ${a.title}\nSource: ${a.source}\nURL: ${a.link}\nDescription: ${stripHtml(a.description).slice(0, 500)}`
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
- "content": 2-3 paragraph expanded summary based on the description

Return a JSON array in same order as input. Each object: {"category":"...","summary":"...","content":"..."}.
Return ONLY the JSON array, no markdown.`,
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
          console.error("AI categorization failed:", aiRes.status);
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
      JSON.stringify({ success: true, count: rows.length, sources: top.map((a) => `${a.source}: ${a.title}`) }),
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
