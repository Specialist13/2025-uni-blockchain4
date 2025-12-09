// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

contract CourierContract {
	// Shipping addresses are kept simple for demo purposes
	struct AddressInfo {
		string name;
		string line1;
		string line2;
		string city;
		string state;
		string postalCode;
		string country;
	}

	// Represents a courier job assignment and tracking lifecycle
	struct Shipment {
		uint256 id;
		uint256 orderId; // reference to marketplace order
		address courier;
		AddressInfo pickup;
		AddressInfo dropoff;
		string trackingNumber;
		ShipmentStatus status;
		uint256 createdAt;
		uint256 pickedUpAt;
		uint256 deliveredAt;
	}

	enum ShipmentStatus {
		Requested,     // marketplace requested pickup
		Assigned,      // courier assigned
		PickedUp,      // in courier possession
		InTransit,     // moving towards destination
		Delivered      // delivered to buyer
	}

    Shipment[] public shipments;

}
