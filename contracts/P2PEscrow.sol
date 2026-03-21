// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title P2PEscrow
 * @notice Trustless P2P crypto-to-INR escrow contract.
 *
 * ── Flow ──
 * 1. Seller creates an ad, depositing ERC-20 tokens into escrow.
 *    They set: price per token (INR paise), deal timeout, ad duration,
 *    and their payment details (UPI / bank).
 * 2. Ad stays live until a buyer accepts OR ad duration expires.
 *    Seller can cancel any time BEFORE a buyer accepts.
 * 3. Buyer accepts → deal timer starts.
 *    - Buyer sends INR off-chain, then calls `buyerConfirmPayment()`.
 *    - Once buyer confirms, funds are LOCKED — seller cannot reclaim.
 *    - Seller verifies receipt, calls `sellerConfirmReceived()`.
 *    - Both confirmations → tokens released to buyer.
 * 4. If buyer does NOT confirm within deal timeout → deal auto-cancels,
 *    seller reclaims tokens, ad is re-listed.
 * 5. If buyer confirmed but seller disputes → either party raises a
 *    dispute; admin resolves by releasing to buyer or seller.
 *
 * ── Limits (enforced on-chain) ──
 * • Max 2 active (live) ads per address.
 * • Max 2 active (accepted) deals per address.
 *
 * ── Dispute / Admin ──
 * • Admin can resolve any disputed deal, sending funds to buyer or seller.
 * • Off-chain proof (screenshots / video) is referenced by IPFS hash;
 *   deletion after 48 h is handled off-chain.
 */
