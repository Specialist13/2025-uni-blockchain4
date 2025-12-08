// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

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
}
