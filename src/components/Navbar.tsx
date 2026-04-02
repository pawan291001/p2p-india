import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import ThemeToggle from "@/components/ThemeToggle";
import { useGlobalUnreadCount } from "@/hooks/useGlobalUnreadCount";

const NAV_LINKS = [
  { label: "P2P Marketplace", href: "/" },
  { label: "My Ads", href: "/my-ads" },
  { label: "My Deals", href: "/my-orders" },
  { label: "Guide", href: "/guide" },
  { label: "News", href: "/news" },
];

const Navbar = () => {
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
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
            <img src="/favicon.png" alt="Crypto P2P" className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-tight">
              Crypto P2P
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground leading-none tracking-wider uppercase">
              Peer to Peer Trading
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`relative ${
                  location.pathname === link.href
                    ? "text-foreground bg-accent"
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

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a href="https://t.me/Tobi3811" target="_blank" rel="noopener noreferrer" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </a>
          <ThemeToggle />
          <ConnectButton chainStatus="icon" accountStatus="address" showBalance={false} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
