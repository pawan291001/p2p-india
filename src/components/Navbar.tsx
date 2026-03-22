import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { label: "P2P Trading", href: "/" },
  { label: "My Ads", href: "/my-ads" },
  { label: "My Deals", href: "/my-orders" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface-1/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            <img src="/favicon.png" alt="Crypto P2P" className="h-7 w-7" />
            Crypto P2P
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    location.pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <a href="https://t.me/XplorerTobi1" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </a>
          <ThemeToggle />
          <ConnectButton chainStatus="icon" accountStatus="address" showBalance={false} />
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
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`justify-start ${
                    location.pathname === link.href ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <a href="https://t.me/XplorerTobi1" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </a>
              <ThemeToggle />
              <ConnectButton chainStatus="icon" accountStatus="address" showBalance={false} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
