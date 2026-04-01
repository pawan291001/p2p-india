

# Publishing to Google Play Store — Technical Steps & Compliance

## Current State
Capacitor is already configured in your project with the correct app ID and live URL mode. The technical setup is mostly done.

## Technical Steps to Publish

1. **Export & Build Locally**
   - Export project to GitHub via "Export to GitHub" button
   - `git clone` → `npm install` → `npx cap add android` → `npm run build` → `npx cap sync`
   - Open in Android Studio: `npx cap open android`

2. **Generate Signed APK/AAB**
   - In Android Studio: Build → Generate Signed Bundle (AAB format required by Play Store)
   - Create a keystore file (keep it safe — you need it for every update)

3. **Create Google Play Developer Account**
   - One-time $25 fee at [play.google.com/console](https://play.google.com/console)
   - Fill in developer profile, verify identity

4. **Upload & Submit**
   - Create new app → upload AAB → fill store listing (screenshots, description, privacy policy)
   - Your Privacy Policy and Terms pages are already live — link to them

---

## Play Store Compliance Risks & Solutions

This is the critical part. Google Play has strict policies around **crypto and financial apps**. Here's what could get you flagged and how to mitigate:

### Risk 1: "Financial Services" Classification
Google requires apps offering crypto trading/exchange to comply with local regulations and may require licenses. **P2P escrow** is a gray area.

**Mitigation:**
- Frame the app as a **"P2P marketplace tool"** not an "exchange"
- Emphasize it's a **communication/escrow interface** — users trade directly, the app doesn't hold funds (the smart contract does)
- In the store listing, avoid words like "exchange", "trading platform", "invest"
- Use language like "peer-to-peer marketplace", "escrow-assisted transfers"

### Risk 2: Restricted Financial Products Declaration
Google may ask you to fill a **Financial Features declaration** form.

**Mitigation:**
- Be transparent in the declaration — state the app facilitates P2P crypto transfers using smart contracts
- Highlight the escrow mechanism as a safety feature

### Risk 3: India-Specific Regulations
India hasn't banned crypto but has ambiguous regulations. Google may be extra cautious.

**Mitigation:**
- Add a clear **disclaimer** on the app's landing page and store listing: "This app does not provide financial advice. Users are responsible for compliance with local laws."
- Add age restriction (18+) in the store listing
- Ensure KYC/AML language is present even if it's wallet-based (mention wallet verification = identity)

### Risk 4: App Content Policy
Google scans for gambling/financial manipulation content.

**Mitigation:**
- Remove any language that sounds like "guaranteed returns" or "profit"
- The news section should be clearly labeled as "informational" not "financial advice"

---

## Recommended Code Changes Before Submission

1. **Add a disclaimer banner/page** — a short legal disclaimer users see on first launch
2. **Add age gate or terms acceptance** — a one-time "I am 18+ and accept terms" modal on first visit
3. **Update app description** — prepare store-safe copy emphasizing "peer-to-peer marketplace with smart contract escrow"

---

## Alternative: Direct APK Distribution
If Play Store rejection is a concern, you can also distribute via:
- **Direct APK download** from your website (add a download page)
- **Alternative stores** like APKPure, Amazon Appstore, or Samsung Galaxy Store (less strict policies)

This avoids Play Store review entirely while still reaching Android users.

## Summary
The technical side is ready (Capacitor configured). The main challenge is Play Store policy compliance around crypto/financial apps. Adding disclaimers, careful store listing language, and framing as a "marketplace tool" significantly reduces rejection risk.

