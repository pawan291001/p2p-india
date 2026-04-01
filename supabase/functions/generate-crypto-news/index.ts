import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing titles from last 24h to avoid duplicates
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("crypto_news")
      .select("title")
      .gte("published_at", since);

    const existingTitles = (existing || []).map((r: any) => r.title);

    // Step 1: Use Perplexity to search for REAL crypto news
    const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a crypto news researcher. Find the latest breaking cryptocurrency news from the last few hours. Focus on major events: hacks, scams, security breaches, major price movements (pumps/dumps), regulatory actions, protocol bugs, exchange issues, whale movements, major partnerships, and any significant market-moving events. Report ONLY real, verified news."
          },
          {
            role: "user",
            content: `Find the top 5 most important and recent cryptocurrency news stories from the last few hours. Include news about Bitcoin, Ethereum, BNB, DeFi hacks, scams, major dumps/pumps, regulatory news, security vulnerabilities, and any breaking crypto events from X/Twitter, CoinDesk, CoinTelegraph, The Block, Decrypt, or other major crypto sources.

${existingTitles.length > 0 ? `DO NOT repeat any of these stories we already have: ${existingTitles.join(" | ")}` : ""}

For each story provide:
1. The exact headline
2. A detailed summary (2-3 sentences)
3. The full story details (3-5 paragraphs)
4. Category: one of "bitcoin", "ethereum", "defi", "regulation", "market", "technology", "security", "general"

Return ONLY factual news that actually happened. Do not make up or fabricate any news.`
          }
        ],
        search_recency_filter: "day",
      }),
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Perplexity error:", searchResponse.status, errText);
      return new Response(JSON.stringify({ error: "Search API error", status: searchResponse.status }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchData = await searchResponse.json();
    const newsContent = searchData.choices?.[0]?.message?.content || "";
    const citations = searchData.citations || [];

    console.log("Perplexity citations:", JSON.stringify(citations));
    console.log("Raw news content length:", newsContent.length);

    // Step 2: Use Lovable AI to structure the news into JSON
    const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You convert news articles into structured JSON. Return ONLY a valid JSON array, no markdown formatting."
          },
          {
            role: "user",
            content: `Convert the following real crypto news into a JSON array. Each object must have:
- "title": the headline (max 120 chars)
- "summary": 1-2 sentence summary (max 250 chars)
- "content": full article text with multiple paragraphs separated by newlines
- "category": one of "bitcoin", "ethereum", "defi", "regulation", "market", "technology", "security", "general"
- "source_urls": array of source URLs related to this news

Here are source URLs found by the search (assign relevant ones to each article):
${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}

Here is the news content:
${newsContent}

Return ONLY a JSON array with 3-5 articles. No markdown code blocks.`
          }
        ],
      }),
    });

    if (!structureResponse.ok) {
      const errText = await structureResponse.text();
      console.error("AI gateway error:", structureResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI structuring error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const structureData = await structureResponse.json();
    let content = structureData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let articles: any[];
    try {
      articles = JSON.parse(content);
    } catch {
      console.error("Failed to parse:", content.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse articles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(articles) || articles.length === 0) {
      return new Response(JSON.stringify({ error: "No articles parsed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out duplicates
    const newArticles = articles.filter(
      (a: any) => !existingTitles.some((t: string) => t.toLowerCase() === a.title?.toLowerCase())
    );

    if (newArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: "No new unique articles" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always use Perplexity citations as source — these are the real sources
    const allCitationsStr = citations.length > 0 ? citations.filter((c: string) => c.startsWith("http")).join(",") : "Web Search";
    console.log("Using source string:", allCitationsStr);

    const rows = newArticles.map((a: any) => ({
      title: a.title,
      summary: a.summary,
      content: a.content,
      category: a.category || "general",
      source: allCitationsStr,
      image_url: null,
      published_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from("crypto_news").insert(rows);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save articles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, count: rows.length }),
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
