import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  deal_id: number;
  sender_address: string;
  message: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  read_at: string | null;
  isOwn: boolean;
}

export function useChatMessages(dealId: number, userAddress: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("deal_messages")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch messages:", error);
      return;
    }

    setMessages(
      (data || []).map((msg: any) => ({
        ...msg,
        isOwn: msg.sender_address.toLowerCase() === userAddress.toLowerCase(),
      }))
    );
  }, [dealId, userAddress]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`deal-chat-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_messages",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                ...newMsg,
                isOwn: newMsg.sender_address.toLowerCase() === userAddress.toLowerCase(),
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deal_messages",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id ? { ...m, read_at: updated.read_at } : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, userAddress]);

  // Mark unread messages from the other party as read
  const markAsRead = useCallback(async () => {
    const unread = messages.filter((m) => !m.isOwn && !m.read_at);
    if (unread.length === 0) return;

    const ids = unread.map((m) => m.id);
    await supabase
      .from("deal_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
  }, [messages]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  return { messages, setMessages };
}
