import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const SECTIONS = [
  {
    id: "intro",
    title: "What is Crypto P2P?",
    image: null,
    content: [
      "Crypto P2P is a fully decentralised peer-to-peer trading platform built on BNB Smart Chain. It allows users to buy and sell USDT and BNB directly with each other using Indian Rupees (INR) — without any middlemen, centralised exchanges, or KYC requirements.",
      "Every trade is secured by an on-chain escrow smart contract. The seller's tokens are locked in the contract the moment they create an ad. This means buyers can trade with confidence — the crypto is already held safely before any money changes hands.",
      "There are zero platform fees. The only cost is the tiny BNB gas fee for on-chain transactions, which is usually under ₹1.",
    ],
  },
  {
    id: "connect",
    title: "Step 1 — Connect Your Wallet",
    image: null,
    content: [
      "To start trading, you need a crypto wallet that supports BNB Smart Chain. Popular options include MetaMask, Trust Wallet, and Coinbase Wallet.",
      "Click the \"Connect Wallet\" button in the top-right corner of the navbar. A popup will appear showing supported wallets. Select yours, approve the connection, and make sure you're on the BNB Smart Chain network.",
      "Your wallet address acts as your identity on the platform — no account creation, email, or password needed.",
    ],
  },
  {
    id: "browse",
    title: "Step 2 — Browse Sell Ads",
    image: null,
    content: [
      "The main P2P Trading page shows all active sell ads from other users. Each ad card displays the seller's wallet address, the token they're selling (USDT or BNB), the price per token in INR, and their preferred payment method.",
      "You can filter ads by cryptocurrency (USDT or BNB) using the filter buttons at the top. Ads are sorted by price so you can quickly find the best deals.",
      "Each ad also shows the total amount available and the deal timeout — how long you'll have to complete the payment after accepting.",
    ],
  },
  {
    id: "escrow",
    title: "Step 3 — How Escrow Works",
    image: null,
    content: [
      "When a seller creates an ad, their tokens are immediately transferred from their wallet into the escrow smart contract. This is an on-chain transaction that locks the tokens — the seller cannot withdraw them once the ad is live.",
      "When a buyer accepts a deal, the tokens remain locked. The buyer then sends INR payment directly to the seller through the chosen payment method (UPI, Bank Transfer, etc.).",
      "After the buyer confirms they've sent the payment, the seller checks their bank/UPI and confirms receipt on the platform. The smart contract then automatically releases the tokens to the buyer's wallet.",
      "This flow ensures neither party can scam the other — the seller can't run away with both crypto and INR, and the buyer's payment is tracked through the deal timeline.",
    ],
  },
  {
    id: "payment",
    title: "Step 4 — Making & Confirming Payment",
    image: null,
    content: [
      "Once you accept a deal as a buyer, you'll see the seller's payment details — UPI ID, bank account info, or other method-specific details. For UPI payments, a QR code is automatically generated so you can scan and pay instantly.",
      "Send the exact INR amount shown in the deal to the seller's provided payment details. Double-check the amount and account details before sending.",
      "After sending payment, click \"I Have Paid\" to notify the seller. The deal timer is ticking, so complete your payment promptly.",
      "The seller will then check their account for the incoming payment. Once they confirm receipt, the smart contract releases the crypto tokens to your wallet automatically.",
    ],
  },
  {
    id: "selling",
    title: "Step 5 — Selling Crypto",
    image: null,
    content: [
      "To sell crypto, click \"Sell USDT\" or \"Sell BNB\" on the P2P Trading page. A form will appear where you set your price per token (in INR), the amount you want to sell, your preferred payment method, and your payment details.",
      "Supported payment methods include UPI, Bank Transfer, Google Pay, PhonePe, Cash/Bank Deposit, Digital Rupee, PayPal, and Wise. Choose the one that works best for you.",
      "You also set a deal timeout (how long buyers have to pay) and an ad duration (how long your ad stays live). Once you submit, your tokens are locked in the escrow contract and your ad goes live.",
      "When a buyer accepts your deal and sends payment, you'll see the deal in your \"My Ads\" page. Verify the payment in your bank/UPI, then click \"Release\" to confirm and send the tokens to the buyer.",
    ],
  },
  {
    id: "disputes",
    title: "Step 6 — Disputes & Safety",
    image: null,
    content: [
      "Sometimes things don't go smoothly. A buyer might claim they paid when they didn't, or a seller might not release tokens after receiving payment. The dispute system handles these cases.",
      "The \"Raise Dispute\" button only becomes available after the deal timer expires. This prevents premature disputes and gives both parties enough time to complete the trade.",
      "If a buyer falsely confirms payment without actually sending money: The seller simply doesn't click \"Release.\" After the timer expires, the seller can raise a dispute. The admin reviews the case and returns the tokens to the seller.",
      "If a seller doesn't release tokens after the buyer has paid: The buyer waits for the timer to expire, then raises a dispute. The admin verifies the payment and releases the tokens to the buyer.",
      "An admin reviews all disputes and makes a fair decision based on the evidence. The smart contract then releases the locked tokens to the rightful party.",
    ],
  },
  {
    id: "deal-lifecycle",
    title: "Deal Lifecycle — From Start to Finish",
    image: null,
    content: [
      "1. Seller creates an ad → Tokens locked in escrow.",
      "2. Buyer accepts the deal → Deal timer starts.",
      "3. Buyer sends INR payment → Clicks \"I Have Paid.\"",
      "4. Seller verifies payment → Clicks \"Release\" to send tokens.",
      "5. Tokens released to buyer → Deal complete!",
      "If anything goes wrong at step 3 or 4, the dispute system kicks in after timeout.",
    ],
  },
  {
    id: "cancel",
    title: "Cancelling Deals & Ads",
    image: null,
    content: [
      "Sellers can cancel their ad at any time if no deal is active. The locked tokens are returned to their wallet.",
      "Buyers can cancel a deal before confirming payment. Once you've clicked \"I Have Paid,\" you cannot cancel — you'll need to wait for the seller or use the dispute system.",
      "If a deal times out and neither party acts, the tokens stay safely in escrow. The seller can cancel the timed-out deal to reclaim tokens, or either party can raise a dispute.",
    ],
  },
  {
    id: "fees",
    title: "Fees & Limits",
    image: null,
    content: [
      "Platform fees: Zero. There are no platform fees at all.",
      "Gas fees: You pay a small BNB gas fee for on-chain transactions (creating ads, accepting deals, confirming payments, etc.). This is typically under ₹1.",
      "Minimum trade: No minimum. You can trade as little as $1 worth of crypto.",
      "Maximum trade: No maximum. Sellers set their own amounts.",
      "The platform does not hold or touch your INR payments — all fiat transfers happen directly between buyer and seller.",
    ],
  },
  {
    id: "security",
    title: "Security & Trust",
    image: null,
    content: [
      "Smart Contract Escrow: All crypto is held in an audited smart contract on BNB Smart Chain mainnet. No human can access the locked funds — only the contract logic controls releases.",
      "No KYC Required: Your wallet is your identity. We don't collect personal information, emails, or phone numbers.",
      "On-chain Transparency: Every ad, deal, and dispute is recorded on the blockchain. Anyone can verify the contract activity on BscScan.",
      "Dispute Resolution: A trusted admin resolves disputes fairly. The dispute system is designed so that honest parties are always protected.",
      "Open Contract: The smart contract address is publicly visible and verifiable: 0x0ACFC8034b92FB06F482541BBd7fF692d30B5F3f",
    ],
  },
  {
    id: "tips",
    title: "Tips for Safe Trading",
    image: null,
    content: [
      "✅ Always double-check payment details before sending INR.",
      "✅ Never send payment outside the deal — only use the details shown in your active deal.",
      "✅ Complete trades within the deal timeout to avoid issues.",
      "✅ Take screenshots of your payment as evidence in case of disputes.",
      "✅ Start with small amounts if you're new to P2P trading.",
      "❌ Don't trust anyone asking you to cancel a deal after you've already paid.",
      "❌ Don't send crypto directly — always use the platform's escrow system.",
      "❌ Don't share your wallet private key with anyone.",
    ],
  },
  {
    id: "support",
    title: "Getting Help",
    image: null,
    content: [
      "If you need help with a trade, dispute, or anything else, reach out on Telegram: @XplorerTobi1",
      "You can also use the support button (chat icon) in the bottom-right corner of any page to quickly get to our Telegram support.",
      "For general questions, check the FAQ section on the homepage — it covers the most common questions about the platform.",
    ],
  },
];

