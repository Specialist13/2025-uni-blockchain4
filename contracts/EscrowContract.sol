// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

interface IMarketplaceContract {
    function onEscrowFunded(
        uint256 orderId,
        uint256 escrowId
    ) external;
}

contract EscrowContract {
	// Tracks payment details held in escrow for a specific order
	struct Escrow {
		uint256 id;
		address buyer;
		address seller;
		uint256 orderId; // reference to marketplace order
		uint256 amountWei; // total deposited amount
		uint256 courierFeeWei; // prepaid courier fee deducted upfront
		uint256 platformFeeWei; // platform commission to service provider
		bool fundsSecured; // payment received
		bool courierFeeTransferred; // fee sent to courier
		bool releasedToSeller; // final payout status
		EscrowStatus status;
		uint256 createdAt;
		uint256 closedAt;
	}

	enum EscrowStatus {
		Initialized,
		Funded,
		CourierFeePaid,
		AwaitingDelivery,
		ReadyForRelease,
		Released,
		Refunded
	}

    Escrow[] public escrows;

    address public owner;
    address public marketplaceContractAddress;
    address public platformFeeRecipient;

    mapping(uint256 => Escrow) public escrowById;

    uint256 public nextEscrowId = 1;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyMarketplace() {
        require(msg.sender == marketplaceContractAddress, "Only marketplace can call");
        _;
    }

    constructor(address _platformFeeRecipient) {
        owner = msg.sender;
        require(_platformFeeRecipient != address(0), "Platform fee recipient cannot be zero address");
        platformFeeRecipient = _platformFeeRecipient;
    }

    function setMarketplaceAddress(address _marketplaceAddress) public onlyOwner {
        require(_marketplaceAddress != address(0), "Marketplace address cannot be zero");
        marketplaceContractAddress = _marketplaceAddress;
    }

    function setPlatformFeeRecipient(address _platformFeeRecipient) public onlyOwner {
        require(_platformFeeRecipient != address(0), "Platform fee recipient cannot be zero address");
        platformFeeRecipient = _platformFeeRecipient;
    }

    function fundOrder(
        uint256 orderId,
        address buyer,
        address seller,
        uint256 priceWei,
        uint256 courierFeeWei,
        uint256 platformFeeWei
    ) external payable onlyMarketplace {
        require(marketplaceContractAddress != address(0), "Marketplace contract address not set");
        require(msg.value == priceWei + courierFeeWei + platformFeeWei, "Incorrect payment amount sent");

        uint256 escrowId = nextEscrowId++;
        Escrow memory newEscrow = Escrow({
            id: escrowId,
            buyer: buyer,
            seller: seller,
            orderId: orderId,
            amountWei: priceWei,
            courierFeeWei: courierFeeWei,
            platformFeeWei: platformFeeWei,
            fundsSecured: true,
            courierFeeTransferred: false,
            releasedToSeller: false,
            status: EscrowStatus.Funded,
            createdAt: block.timestamp,
            closedAt: 0
        });
        escrows.push(newEscrow);
        escrowById[escrowId] = newEscrow;

        IMarketplaceContract(marketplaceContractAddress).onEscrowFunded(orderId, escrowId);
    }

    function getEscrow(uint256 escrowId) public view returns (Escrow memory) {
        return escrowById[escrowId];
    }
}
