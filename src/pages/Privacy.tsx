import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 mx-auto max-w-3xl px-4 py-12 sm:px-6 prose-sm">
      <h1 className="text-2xl font-bold text-foreground mb-6" style={{ lineHeight: "1.1" }}>Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

      {[
        { t: "1. Information We Collect", p: "Crypto P2P is a decentralised platform. We do not collect personal information such as names, emails, or phone numbers. The only data visible on the platform is your public wallet address, which is already publicly available on the BNB Smart Chain blockchain." },
        { t: "2. Payment Information", p: "When sellers create ads, they provide payment details (UPI ID or bank account info) that are stored on-chain in the smart contract. This information is visible to buyers who accept their deals. Sellers should only share payment details they are comfortable making public on-chain." },
        { t: "3. Blockchain Data", p: "All transactions on Crypto P2P are recorded on the BNB Smart Chain blockchain. This data is public, immutable, and not controlled by Crypto P2P. Transaction hashes, wallet addresses, and trade amounts are permanently visible on block explorers like BscScan." },
        { t: "4. Cookies & Analytics", p: "The Platform may use basic analytics to understand usage patterns and improve the service. No personally identifiable information is collected through these means." },
        { t: "5. Third-Party Services", p: "The Platform integrates with third-party wallet providers (MetaMask, Trust Wallet, etc.) and RPC providers. These services have their own privacy policies. We recommend reviewing them independently." },
        { t: "6. Data Security", p: "Since Crypto P2P does not store personal data on centralised servers, there is minimal risk of data breaches. All critical data lives on the blockchain, secured by the BNB Smart Chain network." },
        { t: "7. Your Rights", p: "As a decentralised platform, data stored on-chain cannot be modified or deleted. Off-chain data (if any) can be requested for deletion by contacting us." },
        { t: "8. Changes to This Policy", p: "We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated date." },
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

export default Privacy;
