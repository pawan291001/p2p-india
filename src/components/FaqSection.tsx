import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScrollReveal from "@/components/ScrollReveal";

const FAQS = [
  {
    q: "What is Crypto P2P?",
    a: "Crypto P2P is a decentralised peer-to-peer trading platform on BNB Smart Chain. It lets you buy and sell USDT & BNB directly with other users — no middlemen, no centralised exchange.",
  },
  {
    q: "How does the escrow smart contract work?",
    a: "When a seller posts an ad, their tokens are locked inside our audited escrow contract. Once a buyer accepts the deal and sends INR payment, the seller confirms receipt and the contract releases the tokens to the buyer. Neither party can run away with the funds.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support UPI (Google Pay, PhonePe, Paytm, etc.) and Bank Transfer (NEFT/IMPS). The seller chooses their preferred method when creating an ad.",
  },
  {
    q: "Are there any fees?",
    a: "There are zero platform fees. You only pay the standard BNB Smart Chain gas fee for on-chain transactions, which is typically less than $0.01.",
  },
  {
    q: "What happens if the buyer doesn't pay?",
    a: "Each deal has a time limit. If the buyer doesn't mark payment within the deadline, the seller can cancel the deal and reclaim their tokens from the escrow contract.",
  },
  {
    q: "What happens if there's a dispute?",
    a: "After the deal timer expires, either party can raise an on-chain dispute. An admin reviews the evidence and resolves it by releasing funds to the rightful party.",
  },
  {
    q: "Is there a minimum or maximum trade amount?",
    a: "There is no platform-imposed minimum or maximum. Sellers set their own token amounts and prices when creating ads. You can trade as little as $1 worth of crypto.",
  },
  {
    q: "Which wallets are supported?",
    a: "Any wallet that supports BNB Smart Chain — MetaMask, Trust Wallet, Coinbase Wallet, and more. Just connect via the wallet button in the navbar.",
  },
];

const FaqSection = () => (
  <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <ScrollReveal>
      <h2
        className="text-xl font-bold text-foreground mb-6 text-center sm:text-2xl"
        style={{ lineHeight: "1.15" }}
      >
        Frequently Asked Questions
      </h2>
    </ScrollReveal>
    <ScrollReveal delay={100}>
      <Accordion type="single" collapsible className="w-full">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-border">
            <AccordionTrigger className="text-left text-sm text-foreground hover:no-underline hover:text-primary">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollReveal>
  </section>
);

export default FaqSection;
