export const P2P_ESCROW_ABI = [
  // ── Read ──
  { type: "function", name: "nextAdId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nextDealId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "NATIVE_BNB", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "MAX_ACTIVE_ADS", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MAX_ACTIVE_DEALS", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MIN_AD_DURATION", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MAX_AD_DURATION", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "PROOF_RETENTION", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalEscrowedBNB", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalEscrowedUSDT", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "usdtAddress", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getAd", inputs: [{ name: "_adId", type: "uint256" }], outputs: [{ type: "tuple", components: [
    { name: "id", type: "uint256" }, { name: "seller", type: "address" }, { name: "token", type: "address" },
    { name: "tokenAmount", type: "uint256" }, { name: "pricePerToken", type: "uint256" },
    { name: "dealTimeout", type: "uint256" }, { name: "adExpiry", type: "uint256" },
    { name: "adDuration", type: "uint256" },
    { name: "paymentInfo", type: "string" }, { name: "status", type: "uint8" }
  ]}], stateMutability: "view" },
  { type: "function", name: "getDeal", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [{ type: "tuple", components: [
    { name: "id", type: "uint256" }, { name: "adId", type: "uint256" }, { name: "buyer", type: "address" },
    { name: "seller", type: "address" }, { name: "token", type: "address" }, { name: "tokenAmount", type: "uint256" },
    { name: "inrAmount", type: "uint256" }, { name: "deadline", type: "uint256" },
    { name: "buyerConfirmed", type: "bool" }, { name: "sellerConfirmed", type: "bool" },
    { name: "status", type: "uint8" }, { name: "disputeProofBuyer", type: "string" },
    { name: "disputeProofSeller", type: "string" }, { name: "disputeTimestamp", type: "uint256" }
  ]}], stateMutability: "view" },
  { type: "function", name: "adEscrowBalance", inputs: [{ name: "", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "activeAdCount", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "activeDealCountBuyer", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "activeDealCountSeller", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getChatCount", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getChatMessage", inputs: [{ name: "_dealId", type: "uint256" }, { name: "_index", type: "uint256" }], outputs: [
    { name: "sender", type: "address" }, { name: "message", type: "string" }, { name: "timestamp", type: "uint256" }
  ], stateMutability: "view" },
  { type: "function", name: "allowedTokens", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "allowedDealTimeouts", inputs: [{ name: "", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "ads", inputs: [{ name: "", type: "uint256" }], outputs: [
    { name: "id", type: "uint256" }, { name: "seller", type: "address" }, { name: "token", type: "address" },
    { name: "tokenAmount", type: "uint256" }, { name: "pricePerToken", type: "uint256" },
    { name: "dealTimeout", type: "uint256" }, { name: "adExpiry", type: "uint256" },
    { name: "adDuration", type: "uint256" },
    { name: "paymentInfo", type: "string" }, { name: "status", type: "uint8" }
  ], stateMutability: "view" },
  { type: "function", name: "deals", inputs: [{ name: "", type: "uint256" }], outputs: [
    { name: "id", type: "uint256" }, { name: "adId", type: "uint256" }, { name: "buyer", type: "address" },
    { name: "seller", type: "address" }, { name: "token", type: "address" }, { name: "tokenAmount", type: "uint256" },
    { name: "inrAmount", type: "uint256" }, { name: "deadline", type: "uint256" },
    { name: "buyerConfirmed", type: "bool" }, { name: "sellerConfirmed", type: "bool" },
    { name: "status", type: "uint8" }, { name: "disputeProofBuyer", type: "string" },
    { name: "disputeProofSeller", type: "string" }, { name: "disputeTimestamp", type: "uint256" }
  ], stateMutability: "view" },

  // ── Write ──
  { type: "function", name: "createAd", inputs: [
    { name: "_token", type: "address" }, { name: "_tokenAmount", type: "uint256" },
    { name: "_pricePerToken", type: "uint256" }, { name: "_dealTimeout", type: "uint256" },
    { name: "_adDuration", type: "uint256" }, { name: "_paymentInfo", type: "string" }
  ], outputs: [], stateMutability: "payable" },
  { type: "function", name: "cancelAd", inputs: [{ name: "_adId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claimExpiredAd", inputs: [{ name: "_adId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "relistAd", inputs: [{ name: "_adId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "acceptAd", inputs: [{ name: "_adId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "buyerConfirmPayment", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "sellerConfirmReceived", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelTimedOutDeal", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "raiseDispute", inputs: [{ name: "_dealId", type: "uint256" }, { name: "_proofHash", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "submitDisputeProof", inputs: [{ name: "_dealId", type: "uint256" }, { name: "_proofHash", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveDispute", inputs: [{ name: "_dealId", type: "uint256" }, { name: "_toSeller", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "sendChat", inputs: [{ name: "_dealId", type: "uint256" }, { name: "_message", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setAllowedToken", inputs: [{ name: "_token", type: "address" }, { name: "_allowed", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "clearExpiredProof", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "emergencyWithdrawBNB", inputs: [{ name: "_amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "emergencyWithdrawToken", inputs: [{ name: "_token", type: "address" }, { name: "_amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferOwnership", inputs: [{ name: "newOwner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "renounceOwnership", inputs: [], outputs: [], stateMutability: "nonpayable" },

  // ── Events ──
  { type: "event", name: "AdCreated", inputs: [
    { name: "adId", type: "uint256", indexed: true }, { name: "seller", type: "address", indexed: true },
    { name: "token", type: "address", indexed: false }, { name: "amount", type: "uint256", indexed: false },
    { name: "pricePerToken", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "AdCancelled", inputs: [{ name: "adId", type: "uint256", indexed: true }] },
  { type: "event", name: "AdExpired", inputs: [{ name: "adId", type: "uint256", indexed: true }] },
  { type: "event", name: "AdOffline", inputs: [{ name: "adId", type: "uint256", indexed: true }] },
  { type: "event", name: "AdRelisted", inputs: [{ name: "adId", type: "uint256", indexed: true }, { name: "newExpiry", type: "uint256", indexed: false }] },
  { type: "event", name: "DealCreated", inputs: [
    { name: "dealId", type: "uint256", indexed: true }, { name: "adId", type: "uint256", indexed: true },
    { name: "buyer", type: "address", indexed: true }, { name: "inrAmount", type: "uint256", indexed: false },
    { name: "deadline", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "BuyerConfirmedPayment", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "SellerConfirmedReceipt", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "DealCompleted", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "DealCancelled", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "reason", type: "string", indexed: false }] },
  { type: "event", name: "DealDisputed", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "by", type: "address", indexed: true }] },
  { type: "event", name: "DisputeResolved", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "recipient", type: "address", indexed: true }] },
  { type: "event", name: "TokenWhitelisted", inputs: [{ name: "token", type: "address", indexed: true }, { name: "allowed", type: "bool", indexed: false }] },
  { type: "event", name: "ChatSent", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "sender", type: "address", indexed: true }] },
  { type: "event", name: "EmergencyWithdraw", inputs: [{ name: "token", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "OwnershipTransferred", inputs: [{ name: "previousOwner", type: "address", indexed: true }, { name: "newOwner", type: "address", indexed: true }] },

  // ── Errors ──
  { type: "error", name: "OwnableInvalidOwner", inputs: [{ name: "owner", type: "address" }] },
  { type: "error", name: "OwnableUnauthorizedAccount", inputs: [{ name: "account", type: "address" }] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "SafeERC20FailedOperation", inputs: [{ name: "token", type: "address" }] },

  // ── Receive ──
  { type: "receive", stateMutability: "payable" },
] as const;

export const ERC20_ABI = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
] as const;
