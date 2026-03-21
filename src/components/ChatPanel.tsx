import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
  isOwn: boolean;
}

interface ChatPanelProps {
  dealId: number;
  userAddress: string;
}

const ChatPanel = ({ dealId, userAddress }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    // In production: call contract.sendChat(dealId, input)
    setMessages((prev) => [
      ...prev,
      {
        sender: userAddress,
        message: input.trim(),
        timestamp: Date.now() / 1000,
        isOwn: true,
      },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Deal Chat</p>
        <p className="text-xs text-muted-foreground">Messages are stored on-chain</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground text-center px-4">
              No messages yet. Say hi to your trade partner.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-3 text-foreground"
              }`}
            >
              {msg.message}
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
              {shortAddr(msg.sender)}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-surface-2 border-input text-sm"
            maxLength={500}
          />
          <Button size="icon" onClick={sendMessage} disabled={!input.trim()} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
