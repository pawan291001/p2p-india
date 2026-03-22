

# Contract Flow Fix: Manual Re-list Instead of Auto Re-list

## Current vs Desired Behavior

The current contract **auto-relists** ads when a deal times out. You want the seller to **manually re-list** instead.

### Desired Flow (your description):
1. Seller creates ad (100 USDT at 95 INR) → tokens locked, ad is Live
2. If no one accepts before ad expiry → ad goes offline, seller can claim USDT back
3. Buyer accepts → ad = InDeal, USDT stays locked, seller **cannot cancel**
4. If buyer confirms payment → deal stays active even after 15min timeout. Seller must either confirm receipt or dispute
5. If buyer does NOT confirm within 15min → deal is cancelled, ad goes **offline** (not auto-live). Seller must **manually re-list** the ad to make it live again. Funds stay locked.
6. Seller can cancel ad **only when Live** (not when InDeal) → gets USDT refund

### What Needs to Change in the Contract

**`cancelTimedOutDeal`** — Currently auto-relists. Change to: set ad status to a new state or just keep it Live but require seller action. Actually, simplest approach: keep the current auto-relist but add a **separate manual relist function** instead.

Wait — re-reading your message more carefully: you said "seller need to call that deal and make it online again." This means:

- `cancelTimedOutDeal` should cancel the deal AND set the ad to **Cancelled/Offline** (not Live)
- A new function `relistAd(adId)` lets the seller put it back Live with a fresh timer
- Funds stay locked in escrow during both states

### Contract Changes

**1. New ad status: `Offline`**
```
enum AdStatus { Live, InDeal, Completed, Cancelled, Offline }
```
`Offline` = deal timed out, funds still locked, seller can relist or cancel.

**2. Update `cancelTimedOutDeal`**
- Set ad status to `Offline` instead of `Live`
- Funds stay locked (no transfer)
- Emit event

**3. New function: `relistAd(uint256 _adId)`**
- Only seller can call
- Requires ad status == `Offline`
- Sets status back to `Live` with fresh `adDuration` timer
- Emits `AdRelisted`

**4. Update `cancelAd`**
- Allow cancellation when status is `Live` OR `Offline`
- Refunds escrowed tokens

**5. Update `claimExpiredAd`**
- Allow claim when status is `Live` OR `Offline` (for expired + offline ads)

### UI Changes

**`src/pages/MyAds.tsx`**
- Show "Re-list" button for ads with status `Offline` (status 4)
- Show "Cancel & Withdraw" button for `Offline` ads
- Add status label for Offline state

**`src/pages/Index.tsx`**
- Offline ads (status 4) should NOT appear in the marketplace (only Live = 0)

**`src/config/abi.ts`**
- Add `relistAd` function to ABI

**`src/hooks/useContractAds.ts`**
- No change needed (already reads status correctly)

### Files to Change
1. `contracts/P2PEscrow.sol` — Add Offline status, relistAd function, update cancelTimedOutDeal
2. `src/config/abi.ts` — Add relistAd to ABI
3. `src/pages/MyAds.tsx` — Add Re-list and Cancel buttons for Offline ads
4. `src/pages/Index.tsx` — Ensure Offline ads are filtered out

