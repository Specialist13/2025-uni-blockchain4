// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

contract MarketplaceContract {
    struct Listing {
        uint256 listingId;
        address seller;
        string title;
        string description;
        uint256 priceWei;
        bool verified;
        uint256 createdAt;
    }

    enum PaymentStatus { None, Pending, Secured, Released, Refunded }

    struct Order {
        uint256 orderId;
        uint256 listingId;
        address buyer;
        address seller;
        uint256 amountWei;
        address escrowContract;
        PaymentStatus paymentStatus;
        uint256 createdAt;
    }

    enum ShippingStatus { None, Preparing, InTransit, Delivered }

    struct ShippingRequest {
        uint256 orderId;
        address courierContract;
        string pickupAddress;
        string deliveryAddress;
        string packageDetails;
        ShippingStatus status;
        string trackingNumber;
        uint256 requestedAt;
        uint256 pickedUpAt;
        uint256 deliveredAt;
    }

    struct DeliveryConfirmation {
        uint256 orderId;
        address buyer;
        bool confirmed;
        uint256 confirmedAt;
    }

    struct FeeBreakdown {
        uint256 orderId;
        uint256 platformFeeWei;
        uint256 courierFeeWei;
        uint256 sellerFeeWei;
        address platformAddress;
        address courierAdress;
        address sellerAdress;
    }

    enum DisputeStatus { None, Open, UnderReview, Resolved }

    struct Dispute {
        uint256 disputeId;
        uint256 orderId;
        address buyer;
        address seller;
        DisputeStatus status;
        string buyerClaim;
        string sellerResponse;
        string resolution;
        uint256 openedAt;
        uint256 resolvedAt;
    }
}
