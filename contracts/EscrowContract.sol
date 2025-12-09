// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

interface IMarketplaceContract {
    function onEscrowFunded(
        uint256 orderId,
        uint256 escrowId
    ) external;
}

interface ICourierContract {
    function receivedCourierFee(
        uint256 orderId,
        uint256 escrowId
    ) external payable;
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
		Released
	}

    Escrow[] public escrows;

    address public owner;
    address public marketplaceContractAddress;
    address public platformFeeRecipient;
    address public courierFeeRecipient;

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

    constructor(address _platformFeeRecipient, address _courierFeeRecipient) {
        owner = msg.sender;
        require(_platformFeeRecipient != address(0), "Platform fee recipient cannot be zero address");
        platformFeeRecipient = _platformFeeRecipient;
        require(_courierFeeRecipient != address(0), "Courier fee recipient cannot be zero address");
        courierFeeRecipient = _courierFeeRecipient;
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
        transferCourierFee(escrowId, payable(courierFeeRecipient), courierFeeWei);
        IMarketplaceContract(marketplaceContractAddress).onEscrowFunded(orderId, escrowId);
    }

    function getEscrow(uint256 escrowId) public view returns (Escrow memory) {
        return escrowById[escrowId];
    }

    function transferCourierFee(uint256 escrowId, address payable courierAddress, uint256 amount) internal {
        Escrow storage escrow = escrowById[escrowId];
        require(escrow.id != 0, "Escrow does not exist");
        require(escrow.fundsSecured, "Escrow funds not secured");
        require(!escrow.courierFeeTransferred, "Courier fee already transferred");
        require(amount == escrow.courierFeeWei, "Incorrect courier fee amount");

        escrow.courierFeeTransferred = true;
        escrow.status = EscrowStatus.CourierFeePaid;

        (bool success, ) = courierAddress.call{value: amount}(
            abi.encodeWithSignature("receivedCourierFee(uint256,uint256)", escrow.orderId, escrowId)
        );
        require(success, "Courier fee transfer failed");
    }

    event CourierFeeConfirmed(
        uint256 indexed orderId,
        uint256 indexed escrowId,
        uint256 amountWei
    );

    function onCourierFeeConfirmed(uint256 orderId, uint256 escrowId, uint256 amountWei) external {
        require(msg.sender == courierFeeRecipient, "Caller is not the courier fee recipient");
        emit CourierFeeConfirmed(orderId, escrowId, amountWei);
    }

    function onAwaitingDelivery(uint256 escrowId) external onlyMarketplace {
        Escrow storage escrow = escrowById[escrowId];
        require(escrow.id != 0, "Escrow does not exist");
        require(escrow.status == EscrowStatus.CourierFeePaid, "Escrow not in correct state");
        escrow.status = EscrowStatus.AwaitingDelivery;
    }

    function releaseFundsToSeller(uint256 escrowId, address payable sellerAddress, uint256 amount) internal {
        Escrow storage escrow = escrowById[escrowId];
        require(escrow.id != 0, "Escrow does not exist");
        require(escrow.fundsSecured, "Escrow funds not secured");
        require(!escrow.releasedToSeller, "Funds already released to seller");
        require(amount == escrow.amountWei, "Incorrect amount to release");

        escrow.releasedToSeller = true;
        escrow.status = EscrowStatus.Released;
        escrow.closedAt = block.timestamp;

        (bool success, ) = sellerAddress.call{value: amount}("");
        require(success, "Funds release to seller failed");
    }
}
