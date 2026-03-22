import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-surface-1 mt-12">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-3">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary mb-2">
            <img src="/favicon.png" alt="Crypto P2P" className="h-6 w-6" />
            Crypto P2P
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            Decentralised peer-to-peer crypto trading on BNB Smart Chain. Zero fees, smart contract escrow, no middlemen.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Platform</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">P2P Trading</Link></li>
            <li><Link to="/my-ads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Ads</Link></li>
            <li><Link to="/my-orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Deals</Link></li>
            <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Crypto P2P. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground">
          Smart Contract:{" "}
          <a
            href="https://bscscan.com/address/0x0ACFC8034b92FB06F482541BBd7fF692d30B5F3f"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono"
          >
            0x0ACF…5F3f
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