const Guide = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <ScrollReveal>
        <h1
          className="text-2xl font-bold text-foreground sm:text-3xl mb-2"
          style={{ lineHeight: "1.1" }}
        >
          Complete Guide to Crypto P2P
        </h1>
        <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
          Everything you need to know about using the platform — from connecting your wallet to resolving disputes. Read this once and you'll be a pro.
        </p>
      </ScrollReveal>

      {/* Table of contents */}
      <ScrollReveal delay={80}>
        <nav className="rounded-lg border border-border bg-card p-4 mb-10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Table of Contents
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-sm text-primary hover:underline py-0.5"
              >
                {s.title}
              </a>
            ))}
          </div>
        </nav>
      </ScrollReveal>

      {/* Sections */}
      <div className="space-y-14">
        {SECTIONS.map((section, i) => (
          <ScrollReveal key={section.id} delay={60}>
            <section id={section.id} className="scroll-mt-20">
              <h2
                className="text-lg font-semibold text-foreground mb-4 sm:text-xl"
                style={{ lineHeight: "1.2" }}
              >
                {section.title}
              </h2>


              <div className="space-y-3">
                {section.content.map((para, j) => (
                  <p
                    key={j}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          </ScrollReveal>
        ))}
      </div>

      {/* CTA */}
      <ScrollReveal delay={80}>
        <div className="mt-16 rounded-lg border border-border bg-card p-6 text-center">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Ready to Start Trading?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your wallet and browse live sell ads — it takes less than a minute.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
          >
            Go to P2P Trading
          </a>
        </div>
      </ScrollReveal>
    </main>
    <Footer />
  </div>
);

export default Guide;
