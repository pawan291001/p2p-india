import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Image as ImageIcon, Video, X, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  deal_id: number;
  sender_address: string;
  message: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  isOwn: boolean;
}

interface ChatPanelProps {
  dealId: number;
  userAddress: string;
  readOnly?: boolean;
  onDealClosed?: boolean;
}

const ChatPanel = ({ dealId, userAddress, readOnly = false, onDealClosed = false }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, userAddress]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Cleanup when deal closes
  useEffect(() => {
    if (onDealClosed) {
      const cleanup = async () => {
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
          console.error("Cleanup failed:", err);
        }
      };
      cleanup();
    }
  }, [onDealClosed, dealId]);

  // Send text message
  const handleSend = async () => {
    if (!input.trim() || readOnly || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");

    const { error } = await supabase.from("deal_messages").insert({
      deal_id: dealId,
      sender_address: userAddress,
      message: text,
    });

    if (error) {
      toast.error("Failed to send message");
      setInput(text);
    }
    setSending(false);
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || readOnly) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dealId", String(dealId));

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/upload-attachment`,
        { method: "POST", body: formData }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");

      // Insert message with attachment
      const { error } = await supabase.from("deal_messages").insert({
        deal_id: dealId,
        sender_address: userAddress,
        attachment_url: result.url,
        attachment_type: result.type,
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Deal #{dealId} Chat</p>
        <p className="text-xs text-muted-foreground">
          {readOnly ? "View-only — messages stored off-chain" : "Real-time off-chain messaging"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground text-center px-4">
              {readOnly ? "No messages between parties yet." : "No messages yet. Say hi to your trade partner."}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
            {/* Attachment */}
            {msg.attachment_url && (
              <div
                className={`max-w-[85%] rounded-lg overflow-hidden mb-1 cursor-pointer ${
                  msg.isOwn ? "bg-primary/10" : "bg-surface-3"
                }`}
                onClick={() =>
                  setPreviewFile({ url: msg.attachment_url!, type: msg.attachment_type || "image" })
                }
              >
                {msg.attachment_type === "video" ? (
                  <div className="relative w-48 h-32 bg-black/20 flex items-center justify-center">
                    <video src={msg.attachment_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={msg.attachment_url}
                    alt="Attachment"
                    className="max-w-48 max-h-48 object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            )}
            {/* Text */}
            {msg.message && (
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-3 text-foreground"
                }`}
              >
                {msg.message}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
              {shortAddr(msg.sender_address)}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!readOnly && (
        <div className="border-t border-border p-3">
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="shrink-0 h-9 w-9"
              title="Upload image or video"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="bg-surface-2 border-input text-sm"
              maxLength={500}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 h-9 w-9"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Full-screen preview */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setPreviewFile(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          {previewFile.type === "video" ? (
            <video
              src={previewFile.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewFile.url}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
