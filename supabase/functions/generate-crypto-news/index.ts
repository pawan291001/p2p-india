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

    // Get existing titles from last 24h to avoid duplicates
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("crypto_news")
      .select("title")
      .gte("published_at", since);

    const existingTitles = (existing || []).map((r: any) => r.title).join(", ");

    const prompt = `You are a crypto news journalist. Generate 3 NEW and UNIQUE crypto news articles about the latest developments in cryptocurrency, blockchain, DeFi, Bitcoin, Ethereum, BNB, and related topics.

${existingTitles ? `IMPORTANT: Do NOT repeat these existing titles: ${existingTitles}` : ""}

Each article should be current, realistic, and informative. Return a JSON array with exactly 3 objects, each having:
- "title": catchy headline (max 100 chars)
- "summary": 1-2 sentence summary (max 200 chars)
- "content": full article (300-500 words, with paragraphs)
- "category": one of "bitcoin", "ethereum", "defi", "regulation", "market", "technology", "nft", "general"

Return ONLY the JSON array, no other text.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a crypto news content generator. Always return valid JSON arrays." },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error", status: aiResponse.status }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Clean markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let articles: any[];
    try {
      articles = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
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

    // Insert articles
    const rows = articles.map((a: any) => ({
      title: a.title,
      summary: a.summary,
      content: a.content,
      category: a.category || "general",
      source: "AI Generated",
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