contract P2PEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ───────── Enums ─────────

    enum AdStatus   { Live, InDeal, Completed, Cancelled }
    enum DealStatus { Active, BuyerConfirmed, Completed, Cancelled, Disputed, Resolved }

    // ───────── Structs ─────────

    struct Ad {
        uint256 id;
        address seller;
        address token;           // ERC-20 token address (e.g. USDT)
        uint256 tokenAmount;     // amount in token decimals
        uint256 pricePerToken;   // price in INR paise (1 INR = 100 paise) for 1 full token unit
        uint256 dealTimeout;     // seconds buyer has to pay after accepting
        uint256 adExpiry;        // timestamp when ad expires if no one accepts
        string  paymentInfo;     // seller's UPI / bank details (encrypted off-chain recommended)
        AdStatus status;
    }

    struct Deal {
        uint256 id;
        uint256 adId;
        address buyer;
        address seller;
        address token;
        uint256 tokenAmount;
        uint256 inrAmount;       // calculated INR paise the buyer owes
        uint256 deadline;        // block.timestamp + dealTimeout
        bool    buyerConfirmed;  // buyer says "I paid"
        bool    sellerConfirmed; // seller says "I received"
        DealStatus status;
        string  disputeProofBuyer;   // IPFS hash of buyer proof
        string  disputeProofSeller;  // IPFS hash of seller proof
        uint256 disputeTimestamp;
    }

    // ───────── State ─────────

    uint256 public nextAdId   = 1;
    uint256 public nextDealId = 1;

    uint256 public constant MAX_ACTIVE_ADS   = 2;
    uint256 public constant MAX_ACTIVE_DEALS = 2;
    uint256 public constant MIN_AD_DURATION  = 30 minutes;
    uint256 public constant MAX_AD_DURATION  = 72 hours;
    uint256 public constant PROOF_RETENTION  = 48 hours;

    // Allowed deal timeouts (seconds)
    uint256[] public allowedDealTimeouts = [15 minutes, 30 minutes, 1 hours, 2 hours];

    mapping(uint256 => Ad)   public ads;
    mapping(uint256 => Deal) public deals;

    // Per-user counters
    mapping(address => uint256) public activeAdCount;
    mapping(address => uint256) public activeDealCountBuyer;
    mapping(address => uint256) public activeDealCountSeller;

    // Chat messages stored on-chain (lightweight; heavy chat should be off-chain)
    struct ChatMessage {
        address sender;
        string  message;
        uint256 timestamp;
    }
    mapping(uint256 => ChatMessage[]) public dealChats; // dealId => messages

    // ───────── Events ─────────

    event AdCreated(uint256 indexed adId, address indexed seller, address token, uint256 amount, uint256 pricePerToken);
    event AdCancelled(uint256 indexed adId);
    event AdExpired(uint256 indexed adId);

    event DealCreated(uint256 indexed dealId, uint256 indexed adId, address indexed buyer, uint256 inrAmount, uint256 deadline);
    event BuyerConfirmedPayment(uint256 indexed dealId);
    event SellerConfirmedReceipt(uint256 indexed dealId);
    event DealCompleted(uint256 indexed dealId);
    event DealCancelled(uint256 indexed dealId, string reason);
    event DealDisputed(uint256 indexed dealId, address indexed by);
    event DisputeResolved(uint256 indexed dealId, address indexed recipient);

    event ChatSent(uint256 indexed dealId, address indexed sender);

    // ───────── Modifiers ─────────

    modifier onlyDealParty(uint256 _dealId) {
        Deal storage d = deals[_dealId];
        require(msg.sender == d.buyer || msg.sender == d.seller, "Not a deal party");
        _;
    }

    // ───────── Constructor ─────────

    constructor() Ownable(msg.sender) {}

    // ════════════════════════════════════════════
    //                  AD  LOGIC
    // ════════════════════════════════════════════

    /**
     * @notice Create a sell ad. Tokens are transferred into escrow immediately.
     * @param _token        ERC-20 token address
     * @param _tokenAmount  Amount of tokens to sell
     * @param _pricePerToken Price per 1 full token unit in INR paise
     * @param _dealTimeout  Seconds the buyer gets to pay (must be an allowed value)
     * @param _adDuration   How long the ad stays live (30 min – 72 h)
     * @param _paymentInfo  Seller's payment details (UPI id, bank info, etc.)
     */
    function createAd(
        address _token,
        uint256 _tokenAmount,
        uint256 _pricePerToken,
        uint256 _dealTimeout,
        uint256 _adDuration,
        string calldata _paymentInfo
    ) external nonReentrant {
        require(_tokenAmount > 0, "Amount must be > 0");
        require(_pricePerToken > 0, "Price must be > 0");
        require(_isAllowedTimeout(_dealTimeout), "Invalid deal timeout");
        require(_adDuration >= MIN_AD_DURATION && _adDuration <= MAX_AD_DURATION, "Ad duration out of range");
        require(activeAdCount[msg.sender] < MAX_ACTIVE_ADS, "Max 2 active ads");
        require(bytes(_paymentInfo).length > 0, "Payment info required");

        // Transfer tokens to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _tokenAmount);

        uint256 adId = nextAdId++;
        ads[adId] = Ad({
            id: adId,
            seller: msg.sender,
            token: _token,
            tokenAmount: _tokenAmount,
            pricePerToken: _pricePerToken,
            dealTimeout: _dealTimeout,
            adExpiry: block.timestamp + _adDuration,
            paymentInfo: _paymentInfo,
            status: AdStatus.Live
        });

        activeAdCount[msg.sender]++;

        emit AdCreated(adId, msg.sender, _token, _tokenAmount, _pricePerToken);
    }

    /**
     * @notice Cancel a live ad (only if no buyer has accepted).
     */
    function cancelAd(uint256 _adId) external nonReentrant {
        Ad storage a = ads[_adId];
        require(msg.sender == a.seller, "Not your ad");
        require(a.status == AdStatus.Live, "Ad not live");

        a.status = AdStatus.Cancelled;
        activeAdCount[msg.sender]--;

        // Refund tokens
        IERC20(a.token).safeTransfer(a.seller, a.tokenAmount);

        emit AdCancelled(_adId);
    }

    /**
     * @notice Claim back tokens from an expired ad that nobody accepted.
     */
    function claimExpiredAd(uint256 _adId) external nonReentrant {
        Ad storage a = ads[_adId];
        require(msg.sender == a.seller, "Not your ad");
        require(a.status == AdStatus.Live, "Ad not live");
        require(block.timestamp > a.adExpiry, "Ad not expired yet");

        a.status = AdStatus.Cancelled;
        activeAdCount[msg.sender]--;

        IERC20(a.token).safeTransfer(a.seller, a.tokenAmount);

        emit AdExpired(_adId);
    }

    // ════════════════════════════════════════════
    //                 DEAL  LOGIC
    // ════════════════════════════════════════════

    /**
     * @notice Buyer accepts an ad → deal starts, timer begins.
     * INR amount is calculated: (tokenAmount * pricePerToken) / (10 ** tokenDecimals)
     * For simplicity we store the raw multiplication; front-end divides by decimals.
     */
    function acceptAd(uint256 _adId) external nonReentrant {
        Ad storage a = ads[_adId];
        require(a.status == AdStatus.Live, "Ad not available");
        require(block.timestamp <= a.adExpiry, "Ad expired");
        require(msg.sender != a.seller, "Cannot accept own ad");
        require(activeDealCountBuyer[msg.sender] < MAX_ACTIVE_DEALS, "Max 2 active deals as buyer");

        a.status = AdStatus.InDeal;

        uint256 dealId = nextDealId++;
        uint256 deadline = block.timestamp + a.dealTimeout;

        // INR paise = tokenAmount * pricePerToken / 10^decimals
        // We store raw product; UI divides by token decimals for display.
        uint256 inrAmount = a.tokenAmount * a.pricePerToken;

        deals[dealId] = Deal({
            id: dealId,
            adId: _adId,
            buyer: msg.sender,
            seller: a.seller,
            token: a.token,
            tokenAmount: a.tokenAmount,
            inrAmount: inrAmount,
            deadline: deadline,
            buyerConfirmed: false,
            sellerConfirmed: false,
            status: DealStatus.Active,
            disputeProofBuyer: "",
            disputeProofSeller: "",
            disputeTimestamp: 0
        });

        activeDealCountBuyer[msg.sender]++;
        activeDealCountSeller[a.seller]++;

        emit DealCreated(dealId, _adId, msg.sender, inrAmount, deadline);
    }

    /**
     * @notice Buyer confirms they sent INR payment.
     * After this, the seller CANNOT reclaim — funds are locked until
     * seller confirms receipt or admin resolves a dispute.
     */
    function buyerConfirmPayment(uint256 _dealId) external {
        Deal storage d = deals[_dealId];
        require(msg.sender == d.buyer, "Not the buyer");
        require(d.status == DealStatus.Active, "Deal not active");
        require(block.timestamp <= d.deadline, "Deal timed out");

        d.buyerConfirmed = true;
        d.status = DealStatus.BuyerConfirmed;

        emit BuyerConfirmedPayment(_dealId);
    }

    /**
     * @notice Seller confirms they received INR.
     * Both parties have now confirmed → tokens released to buyer.
     */
    function sellerConfirmReceived(uint256 _dealId) external nonReentrant {
        Deal storage d = deals[_dealId];
        require(msg.sender == d.seller, "Not the seller");
        require(d.status == DealStatus.BuyerConfirmed, "Buyer hasn't confirmed yet");

        d.sellerConfirmed = true;
        d.status = DealStatus.Completed;

        _completeDeal(d);

        emit SellerConfirmedReceipt(_dealId);
        emit DealCompleted(_dealId);
    }

    /**
     * @notice Cancel a timed-out deal where the buyer never confirmed payment.
     * Seller reclaims tokens and the ad is re-listed.
     * Anyone can call this (seller, buyer, or keeper bot).
     */
    function cancelTimedOutDeal(uint256 _dealId) external nonReentrant {
        Deal storage d = deals[_dealId];
        require(
            d.status == DealStatus.Active,
            "Only active (unconfirmed) deals can time out"
        );
        require(block.timestamp > d.deadline, "Deadline not reached");

        d.status = DealStatus.Cancelled;

        // Return tokens to seller
        IERC20(d.token).safeTransfer(d.seller, d.tokenAmount);

        // Re-list the ad
        Ad storage a = ads[d.adId];
        a.status = AdStatus.Live;
        // Extend ad expiry by the original remaining duration or a minimum
        if (a.adExpiry < block.timestamp) {
            a.adExpiry = block.timestamp + 30 minutes; // give seller 30 min to re-manage
        }

        _decrementDealCounters(d);

        emit DealCancelled(_dealId, "Buyer did not pay in time");
    }

    // ════════════════════════════════════════════
    //              DISPUTE  LOGIC
    // ════════════════════════════════════════════

    /**
     * @notice Either party raises a dispute (only after buyer confirmed payment).
     */
    function raiseDispute(uint256 _dealId, string calldata _proofHash) external onlyDealParty(_dealId) {
        Deal storage d = deals[_dealId];
        require(
            d.status == DealStatus.BuyerConfirmed,
            "Can only dispute after buyer confirms"
        );

        d.status = DealStatus.Disputed;
        d.disputeTimestamp = block.timestamp;

        if (msg.sender == d.buyer) {
            d.disputeProofBuyer = _proofHash;
        } else {
            d.disputeProofSeller = _proofHash;
        }

        emit DealDisputed(_dealId, msg.sender);
    }

    /**
     * @notice Submit proof for an existing dispute.
     */
    function submitDisputeProof(uint256 _dealId, string calldata _proofHash) external onlyDealParty(_dealId) {
        Deal storage d = deals[_dealId];
        require(d.status == DealStatus.Disputed, "No active dispute");

        if (msg.sender == d.buyer) {
            d.disputeProofBuyer = _proofHash;
        } else {
            d.disputeProofSeller = _proofHash;
        }
    }

    /**
     * @notice Admin resolves a dispute — sends escrowed tokens to the rightful party.
     * @param _toSeller true = refund seller, false = release to buyer
     */
    function resolveDispute(uint256 _dealId, bool _toSeller) external onlyOwner nonReentrant {
        Deal storage d = deals[_dealId];
        require(d.status == DealStatus.Disputed, "Not disputed");

        d.status = DealStatus.Resolved;
        address recipient = _toSeller ? d.seller : d.buyer;

        IERC20(d.token).safeTransfer(recipient, d.tokenAmount);

        // Mark ad completed
        ads[d.adId].status = AdStatus.Completed;
        activeAdCount[d.seller]--;
        _decrementDealCounters(d);

        emit DisputeResolved(_dealId, recipient);
    }

    // ════════════════════════════════════════════
    //                  CHAT
    // ════════════════════════════════════════════

    /**
     * @notice Send a chat message in a deal (on-chain, lightweight).
     */
    function sendChat(uint256 _dealId, string calldata _message) external onlyDealParty(_dealId) {
        Deal storage d = deals[_dealId];
        require(
            d.status == DealStatus.Active ||
            d.status == DealStatus.BuyerConfirmed ||
            d.status == DealStatus.Disputed,
            "Chat closed"
        );
        require(bytes(_message).length > 0 && bytes(_message).length <= 500, "Message too long or empty");

        dealChats[_dealId].push(ChatMessage({
            sender: msg.sender,
            message: _message,
            timestamp: block.timestamp
        }));

        emit ChatSent(_dealId, msg.sender);
    }

    function getChatCount(uint256 _dealId) external view returns (uint256) {
        return dealChats[_dealId].length;
    }

    function getChatMessage(uint256 _dealId, uint256 _index) external view returns (
        address sender, string memory message, uint256 timestamp
    ) {
        ChatMessage storage m = dealChats[_dealId][_index];
        return (m.sender, m.message, m.timestamp);
    }

    // ════════════════════════════════════════════
    //               VIEW  HELPERS
    // ════════════════════════════════════════════

    function getAd(uint256 _adId) external view returns (Ad memory) {
        return ads[_adId];
    }

    function getDeal(uint256 _dealId) external view returns (Deal memory) {
        return deals[_dealId];
    }

    /**
     * @notice Check if dispute proof should be cleared (>48h old).
     * Actual deletion is a no-op on-chain (strings can't truly be deleted),
     * but the front-end should stop displaying proofs after 48h.
     * An off-chain keeper can call this to clear the hash references.
     */
    function clearExpiredProof(uint256 _dealId) external {
        Deal storage d = deals[_dealId];
        require(d.status == DealStatus.Resolved, "Deal not resolved");
        require(d.disputeTimestamp > 0, "No dispute");
        require(block.timestamp > d.disputeTimestamp + PROOF_RETENTION, "48h not passed");

        d.disputeProofBuyer = "";
        d.disputeProofSeller = "";
    }

    // ════════════════════════════════════════════
    //               INTERNAL
    // ════════════════════════════════════════════

    function _completeDeal(Deal storage d) internal {
        IERC20(d.token).safeTransfer(d.buyer, d.tokenAmount);

        ads[d.adId].status = AdStatus.Completed;
        activeAdCount[d.seller]--;
        _decrementDealCounters(d);
    }

    function _decrementDealCounters(Deal storage d) internal {
        if (activeDealCountBuyer[d.buyer] > 0)  activeDealCountBuyer[d.buyer]--;
        if (activeDealCountSeller[d.seller] > 0) activeDealCountSeller[d.seller]--;
    }

    function _isAllowedTimeout(uint256 _t) internal view returns (bool) {
        for (uint256 i = 0; i < allowedDealTimeouts.length; i++) {
            if (allowedDealTimeouts[i] == _t) return true;
        }
        return false;
    }
}
