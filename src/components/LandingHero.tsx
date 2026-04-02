import { Shield, Zap, ArrowLeftRight, Lock, Clock, Users, ChevronRight, ExternalLink } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ScrollReveal from "@/components/ScrollReveal";

const TRUST_BADGES = [
  { label: "BNB Smart Chain", sub: "Mainnet", emoji: "⛓️" },
  { label: "Zero Fees", sub: "No hidden charges", emoji: "🆓" },
  { label: "Open Source", sub: "Verified contract", emoji: "🔓" },
  { label: "Non-Custodial", sub: "Your keys, your crypto", emoji: "🔑" },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Smart Contract Escrow",
    desc: "Seller tokens lock in the contract the moment an ad goes live. Funds release only when both sides confirm.",
  },
  {
    icon: Zap,
    title: "Zero Platform Fees",
    desc: "No commissions, no withdrawal fees. You only pay the BNB gas fee — typically under ₹1.",
  },
  {
    icon: ArrowLeftRight,
    title: "Direct P2P Transfers",
    desc: "Transfer USDT and BNB directly wallet-to-wallet. No centralised intermediary, fully decentralised.",
  },
  {
    icon: Users,
    title: "Multiple Payment Methods",
    desc: "UPI, Bank Transfer, COD, Cash Deposit, Digital Rupee, PayPal, Wise — sellers pick their preferred method.",
  },
  {
    icon: Clock,
    title: "Timed Deals",
    desc: "Every deal has a countdown. If the buyer doesn't pay, the seller reclaims tokens automatically.",
  },
  {
    icon: Shield,
    title: "On-Chain Disputes",
    desc: "Something wrong? Either party raises a dispute on-chain. An admin reviews and resolves it fairly.",
  },
];

const STEPS = [
  { n: "01", title: "Connect Wallet", desc: "MetaMask, Trust Wallet, OKX or any BNB-compatible wallet." },
  { n: "02", title: "Browse Ads", desc: "Live sell ads sorted by price. Pick the best deal for you." },
  { n: "03", title: "Accept & Pay", desc: "Accept a deal, send INR via UPI or bank. Tokens are safe in escrow." },
  { n: "04", title: "Receive Crypto", desc: "Seller confirms payment. Contract releases tokens to your wallet." },
];

const LandingHero = () => (
  <>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.02] pointer-events-none" />
      <div className="absolute top-20 -right-32 w-80 h-80 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-5 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 relative">
        <ScrollReveal duration={700}>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-xs font-medium text-primary mb-7">
              <span className="h-2 w-2 rounded-full bg-buy animate-pulse" />
              Live on BNB Smart Chain Mainnet
            </div>
            <h1
              className="text-4xl font-black text-foreground sm:text-5xl lg:text-6xl tracking-tight"
              style={{ lineHeight: "1.05", textWrap: "balance" }}
            >
              P2P Crypto
              <span className="text-primary"> Marketplace</span>
              <br />
              with Zero Fees
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed" style={{ textWrap: "pretty" }}>
              Connect with other users to transfer USDT & BNB on BNB Smart Chain.
              Smart contract escrow secures every deal — no middlemen, fully on-chain.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ConnectButton />
              <a
                href="https://bscscan.com/address/0xd79ef02e1F64EF4368b942020129bd0Bc7da0d95"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                View Contract
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {TRUST_BADGES.map((b, i) => (
            <ScrollReveal key={b.label} delay={100 + i * 80} duration={600}>
              <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-4 py-4 text-center hover:border-primary/20 transition-colors">
                <span className="text-lg mb-1 block">{b.emoji}</span>
                <p className="text-sm font-bold text-foreground">{b.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{b.sub}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
      <ScrollReveal>
        <h2
          className="text-2xl font-black text-foreground sm:text-3xl mb-2 text-center tracking-tight"
          style={{ lineHeight: "1.15" }}
        >
          Why Crypto P2P?
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12 max-w-md mx-auto">
          Everything you need for safe, fast, fee-free P2P crypto transfers.
        </p>
      </ScrollReveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 80} duration={600}>
            <div className="group rounded-2xl border border-border bg-card p-6 h-full transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/15">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4 transition-transform group-hover:scale-105">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>

    {/* How It Works */}
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
      <ScrollReveal>
        <h2
          className="text-2xl font-black text-foreground sm:text-3xl mb-2 text-center tracking-tight"
          style={{ lineHeight: "1.15" }}
        >
          How It Works
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12 max-w-sm mx-auto">
          Four steps from wallet connection to crypto in your hands.
        </p>
      </ScrollReveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <ScrollReveal key={s.n} delay={i * 100} duration={600}>
            <div className="relative rounded-2xl border border-border bg-card p-6 h-full hover:border-primary/20 transition-colors">
              <span className="text-4xl font-black text-primary/10 absolute top-4 right-5 select-none">
                {s.n}
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xs font-bold text-primary">{s.n}</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-border z-10" />
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>

    {/* Divider */}
    <div className="mx-auto max-w-7xl px-5 sm:px-6">
      <div className="border-t border-border" />
    </div>
  </>
);

export default LandingHero;
