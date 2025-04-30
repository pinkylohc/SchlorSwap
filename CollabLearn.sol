// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface EduToken { // define the erc20 token
    function transfer(address _to, uint256 _value) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    //function approve(address _spender, uint256 _value) external returns (bool);
    //function transferFrom(address _from, address _to, uint256 _value) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
}


contract CollabLearn is EduToken{


    // -----------------------------------------
    // EduToken State & Functions
    // -----------------------------------------
    address owner; // only for address owner

    uint256 private _totalSupply;
    mapping (address => uint256) private _balances; // address -> EduToken balance
    mapping(address => bool) private _hasClaimedTokens; // for initial distribute EduToken to user
    uint256 public constant MAX_SUPPLY = 1000000 * (10**uint256(18));

    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed claimer, uint256 tokenAmount);

    constructor() { // mint the initial EduToken supply when deployed
        owner = msg.sender;
    }

    modifier onlyOwner() {  // limit access to own the contract owner   // adjust token price
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    // allow user get 10 eduToken for first time connect the wallet
    function claimInitialTokens() external {   // gas fee
        require(!_hasClaimedTokens[msg.sender], "Already claimed initial tokens");  // check if prev claimed
        _mint(msg.sender, 10 * (10**uint256(18)));
         _hasClaimedTokens[msg.sender] = true;
        emit TokensClaimed(msg.sender, 10 * (10**uint256(18)));
    } 

    function hasClaimed(address user) external view returns (bool) {
        return _hasClaimedTokens[user];
    }

    // Add this view function to check eligibility
    function canClaim(address user) external view returns (bool) {
        return !_hasClaimedTokens[user] && (_totalSupply +  10 * (10**uint256(18)) <= MAX_SUPPLY);
    }

    // 0.001 ether to buy 1 eduToken
    function buyTokens() public payable {
        require(msg.value > 0, "Must send ETH to buy tokens");
        uint256 tokensToBuy = (msg.value * 10**uint256(18)) / (0.001 ether); // 0.001 ether == 1 eduToken

        require(tokensToBuy >= 1, "Minimum purchase is 0.001 ETH for 1 token");
        require(_totalSupply + tokensToBuy <= MAX_SUPPLY, "Exceeds maximum token supply");

        _mint(msg.sender, tokensToBuy);

        // Return leftover ETH
        /*uint256 exactCost = tokensToBuy * TOKEN_PRICE;
        if (msg.value > exactCost) {
            payable(msg.sender).transfer(msg.value - exactCost);
        }*/

        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    } 

    // mint new token to a addr.
    function _mint(address account, uint256 amount) internal { 
        require(account != address(0), "ERC20: mint to the zero address");
        
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount); // !!!! change to a new emit event
    }

    // get the total supply of the whole dapp
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    // get eduToken for each individual user
    function balanceOf(address _owner) public view override returns (uint256) {
        return _balances[_owner];
    }

    // send token from msg.sender to other account
    function transfer(address _to, uint256 _value) public override returns (bool) {
        require(_to != address(0), "eduToken: transfer to the zero address");
        require(_balances[msg.sender] >= _value, "EduToken: insufficient balance");
        require(_balances[_to] + _value >= _balances[_to], "uint256 overflow");

        _balances[msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function setTokenPrice(uint256 tokenPrice) external onlyOwner{
        // owner can change token price
    }


    // -----------------------------------------
    // Reputation system (user credit - rate by other)
    // -----------------------------------------
    struct Reputation {
        uint256 score;
        uint256 lastUpdated;
    }
    
    mapping(address => Reputation) public reputations;
    event ReputationUpdated(address indexed user, int256 change);

    function _updateReputation(address user, int256 change) internal{

    }

    // -----------------------------------------
    // active system (user daily activity - gain point by access service)
    // -----------------------------------------


    // -----------------------------------------
    // Exchange (exchange education resource)
    // -----------------------------------------
    // File Exchange Section in CollabLearn.sol
    // SPDX-License-Identifier: MIT

    // Exchange System
    // Exchange System
    struct ExchangeCore {
        address initiator;
        address counterparty;
        uint256 stakeAmount;
        uint256 createdAt;
        uint256 deadline;
        Status status;
    }

    struct ExchangeDetails {
        string initiatorContent; // encrypted content
        string counterpartyContent; // encrypted content
        string initiatorDescription;
        string counterpartyDescription;
        string requirement;
        uint8 initiatorRating;
        uint8 counterpartyRating;
        uint256 ratingDeadline;
    }

    enum Status { Pending, Matched, Accepted, Completed, Expired }

    uint256 public exchangeCount = 0;
    mapping(uint256 => ExchangeCore) public exchangeCores;
    mapping(uint256 => ExchangeDetails) public exchangeDetails;
    mapping(address => uint256[]) public userExchanges;
    mapping(uint256 => bool) public expiredProcessed;

    event ExchangeCreated(uint256 indexed exchangeId, address indexed initiator);
    event ExchangeMatched(uint256 indexed exchangeId, address indexed counterparty);
    event ExchangeAccepted(uint256 indexed exchangeId);
    event ExchangeDeclined(uint256 indexed exchangeId);
    event ExchangeRated(uint256 indexed exchangeId, address indexed rater, uint8 rating);
    event ExchangeCompleted(uint256 indexed exchangeId);
    event ExchangeExpired(uint256 indexed exchangeId);

    function createExchange(
        string calldata contentLink, 
        string calldata description,
        string calldata requirement,
        uint256 stakeAmount
    ) external {
        require(stakeAmount > 0, "Invalid stake");
        require(_balances[msg.sender] >= stakeAmount, "Insufficient balance");
        
        exchangeCount++;
        uint256 newExchangeId = exchangeCount;

        exchangeCores[newExchangeId] = ExchangeCore({
            initiator: msg.sender,
            counterparty: address(0),
            stakeAmount: stakeAmount,
            createdAt: block.timestamp,
            deadline: block.timestamp + 7 days,
            status: Status.Pending
        });

        exchangeDetails[newExchangeId] = ExchangeDetails({
            initiatorContent: contentLink, // Store encrypted string directly
            counterpartyContent: "",
            initiatorDescription: description,
            counterpartyDescription: "",
            requirement: requirement,
            initiatorRating: 0,
            counterpartyRating: 0,
            ratingDeadline: 0
        });

        _transfer(msg.sender, address(this), stakeAmount);
        userExchanges[msg.sender].push(newExchangeId);
        emit ExchangeCreated(newExchangeId, msg.sender);
    }


    // - match if the counterpary == exchange owner
    function matchExchange(
    uint256 exchangeId, 
    string calldata contentLink, // This should be encrypted on frontend
    string calldata description
    ) external {
        ExchangeCore storage core = exchangeCores[exchangeId];
        ExchangeDetails storage details = exchangeDetails[exchangeId];

        require(core.status == Status.Pending, "Not available");
        require(_balances[msg.sender] >= core.stakeAmount, "Insufficient stake");
        
        core.counterparty = msg.sender;
        core.status = Status.Matched;
        details.counterpartyContent = contentLink; // Store encrypted string directly
        details.counterpartyDescription = description;
        
        _transfer(msg.sender, address(this), core.stakeAmount);
        userExchanges[msg.sender].push(exchangeId);
        emit ExchangeMatched(exchangeId, msg.sender);
    }

    function acceptExchange(uint256 exchangeId) external {
        ExchangeCore storage core = exchangeCores[exchangeId];
        require(msg.sender == core.initiator, "Only initiator");
        require(core.status == Status.Matched, "Invalid status");

        core.status = Status.Accepted; // Change status to Accepted
        exchangeDetails[exchangeId].ratingDeadline = block.timestamp + 3 days;
        emit ExchangeAccepted(exchangeId);
    }

    function declineExchange(uint256 exchangeId) external {
        ExchangeCore storage core = exchangeCores[exchangeId];
        require(msg.sender == core.initiator, "Only initiator");
        
        _refundStakes(exchangeId);
        
        core.status = Status.Pending;
        core.counterparty = address(0);
        exchangeDetails[exchangeId].counterpartyContent ="";
        exchangeDetails[exchangeId].counterpartyDescription = "";
        
        emit ExchangeDeclined(exchangeId);
    }

    function rateExchange(uint256 exchangeId, uint8 rating) external {
        ExchangeCore storage core = exchangeCores[exchangeId];
        ExchangeDetails storage details = exchangeDetails[exchangeId];
        
        require(core.status == Status.Accepted, "Invalid status");
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(block.timestamp <= details.ratingDeadline, "Rating period expired");

        if(msg.sender == core.initiator) {
            require(details.initiatorRating == 0, "Already rated");
            details.initiatorRating = rating;
        } else if(msg.sender == core.counterparty) {
            require(details.counterpartyRating == 0, "Already rated");
            details.counterpartyRating = rating;
        } else revert("Not participant");

        emit ExchangeRated(exchangeId, msg.sender, rating);

        if((details.initiatorRating > 0 && details.counterpartyRating > 0) || 
           block.timestamp > details.ratingDeadline) {
            _finalizeExchange(exchangeId);
        }
    }

    function claimExpired(uint256 exchangeId) external {
        ExchangeCore storage core = exchangeCores[exchangeId];
        require(block.timestamp > core.deadline, "Not expired");
        require(!expiredProcessed[exchangeId], "Already processed");
        
        expiredProcessed[exchangeId] = true;
        _refundStakes(exchangeId);
        core.status = Status.Expired;
        emit ExchangeExpired(exchangeId);
    }

    function _refundStakes(uint256 exchangeId) internal {
        ExchangeCore memory core = exchangeCores[exchangeId];
        _transfer(address(this), core.initiator, core.stakeAmount);
        if(core.counterparty != address(0)) {
            _transfer(address(this), core.counterparty, core.stakeAmount);
        }
    }

    function _finalizeExchange(uint256 exchangeId) internal {
        ExchangeCore storage core = exchangeCores[exchangeId];
        ExchangeDetails storage details = exchangeDetails[exchangeId];
        
        uint256 initiatorShare = core.stakeAmount;
        uint256 counterpartyShare = core.stakeAmount;
        uint256 burnAmount;

        if(details.initiatorRating < 3 || details.counterpartyRating < 3) {
            if(details.initiatorRating < 3) initiatorShare = core.stakeAmount * 80 / 100; // 20% penalty
            if(details.counterpartyRating < 3) counterpartyShare = core.stakeAmount * 80 / 100; // 20% penalty
            burnAmount = (core.stakeAmount * 2) - (initiatorShare + counterpartyShare);
        }

        _transfer(address(this), core.initiator, initiatorShare);
        _transfer(address(this), core.counterparty, counterpartyShare);
        
        if(burnAmount > 0) {
            _totalSupply -= burnAmount;
            emit Transfer(address(this), address(0), burnAmount);
        }

        core.status = Status.Completed;
        emit ExchangeCompleted(exchangeId);
    }

    // View functions
    function getExchangeContent(uint256 exchangeId) external view returns (
        string memory initiatorContent,
        string memory counterpartyContent
    ) {
        require(
            msg.sender == exchangeCores[exchangeId].initiator || 
            msg.sender == exchangeCores[exchangeId].counterparty,
            "Not a participant"
        );
        ExchangeDetails storage details = exchangeDetails[exchangeId];
        return (details.initiatorContent, details.counterpartyContent);
    }

    function getUserExchanges(address user) public view returns (uint256[] memory) {
        return userExchanges[user];
    }

    function getActiveExchanges() external view returns (uint256[] memory) {
        uint256 count = 0;
        for(uint256 i = 1; i <= exchangeCount; i++) {
            if(exchangeCores[i].status == Status.Pending) count++;
        }
        
        uint256[] memory active = new uint256[](count);
        uint256 index = 0;
        for(uint256 i = 1; i <= exchangeCount; i++) {
            if(exchangeCores[i].status == Status.Pending) {
                active[index] = i;
                index++;
            }
        }
        return active;
    }

    function getExchangeSummary(uint256 exchangeId) external view returns (
        address[2] memory participants,
        uint256[3] memory numbers,
        Status status,
        string memory requirement
    ) {
        ExchangeCore memory core = exchangeCores[exchangeId];
        return (
            [core.initiator, core.counterparty],
            [core.stakeAmount, core.createdAt, core.deadline],
            core.status,
            exchangeDetails[exchangeId].requirement
        );
    }

    function getExchangeDetails(uint256 exchangeId) external view returns (
        string[2] memory descriptions,
        uint8[2] memory ratings,
        uint256 ratingDeadline
    ) {
        ExchangeDetails memory details = exchangeDetails[exchangeId];
        return (
            [details.initiatorDescription, details.counterpartyDescription],
            [details.initiatorRating, details.counterpartyRating],
            details.ratingDeadline
        );
    }

    

    // -----------------------------------------
    // Marketplace (sell education resource, like tut, notes ...)
    // -----------------------------------------
    // frontend approval
    // func - transfer from (buyer -> owner, owner -> seller)
    // stake eduToken



    // -----------------------------------------
    // lucky draw / reward - reputation points / certain active point
    // -----------------------------------------
}