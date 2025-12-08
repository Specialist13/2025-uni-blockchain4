// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

contract MarketplaceContract {
	// Represents a product listed by a seller
	struct Product {
		uint256 id;
		address seller;
		string title;
		string description;
		uint256 priceWei;
		bool isActive;
		uint256 createdAt;
	}

	// Represents an order created when a buyer commits to purchase
	struct Order {
		uint256 id;
		uint256 productId;
		address buyer;
		address seller;
		uint256 escrowId; // reference to escrow instance/record
		uint256 courierJobId; // reference to courier assignment
		OrderStatus status;
		uint256 createdAt;
	}

	enum OrderStatus {
		PendingPayment,   // created, awaiting payment to escrow
		PaymentSecured,   // escrow funded
		PreparingShipment, // seller preparing
		InTransit,        // courier picked up
		Delivered,        // courier delivered
		BuyerConfirmed,   // buyer confirmed receipt
		Completed        // funds released and fees distributed
	}
}
