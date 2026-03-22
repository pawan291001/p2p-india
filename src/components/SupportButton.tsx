import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

const TG_LINK = "https://t.me/XplorerTobi1";

const SupportButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="animate-fade-up rounded-xl border border-border bg-card shadow-xl p-4 w-72">
          <p className="text-sm font-semibold text-foreground mb-1">Need Help?</p>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Message our support on Telegram for any issues with trades, disputes, or the platform.
          </p>
          <a
            href={TG_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[hsl(200,80%,45%)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 active:scale-[0.97] transition-all w-full justify-center"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Chat on Telegram
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.95]"
        aria-label="Support"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default SupportButton;
