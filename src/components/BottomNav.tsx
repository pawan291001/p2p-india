import { useLocation, Link } from "react-router-dom";
import { ArrowLeftRight, Newspaper, PlusCircle, ShoppingBag, Handshake } from "lucide-react";
import { useAccount } from "wagmi";
import { useGlobalUnreadCount } from "@/hooks/useGlobalUnreadCount";

const NAV_ITEMS = [
  { label: "P2P", href: "/", icon: ArrowLeftRight },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "", href: "/create", icon: PlusCircle, isCenter: true },
  { label: "My Ads", href: "/my-ads", icon: ShoppingBag },
  { label: "Deals", href: "/my-orders", icon: Handshake },
];

const BottomNav = () => {
  const location = useLocation();
  const { address } = useAccount();
  const unreadCount = useGlobalUnreadCount(address);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-1/95 backdrop-blur-xl safe-bottom md:hidden">
      <div className="flex items-end justify-around px-1 pt-1 pb-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href === "/create" && false); // center button never "active"
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key="create"
                className="relative -mt-5 flex flex-col items-center"
                onClick={() => {
                  // Dispatch custom event for create modal
                  window.dispatchEvent(new CustomEvent("open-create-modal"));
                }}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  <PlusCircle className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
                </span>
              </button>
            );
          }

          const showBadge = item.href === "/my-orders" && unreadCount > 0;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px] transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
