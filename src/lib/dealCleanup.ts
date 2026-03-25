import { supabase } from "@/integrations/supabase/client";

/**
 * Triggers cleanup of deal chat attachments (images/videos) after a deal ends.
 * Text messages are preserved but media files are deleted from storage.
 */
export async function cleanupDealAttachments(dealId: number) {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    await fetch(
      `https://${projectId}.supabase.co/functions/v1/cleanup-deal-attachments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      }
    );
  } catch (err) {
    console.error("Deal attachment cleanup failed:", err);
  }
}
