import { Play, Check, CheckCheck } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChatMessages";

interface MessageBubbleProps {
  msg: ChatMessage;
  onPreview: (url: string, type: string) => void;
}

const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const MessageBubble = ({ msg, onPreview }: MessageBubbleProps) => {
  return (
    <div className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
      {/* Attachment */}
      {msg.attachment_url && (
        <div
          className={`max-w-[85%] rounded-lg overflow-hidden mb-1 cursor-pointer ${
            msg.isOwn ? "bg-primary/10" : "bg-muted"
          }`}
          onClick={() => onPreview(msg.attachment_url!, msg.attachment_type || "image")}
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
              : "bg-muted text-foreground"
          }`}
        >
          {msg.message}
        </div>
      )}
      {/* Meta row */}
      <div className="flex items-center gap-1 mt-0.5 px-1">
        <span className="text-[10px] text-muted-foreground">
          {shortAddr(msg.sender_address)}
        </span>
        {msg.isOwn && (
          msg.read_at ? (
            <CheckCheck className="h-3 w-3 text-primary" />
          ) : (
            <Check className="h-3 w-3 text-muted-foreground" />
          )
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
