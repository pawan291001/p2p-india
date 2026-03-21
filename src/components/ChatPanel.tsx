import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { P2P_CONTRACT_ADDRESS } from "@/config/wagmi";
import { P2P_ESCROW_ABI } from "@/config/abi";

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
  isOwn: boolean;
}

interface ChatPanelProps {
  dealId: number;
  userAddress: string;
  readOnly?: boolean;
}

const ChatPanel = ({ dealId, userAddress, readOnly = false }: ChatPanelProps) => {
  const [optimisticMsgs, setOptimisticMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Read chat count
  const { data: chatCount } = useReadContract({
    address: P2P_CONTRACT_ADDRESS,
    abi: P2P_ESCROW_ABI,
    functionName: "getChatCount",
    args: [BigInt(dealId)],
    query: { refetchInterval: 5000 },
  });

  const count = chatCount ? Number(chatCount) : 0;

  // Build multicall to read all messages
  const chatCalls = Array.from({ length: Math.min(count, 50) }, (_, i) => ({
    address: P2P_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2P_ESCROW_ABI,
    functionName: "getChatMessage" as const,
    args: [BigInt(dealId), BigInt(i)],
  }));

  const { data: chatResults } = useReadContracts({
    contracts: chatCalls,
    query: { enabled: count > 0, refetchInterval: 5000 },
  });

  // Parse on-chain messages
  const onChainMessages: ChatMessage[] = (chatResults || [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => {
      const [sender, message, timestamp] = r.result as [string, string, bigint];
      return {
        sender,
        message,
        timestamp: Number(timestamp),
        isOwn: sender.toLowerCase() === userAddress.toLowerCase(),
      };
    });

  // Combine on-chain + optimistic (filter out optimistic that are now on-chain)
  const allMessages = [
    ...onChainMessages,
    ...optimisticMsgs.filter(
      (om) => !onChainMessages.some((oc) => oc.message === om.message && oc.sender.toLowerCase() === om.sender.toLowerCase())
    ),
  ];

  const { writeContract: sendChat, data: sendHash, isPending: sendPending } = useWriteContract();
  const { isSuccess: sendConfirmed } = useWaitForTransactionReceipt({ hash: sendHash });

  useEffect(() => {
    if (sendConfirmed) {
      setInput("");
    }
  }, [sendConfirmed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSend = () => {
    if (!input.trim() || readOnly) return;
    setOptimisticMsgs((prev) => [
      ...prev,
      { sender: userAddress, message: input.trim(), timestamp: Date.now() / 1000, isOwn: true },
    ]);
    sendChat({
      address: P2P_CONTRACT_ADDRESS,
      abi: P2P_ESCROW_ABI,
      functionName: "sendChat",
      args: [BigInt(dealId), input.trim()],
    } as any);
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
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Deal #{dealId} Chat</p>
        <p className="text-xs text-muted-foreground">
          {readOnly ? "View-only — on-chain messages" : "Messages stored on-chain"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {allMessages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground text-center px-4">
              {readOnly ? "No messages between parties yet." : "No messages yet. Say hi to your trade partner."}
            </p>
          </div>
        )}
        {allMessages.map((msg, i) => (
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

      {!readOnly && (
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
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || sendPending} className="shrink-0">
              {sendPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
