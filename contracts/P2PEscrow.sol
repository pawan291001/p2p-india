// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title P2PEscrow
 * @notice Trustless P2P crypto-to-INR escrow on BNB Smart Chain.
 *         Supports native BNB and BEP-20 USDT only.
 *
 * ── Token Rules ──
 * • address(0) = native BNB
 * • Only whitelisted BEP-20 tokens (USDT) are accepted.
 *
 * ── Flow ──
 * 1. Seller creates ad, depositing BNB or USDT into escrow.
 * 2. Ad stays live until buyer accepts OR ad duration expires.
 * 3. Buyer accepts → deal timer starts.
 *    - Buyer sends INR off-chain, then calls buyerConfirmPayment().
 *    - Once buyer confirms, funds are LOCKED.
 *    - Seller verifies receipt, calls sellerConfirmReceived().
 *    - Both confirmations → tokens released to buyer.
 * 4. If buyer does NOT confirm within deal timeout → deal auto-cancels.
 * 5. Dispute → admin resolves by releasing to buyer or seller.
 */
contract P2PEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ───────── Constants ─────────
    address public constant NATIVE_BNB = address(0);

    // ───────── Enums ─────────
    enum AdStatus   { Live, InDeal, Completed, Cancelled }
    enum DealStatus { Active, BuyerConfirmed, Completed, Cancelled, Disputed, Resolved }

    // ───────── Structs ─────────
    struct Ad {
        uint256 id;
        address seller;
        address token;           // address(0) = native BNB, else BEP-20
        uint256 tokenAmount;
        uint256 pricePerToken;   // INR paise per 1 full token (18 decimals)
        uint256 dealTimeout;
        uint256 adExpiry;
        string  paymentInfo;     // seller UPI / bank details
        AdStatus status;
    }

    struct Deal {
        uint256 id;
        uint256 adId;
        address buyer;
        address seller;
        address token;
        uint256 tokenAmount;
        uint256 inrAmount;       // tokenAmount * pricePerToken (UI divides by decimals)
        uint256 deadline;
        bool    buyerConfirmed;
        bool    sellerConfirmed;
        DealStatus status;
        string  disputeProofBuyer;
        string  disputeProofSeller;
        uint256 disputeTimestamp;
    }

    struct ChatMessage {
        address sender;
        string  message;
        uint256 timestamp;
    }

    // ───────── State ─────────
    uint256 public nextAdId   = 1;
    uint256 public nextDealId = 1;

    uint256 public constant MAX_ACTIVE_ADS   = 2;
    uint256 public constant MAX_ACTIVE_DEALS = 2;
    uint256 public constant MIN_AD_DURATION  = 30 minutes;
    uint256 public constant MAX_AD_DURATION  = 72 hours;
    uint256 public constant PROOF_RETENTION  = 48 hours;

    uint256[] public allowedDealTimeouts = [15 minutes, 30 minutes, 1 hours, 2 hours];

    mapping(address => bool) public allowedTokens; // whitelisted BEP-20s

    mapping(uint256 => Ad)   public ads;
    mapping(uint256 => Deal) public deals;

    mapping(address => uint256) public activeAdCount;
    mapping(address => uint256) public activeDealCountBuyer;
    mapping(address => uint256) public activeDealCountSeller;

    mapping(uint256 => ChatMessage[]) public dealChats;

    // ───────── Events ─────────
    event TokenWhitelisted(address indexed token, bool allowed);
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
    constructor(address _usdt) Ownable(msg.sender) {
        // Whitelist USDT on BSC
        allowedTokens[_usdt] = true;
        emit TokenWhitelisted(_usdt, true);
    }

    // ───────── Admin: Token Whitelist ─────────
    function setAllowedToken(address _token, bool _allowed) external onlyOwner {
        require(_token != NATIVE_BNB, "BNB is always allowed");
        allowedTokens[_token] = _allowed;
        emit TokenWhitelisted(_token, _allowed);
    }

    // ════════════════════════════════════════════
    //                  AD  LOGIC
    // ════════════════════════════════════════════

    /**
     * @notice Create a sell ad. For BNB, send value. For USDT, approve first.
     * @param _token address(0) for BNB, or whitelisted BEP-20
     */
    function createAd(
        address _token,
        uint256 _tokenAmount,
        uint256 _pricePerToken,
        uint256 _dealTimeout,
        uint256 _adDuration,
        string calldata _paymentInfo
    ) external payable nonReentrant {
        require(_tokenAmount > 0, "Amount must be > 0");
        require(_pricePerToken > 0, "Price must be > 0");
        require(_isAllowedTimeout(_dealTimeout), "Invalid deal timeout");
        require(_adDuration >= MIN_AD_DURATION && _adDuration <= MAX_AD_DURATION, "Ad duration out of range");
        require(activeAdCount[msg.sender] < MAX_ACTIVE_ADS, "Max 2 active ads");
        require(bytes(_paymentInfo).length > 0, "Payment info required");

        if (_token == NATIVE_BNB) {
            require(msg.value == _tokenAmount, "BNB amount mismatch");
        } else {
            require(allowedTokens[_token], "Token not allowed");
            require(msg.value == 0, "Do not send BNB for token ads");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        }

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

    function cancelAd(uint256 _adId) external nonReentrant {
        Ad storage a = ads[_adId];
        require(msg.sender == a.seller, "Not your ad");
        require(a.status == AdStatus.Live, "Ad not live");

        a.status = AdStatus.Cancelled;
        activeAdCount[msg.sender]--;

        _transferOut(a.token, a.seller, a.tokenAmount);
        emit AdCancelled(_adId);
    }

    function claimExpiredAd(uint256 _adId) external nonReentrant {
        Ad storage a = ads[_adId];
        require(msg.sender == a.seller, "Not your ad");
        require(a.status == AdStatus.Live, "Ad not live");
        require(block.timestamp > a.adExpiry, "Ad not expired yet");

        a.status = AdStatus.Cancelled;
        activeAdCount[msg.sender]--;

        _transferOut(a.token, a.seller, a.tokenAmount);
        emit AdExpired(_adId);
    }

    // ════════════════════════════════════════════
    //                 DEAL  LOGIC
    // ════════════════════════════════════════════

    function acceptAd(uint256 _adId) external nonReentrant {
        Ad storage a = ads[_adId];
        require(a.status == AdStatus.Live, "Ad not available");
        require(block.timestamp <= a.adExpiry, "Ad expired");
        require(msg.sender != a.seller, "Cannot accept own ad");
        require(activeDealCountBuyer[msg.sender] < MAX_ACTIVE_DEALS, "Max 2 active deals as buyer");

        a.status = AdStatus.InDeal;

        uint256 dealId = nextDealId++;
        uint256 deadline = block.timestamp + a.dealTimeout;
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

    function buyerConfirmPayment(uint256 _dealId) external {
        Deal storage d = deals[_dealId];
        require(msg.sender == d.buyer, "Not the buyer");
        require(d.status == DealStatus.Active, "Deal not active");
        require(block.timestamp <= d.deadline, "Deal timed out");

        d.buyerConfirmed = true;
        d.status = DealStatus.BuyerConfirmed;
        emit BuyerConfirmedPayment(_dealId);
    }

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

    function cancelTimedOutDeal(uint256 _dealId) external nonReentrant {
        Deal storage d = deals[_dealId];
        require(d.status == DealStatus.Active, "Only active deals can time out");
        require(block.timestamp > d.deadline, "Deadline not reached");

        d.status = DealStatus.Cancelled;
        _transferOut(d.token, d.seller, d.tokenAmount);

        Ad storage a = ads[d.adId];
        a.status = AdStatus.Live;
        if (a.adExpiry < block.timestamp) {
            a.adExpiry = block.timestamp + 30 minutes;
        }

        _decrementDealCounters(d);
        emit DealCancelled(_dealId, "Buyer did not pay in time");
    }

    // ════════════════════════════════════════════
    //              DISPUTE  LOGIC
    // ════════════════════════════════════════════

    function raiseDispute(uint256 _dealId, string calldata _proofHash) external onlyDealParty(_dealId) {
        Deal storage d = deals[_dealId];
        require(d.status == DealStatus.BuyerConfirmed, "Can only dispute after buyer confirms");

        d.status = DealStatus.Disputed;
        d.disputeTimestamp = block.timestamp;

        if (msg.sender == d.buyer) {
            d.disputeProofBuyer = _proofHash;
        } else {
            d.disputeProofSeller = _proofHash;
        }
        emit DealDisputed(_dealId, msg.sender);
    }

    function submitDisputeProof(uint256 _dealId, string calldata _proofHash) external onlyDealParty(_dealId) {
        Deal storage d = deals[_dealId];
        require(d.status == DealStatus.Disputed, "No active dispute");

        if (msg.sender == d.buyer) {
            d.disputeProofBuyer = _proofHash;
        } else {
            d.disputeProofSeller = _proofHash;
        }
    }

    function resolveDispute(uint256 _dealId, bool _toSeller) external onlyOwner nonReentrant {
        Deal storage d = deals[_dealId];
        require(d.status == DealStatus.Disputed, "Not disputed");

        d.status = DealStatus.Resolved;
        address recipient = _toSeller ? d.seller : d.buyer;

        _transferOut(d.token, recipient, d.tokenAmount);

        ads[d.adId].status = AdStatus.Completed;
        activeAdCount[d.seller]--;
        _decrementDealCounters(d);

        emit DisputeResolved(_dealId, recipient);
    }

    // ════════════════════════════════════════════
    //                  CHAT
    // ════════════════════════════════════════════

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
    //               VIEW HELPERS
    // ════════════════════════════════════════════

    function getAd(uint256 _adId) external view returns (Ad memory) {
        return ads[_adId];
    }

    function getDeal(uint256 _dealId) external view returns (Deal memory) {
        return deals[_dealId];
    }

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

    function _transferOut(address _token, address _to, uint256 _amount) internal {
        if (_token == NATIVE_BNB) {
            (bool success, ) = payable(_to).call{value: _amount}("");
            require(success, "BNB transfer failed");
        } else {
            IERC20(_token).safeTransfer(_to, _amount);
        }
    }

    function _completeDeal(Deal storage d) internal {
        _transferOut(d.token, d.buyer, d.tokenAmount);
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

    // Accept BNB sent directly
    receive() external payable {}
}
