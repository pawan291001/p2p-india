import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGlobalUnreadCount(userAddress: string | undefined) {
  const [count, setCount] = useState(0);
  const addressRef = useRef(userAddress);
  addressRef.current = userAddress;

  useEffect(() => {
    if (!userAddress) { setCount(0); return; }
    const addr = userAddress.toLowerCase();

    const fetchCount = async () => {
      const { count: total, error } = await supabase
        .from("deal_messages")
        .select("*", { count: "exact", head: true })
        .neq("sender_address", addr)
        .is("read_at", null);
      if (!error && total !== null) setCount(total);
    };

    fetchCount();

    const channelName = `global-unread-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_messages" }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userAddress]);

  return count;
}
