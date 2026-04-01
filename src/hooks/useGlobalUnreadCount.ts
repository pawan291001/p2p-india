import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGlobalUnreadCount(userAddress: string | undefined) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userAddress) { setCount(0); return; }
    const addr = userAddress.toLowerCase();

    const { count: total, error } = await supabase
      .from("deal_messages")
      .select("*", { count: "exact", head: true })
      .neq("sender_address", addr)
      .is("read_at", null);

    if (!error && total !== null) setCount(total);
  }, [userAddress]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  useEffect(() => {
    if (!userAddress) return;
    const channel = supabase
      .channel("global-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_messages" }, () => fetchCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userAddress, fetchCount]);

  return count;
}
