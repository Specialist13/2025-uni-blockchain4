// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

interface IEscrowContract {
    function onCourierFeeConfirmed(
        uint256 orderId,
        uint256 escrowId,
        uint256 amountWei
    ) external;
}

interface IMarketplaceContract {
    function onShipmentPickedUp(
        uint256 orderId,
        uint256 shipmentId
    ) external;

    function onShipmentDelivered(
        uint256 orderId
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
		uint256 trackingNumber;
		ShipmentStatus status;
		uint256 createdAt;
		uint256 pickedUpAt;
		uint256 deliveredAt;
	}

	enum ShipmentStatus {
		Assigned,      // courier assigned
		InTransit,     // moving towards destination
		Delivered      // delivered to buyer
	}

    Shipment[] public shipments;
    address[] public couriers;
    uint256 public lastCourierIndex;

    mapping(uint256 => Shipment) public shipmentById;

    address public owner;
    address public marketplaceContractAddress;
    address public escrowContractAddress;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setMarketplaceAddress(address _marketplaceAddress) public onlyOwner {
        require(_marketplaceAddress != address(0), "Marketplace address cannot be zero");
        marketplaceContractAddress = _marketplaceAddress;
    }

    function setEscrowContractAddress(address _escrowContractAddress) public onlyOwner {
        require(_escrowContractAddress != address(0), "Escrow contract address cannot be zero");
        escrowContractAddress = _escrowContractAddress;
    }

    function addCourier(address courierAddress) public onlyOwner {
        require(courierAddress != address(0), "Invalid courier address");
        couriers.push(courierAddress);
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

    event AssignedShipment(
        Shipment shipment,
        address indexed courier
    );

    function requestPickup(uint256 orderId, AddressInfo memory pickup, AddressInfo memory dropoff) external {
        require(marketplaceContractAddress != address(0), "Marketplace address not set");
        require(couriers.length > 0, "No couriers available");
        uint256 shipmentId = shipments.length + 1;
        Shipment memory newShipment = Shipment({
            id: shipmentId,
            orderId: orderId,
            courier: couriers[lastCourierIndex++ % couriers.length],
            pickup: pickup,
            dropoff: dropoff,
            trackingNumber: shipmentId,
            status: ShipmentStatus.Assigned,
            createdAt: block.timestamp,
            pickedUpAt: 0,
            deliveredAt: 0
        });
        shipments.push(newShipment);
        shipmentById[shipmentId] = newShipment;
        
        emit AssignedShipment(newShipment, newShipment.courier);
    }

    function confirmPickup(uint256 shipmentId) public {
        Shipment storage shipment = shipmentById[shipmentId];
        require(shipment.courier == msg.sender, "Only assigned courier can pick up");
        require(shipment.status == ShipmentStatus.Assigned, "Shipment not assigned");
        require(shipment.id != 0, "Shipment does not exist");

        shipment.status = ShipmentStatus.InTransit;
        shipment.pickedUpAt = block.timestamp;

        IMarketplaceContract(marketplaceContractAddress).onShipmentPickedUp(shipment.orderId, shipmentId);
    }

    function confirmDelivery(uint256 shipmentId) public {
        Shipment storage shipment=shipmentById[shipmentId];
        require(shipment.courier == msg.sender, "Only assigned courier can confirm delivery");
        require(shipment.status == ShipmentStatus.InTransit, "Shipment not in transit");
        require(shipment.id != 0, "Shipment does not exist");

        shipment.status = ShipmentStatus.Delivered;
        shipment.deliveredAt = block.timestamp;

        IMarketplaceContract(marketplaceContractAddress).onShipmentDelivered(shipment.orderId);
    }
}
