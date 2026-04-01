import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import ThemeToggle from "@/components/ThemeToggle";
import { useGlobalUnreadCount } from "@/hooks/useGlobalUnreadCount";

const NAV_LINKS = [
  { label: "P2P Trading", href: "/" },
  { label: "My Ads", href: "/my-ads" },
  { label: "My Deals", href: "/my-orders" },
  { label: "Guide", href: "/guide" },
  { label: "News", href: "/news" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { address } = useAccount();
  const unreadCount = useGlobalUnreadCount(address);

  const navLinks = NAV_LINKS.map((link) =>
    link.href === "/my-orders" && unreadCount > 0
      ? { ...link, badge: unreadCount }
      : link
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface-1/80 backdrop-blur-xl safe-top">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 safe-x">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-primary">
            <img src="/favicon.png" alt="Crypto P2P" className="h-6 w-6 sm:h-7 sm:w-7" />
            Crypto P2P
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`relative ${
                    location.pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {"badge" in link && (link as any).badge > 0 && (
                    <span className="absolute -top-0.5 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {(link as any).badge > 99 ? "99+" : (link as any).badge}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <a href="https://t.me/Tobi3811" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </a>
          <ThemeToggle />
          <ConnectButton chainStatus="icon" accountStatus="address" showBalance={false} />
        </div>

        <button
          className="md:hidden text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface-1 px-4 pb-6 pt-3 md:hidden animate-fade-in safe-x safe-bottom">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`w-full justify-start min-h-[48px] text-base relative ${
                    location.pathname === link.href ? "text-foreground bg-accent" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {"badge" in link && (link as any).badge > 0 && (
                    <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
                      {(link as any).badge > 99 ? "99+" : (link as any).badge}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
              <a href="https://t.me/XplorerTobi1" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </a>
              <ThemeToggle />
              <div className="ml-auto">
                <ConnectButton chainStatus="icon" accountStatus="address" showBalance={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
