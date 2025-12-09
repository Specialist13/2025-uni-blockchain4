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

    address public marketpalceContractAddress;

    modifier onlyMarketplace() {
        require(msg.sender == marketpalceContractAddress, "Only marketplace can call");
        _;
    }

    function setMarketplaceAddress(address _marketplaceAddress) public {
        marketpalceContractAddress = _marketplaceAddress;
    }

    function fundOrder(
        uint256 orderId,
        address buyer,
        address seller,
        uint256 priceWei,
        uint256 courierFeeWei,
        uint256 platformFeeWei
    ) external payable onlyMarketplace {
        require (msg.value == priceWei + courierFeeWei + platformFeeWei, "Incorrect payment amount sent");

        uint256 escrowId = escrows.length + 1;
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

        IMarketplaceContract(marketpalceContractAddress).onEscrowFunded(orderId, escrowId);
    }
}
