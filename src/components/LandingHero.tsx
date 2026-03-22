import { Shield, Zap, ArrowLeftRight, Lock, Clock, Users, ChevronRight, ExternalLink } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ScrollReveal from "@/components/ScrollReveal";

const TRUST_BADGES = [
  { label: "BNB Smart Chain", sub: "Mainnet" },
  { label: "Zero Fees", sub: "No hidden charges" },
  { label: "Open Source", sub: "Verified contract" },
  { label: "Non-Custodial", sub: "Your keys, your crypto" },
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
    title: "Direct P2P Trades",
    desc: "Trade USDT and BNB directly wallet-to-wallet. No centralised exchange, no KYC, no limits.",
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
  { n: "01", title: "Connect Wallet", desc: "MetaMask, Trust Wallet, or any BNB-compatible wallet." },
  { n: "02", title: "Browse Ads", desc: "Live sell ads sorted by price. Pick the best deal for you." },
  { n: "03", title: "Accept & Pay", desc: "Accept a deal, send INR via UPI or bank. Tokens are safe in escrow." },
  { n: "04", title: "Receive Crypto", desc: "Seller confirms payment. Contract releases tokens to your wallet." },
];

const LandingHero = () => (
  <>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 relative">
        <ScrollReveal duration={700}>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-buy animate-pulse" />
              Live on BNB Smart Chain Mainnet
            </div>
            <h1
              className="text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight"
              style={{ lineHeight: "1.08", textWrap: "balance" }}
            >
              Trade Crypto
              <span className="text-primary"> Peer-to-Peer</span>
              <br />
              with Zero Fees
            </h1>
            <p className="mt-5 text-base text-muted-foreground max-w-lg leading-relaxed" style={{ textWrap: "pretty" }}>
              Buy and sell USDT & BNB directly with other users on BNB Smart Chain.
              Smart contract escrow protects every trade — no middlemen, no risks.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ConnectButton />
              <a
                href="https://bscscan.com/address/0x0ACFC8034b92FB06F482541BBd7fF692d30B5F3f"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View Contract
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Trust Badges */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRUST_BADGES.map((b, i) => (
            <ScrollReveal key={b.label} delay={100 + i * 80} duration={600}>
              <div className="rounded-lg border border-border bg-card/60 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-foreground">{b.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.sub}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <ScrollReveal>
        <h2
          className="text-xl font-bold text-foreground sm:text-2xl mb-2 text-center"
          style={{ lineHeight: "1.15" }}
        >
          Why Crypto P2P?
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10 max-w-md mx-auto">
          Everything you need for safe, fast, fee-free crypto trading in India.
        </p>
      </ScrollReveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 80} duration={600}>
            <div className="group rounded-xl border border-border bg-card p-5 h-full transition-shadow hover:shadow-lg hover:shadow-primary/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3 transition-transform group-hover:scale-[1.04] group-active:scale-[0.97]">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>

    {/* How It Works */}
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <ScrollReveal>
        <h2
          className="text-xl font-bold text-foreground sm:text-2xl mb-2 text-center"
          style={{ lineHeight: "1.15" }}
        >
          How It Works
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10 max-w-sm mx-auto">
          Four steps from wallet connection to crypto in your hands.
        </p>
      </ScrollReveal>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <ScrollReveal key={s.n} delay={i * 100} duration={600}>
            <div className="relative rounded-xl border border-border bg-card p-5 h-full">
              <span className="text-3xl font-extrabold text-primary/15 absolute top-3 right-4 select-none">
                {s.n}
              </span>
              <h3 className="text-sm font-semibold text-foreground mb-1 mt-1">{s.title}</h3>
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="border-t border-border" />
    </div>
  </>
);

export default LandingHero;
