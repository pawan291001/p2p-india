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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing titles from last 48h to avoid duplicates
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("crypto_news")
      .select("title")
      .gte("published_at", since);

    const existingTitles = (existing || []).map((r: any) => r.title);

    // Use Lovable AI with a model that has recent knowledge
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a crypto news journalist with access to real-time information. Your job is to report ONLY real, factual cryptocurrency news that has actually happened recently. 

CRITICAL RULES:
- Report ONLY real events you are confident actually happened
- Include specific details: names, amounts, dates, protocols involved
- Focus on: hacks, exploits, scams, major price movements, regulatory actions, exchange issues, protocol bugs, whale movements, significant partnerships, token launches, airdrops, court cases, SEC actions
- Each article MUST include real source references (e.g., "Source: CoinDesk", "Source: @whale_alert on X", "Source: The Block")
- Do NOT fabricate or hallucinate any news
- If unsure about something, skip it

Return a JSON array with exactly 3 articles. Each object must have:
- "title": headline (max 120 chars)
- "summary": 1-2 sentence summary (max 250 chars) 
- "content": full article (3-5 paragraphs with real details)
- "category": one of "bitcoin", "ethereum", "defi", "regulation", "market", "technology", "security", "general"
- "sources": array of strings like ["CoinDesk", "CoinTelegraph", "The Block", "@username on X"]

Return ONLY the JSON array. No markdown.`
          },
          {
            role: "user",
            content: `Report the 3 most significant and recent cryptocurrency news stories. Focus on real events: security breaches, major hacks, scam alerts, big price swings, regulatory crackdowns, protocol vulnerabilities, whale dumps/pumps, exchange delistings, legal cases, or any major market-moving events.

${existingTitles.length > 0 ? `SKIP these already-reported stories:\n${existingTitles.map((t: string) => `- ${t}`).join("\n")}` : ""}

Remember: Only factual news with real source attribution.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    console.log("AI response length:", content.length);

    let articles: any[];
    try {
      articles = JSON.parse(content);
    } catch {
      console.error("Failed to parse:", content.substring(0, 300));
      return new Response(JSON.stringify({ error: "Failed to parse articles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(articles) || articles.length === 0) {
      return new Response(JSON.stringify({ error: "No articles generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter duplicates
    const newArticles = articles.filter(
      (a: any) => !existingTitles.some((t: string) => t.toLowerCase() === a.title?.toLowerCase())
    );

    if (newArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: "No new unique articles" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = newArticles.map((a: any) => {
      // Build source string from the sources array
      const sources = a.sources || [];
      const sourceStr = sources.length > 0 ? sources.join(", ") : "Crypto News Aggregator";

      return {
        title: a.title,
        summary: a.summary,
        content: a.content,
        category: a.category || "general",
        source: sourceStr,
        image_url: null,
        published_at: new Date().toISOString(),
      };
    });

    const { error: insertError } = await supabase.from("crypto_news").insert(rows);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Saved ${rows.length} articles`);
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
