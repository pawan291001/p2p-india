import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTypingIndicator(dealId: number, userAddress: string) {
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendThrottleRef = useRef<number>(0);

  useEffect(() => {
    const channel = supabase.channel(`typing-${dealId}`, {
      config: { presence: { key: userAddress.toLowerCase() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const partnerTyping = Object.entries(state).some(
          ([key, values]) =>
            key !== userAddress.toLowerCase() &&
            (values as any[]).some((v) => v.typing === true)
        );
        setIsPartnerTyping(partnerTyping);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ typing: false });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [dealId, userAddress]);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - sendThrottleRef.current < 2000) return;
    sendThrottleRef.current = now;

    channelRef.current?.track({ typing: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ typing: false });
    }, 3000);
  }, []);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    channelRef.current?.track({ typing: false });
  }, []);

  return { isPartnerTyping, sendTyping, stopTyping };
}
