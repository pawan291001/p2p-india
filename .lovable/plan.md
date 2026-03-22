

# P2PEscrow Contract v3 — Per-Ad Escrow + Auto Re-list

## What You Asked For

1. **Per-ad fund isolation** — Each ad's USDT/BNB is tracked separately so one ad's funds can never be used for another ad's deal.
2. **Auto re-list on deal timeout** — When a buyer fails to complete within the deal timeout (e.g. 15 min), instead of refunding the seller and cancelling the ad, the ad goes **Live again** with its original full ad duration reset. The USDT stays locked in the contract.
3. **Seller can still cancel and get refund** — Seller can cancel the ad manually at any time (when Live) to withdraw their tokens.
4. **Full audit** of the contract for other issues.

## Audit Findings (Current Contract)

1. **Ghost ad bug** — Already fixed in v2 (cancelTimedOutDeal cancels ad). Will be replaced by new re-list logic.
2. **No per-ad balance tracking** — Contract relies on total contract balance. If emergency withdraw is used carelessly, it could drain escrowed funds. Will fix with per-ad tracking.
3. **Ad expiry during InDeal** — If ad expires while a deal is active, the deal still works (good), but after timeout the ad gets cancelled. New logic: ad expiry is paused during deals and reset after timeout.
4. **Double-decrement risk** — `activeAdCount` is decremented in both `sellerConfirmReceived` and `cancelTimedOutDeal`. With re-list logic, we only decrement on final cancel/complete, not on timeout re-list.
5. **No event for re-list** — Will add `AdRelisted` event.

## Key Contract Changes

### 1. Add per-ad escrow balance tracking
```solidity
mapping(uint256 => uint256) public adEscrowBalance;
```
Set on `createAd`, checked on `acceptAd`, cleared on final release/cancel/refund.

### 2. Store original ad duration in Ad struct
```solidity
struct Ad {
    ...
    uint256 adDuration;  // NEW: original duration for re-listing
    ...
}
```

### 3. New `cancelTimedOutDeal` — Re-list instead of refund
```
When deal times out (buyer didn't confirm):
  - Deal status → Cancelled
  - Ad status → Live (back on marketplace)
  - Ad expiry → block.timestamp + ad.adDuration (fresh timer)
  - USDT stays in contract (adEscrowBalance unchanged)
  - Decrement deal counters only (NOT ad counter)
```

### 4. Seller manual cancel still refunds
`cancelAd` unchanged — seller gets tokens back, ad cancelled, escrow balance cleared.

### 5. `claimExpiredAd` still refunds on true expiry
When ad duration fully expires with no active deal, seller reclaims.

### 6. Safety checks
- `acceptAd` verifies `adEscrowBalance[adId] >= a.tokenAmount`
- `sellerConfirmReceived` transfers from escrow balance, zeroes it
- `resolveDispute` transfers from escrow balance, zeroes it
- Emergency withdraw checks against total escrowed amount to prevent draining active escrows

### 7. New event
```solidity
event AdRelisted(uint256 indexed adId, uint256 newExpiry);
```

## Full Flow After Changes

```text
Seller creates ad (100 USDT, 24h duration, 15min deal timeout)
  → USDT locked, adEscrowBalance[adId] = 100 USDT
  → Ad is Live for 24 hours

Buyer A accepts → Ad = InDeal, deal timer = 15 min
  Buyer A fails to pay in 15 min → Deal cancelled
  → Ad goes Live AGAIN with fresh 24h timer
  → USDT stays locked in contract

Buyer B accepts → Ad = InDeal, deal timer = 15 min
  Buyer B pays, seller confirms → USDT released to Buyer B
  → Ad = Completed, escrow balance = 0

OR: Seller cancels ad (when Live) → USDT refunded, ad = Cancelled
```

## Files to Change

- **`contracts/P2PEscrow.sol`** — Full rewrite with all changes above. You redeploy this.
- After redeployment, you give the new contract address and I update `src/config/wagmi.ts` and `src/config/abi.ts`.

## What Won't Change
- ABI structure stays compatible (same function names/signatures, just new behavior)
- UI code mostly unchanged — the `refundedRelistedAdIds` workaround in Index.tsx can be removed since the contract now handles it properly

