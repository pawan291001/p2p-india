import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId } = await req.json();
    if (!dealId) {
      return new Response(JSON.stringify({ error: "Missing dealId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Delete all files in the deal folder
    const folderPath = `deal-${dealId}/`;
    const { data: files } = await supabase.storage
      .from("deal-attachments")
      .list(folderPath);

    if (files && files.length > 0) {
      const filePaths = files.map((f: any) => `${folderPath}${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from("deal-attachments")
        .remove(filePaths);

      if (deleteError) {
        console.error("Delete error:", deleteError);
      }
    }

    // Clear attachment URLs from messages (keep text messages)
    await supabase
      .from("deal_messages")
      .update({ attachment_url: null, attachment_type: null })
      .eq("deal_id", dealId)
      .not("attachment_url", "is", null);

    return new Response(
      JSON.stringify({ success: true, deleted: files?.length || 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
