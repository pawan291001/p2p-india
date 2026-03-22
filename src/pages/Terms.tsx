import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 mx-auto max-w-3xl px-4 py-12 sm:px-6 prose-sm">
      <h1 className="text-2xl font-bold text-foreground mb-6" style={{ lineHeight: "1.1" }}>Terms & Conditions</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

      {[
        { t: "1. Acceptance of Terms", p: "By accessing or using the Crypto P2P platform ("Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Platform." },
        { t: "2. Platform Description", p: "Crypto P2P is a decentralised peer-to-peer trading interface built on BNB Smart Chain. It facilitates direct trades between users via a smart contract escrow. Crypto P2P does not custody, hold, or control user funds at any time — all tokens are managed by the on-chain escrow contract." },
        { t: "3. Eligibility", p: "You must be at least 18 years old and legally able to enter into binding agreements in your jurisdiction. You are solely responsible for ensuring your use of the Platform complies with applicable laws." },
        { t: "4. Wallet & Security", p: "You are responsible for maintaining the security of your wallet, private keys, and seed phrases. Crypto P2P never asks for your private key. We are not liable for any loss resulting from unauthorised access to your wallet." },
        { t: "5. Trades & Escrow", p: "When a seller posts an ad, their tokens are locked in the escrow smart contract. Once a buyer accepts a deal and completes payment, the seller confirms receipt, and the contract releases tokens to the buyer. Neither Crypto P2P nor any third party can alter or reverse a completed on-chain transaction." },
        { t: "6. Disputes", p: "If a dispute arises, either party may raise it on-chain after the deal timer expires. An admin will review available evidence and resolve the dispute. Dispute resolution is provided on a best-effort basis and Crypto P2P makes no guarantees about outcomes." },
        { t: "7. Fees", p: "Crypto P2P charges zero platform fees. Users are responsible for paying BNB Smart Chain gas fees required for on-chain transactions." },
        { t: "8. No Financial Advice", p: "Nothing on this Platform constitutes financial, investment, legal, or tax advice. You trade at your own risk. Always do your own research before trading." },
        { t: "9. Limitation of Liability", p: "Crypto P2P is provided \"as is\" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform, including but not limited to loss of funds, failed transactions, or smart contract bugs." },
        { t: "10. Modifications", p: "We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms." },
        { t: "11. Governing Law", p: "These Terms shall be governed by and construed in accordance with the laws applicable to decentralised platforms. Any disputes shall be resolved through arbitration." },
      ].map((s) => (
        <div key={s.t} className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">{s.t}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.p}</p>
        </div>
      ))}
    </main>
    <Footer />
  </div>
);

export default Terms;
