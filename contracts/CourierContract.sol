// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

interface IEscrowContract {
    function onCourierFeeConfirmed(
        uint256 orderId,
        uint256 escrowId,
        uint256 amountWei
    ) external;
}

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

    mapping(uint256 => Shipment) public shipmentById;

    address public owner;
    address public marketplaceContractAddress;
    address public escrowContractAddress;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function setMarketplaceAddress(address _marketplaceAddress) public onlyOwner {
        require(_marketplaceAddress != address(0), "Marketplace address cannot be zero");
        marketplaceContractAddress = _marketplaceAddress;
    }

    function setEscrowContractAddress(address _escrowContractAddress) public onlyOwner {
        require(_escrowContractAddress != address(0), "Escrow contract address cannot be zero");
        escrowContractAddress = _escrowContractAddress;
    }

    event CourierFeeReceived(
        uint256 orderId,
        uint256 escrowId,
        uint256 amountWei
    );

    function receivedCourierFee(uint256 orderId, uint256 escrowId) external payable {
        require(msg.value > 0, "No fee sent");
        require(msg.sender == escrowContractAddress, "Only escrow can call");
        IEscrowContract(escrowContractAddress).onCourierFeeConfirmed(
            orderId,
            escrowId,
            msg.value
        );
        emit CourierFeeReceived(orderId, escrowId, msg.value);
    }
}
