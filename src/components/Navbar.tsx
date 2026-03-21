import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface-1/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight text-primary">
            ChainSwap
          </span>
          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              P2P Trading
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              My Orders
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              My Ads
            </Button>
          </div>
        </div>

        <div className="hidden md:flex">
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={true}
          />
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface-1 px-4 pb-4 pt-2 md:hidden animate-fade-in">
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="justify-start text-muted-foreground">
              P2P Trading
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-muted-foreground">
              My Orders
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-muted-foreground">
              My Ads
            </Button>
            <div className="mt-2">
              <ConnectButton
                chainStatus="icon"
                accountStatus="address"
                showBalance={true}
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
