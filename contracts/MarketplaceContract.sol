// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

interface IEscrowContract {
    function fundOrder(
        uint256 orderId,
        address buyer,
        address seller,
        uint256 priceWei,
        uint256 courierFeeWei,
        uint256 platformFeeWei
    ) external payable;
}

contract MarketplaceContract {
    Product[] public products;
    Order[] public orders;

    address public owner;

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

    mapping(uint256 => Product) public productById;
    mapping(uint256 => Order) public orderById;

    uint256 public nextProductId = 1;
    uint256 public nextOrderId = 1;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    event ProductAdded(
        uint256 indexed productId, 
        address indexed seller, 
        string title, 
        uint256 priceWei
    );

    function addProduct(string memory title, string memory description, uint256 priceWei) public {
        uint256 productId = nextProductId++;
        Product memory newProduct = Product({
            id: productId,
            seller: msg.sender,
            title: title,
            description: description,
            priceWei: priceWei,
            isActive: true,
            createdAt: block.timestamp
        });
        products.push(newProduct);
        productById[productId] = newProduct;
        emit ProductAdded(productId, msg.sender, title, priceWei);
    }

    function getProduct(uint256 productId) public view returns (Product memory) {
        return productById[productId];
    }

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed productId,
        address indexed buyer,
        address seller
    );

    function createOrder(uint256 productId) public {
        Product memory product = productById[productId];
        require(product.id != 0, "Product does not exist");
        require(product.isActive, "Product is not active");

        uint256 orderId = nextOrderId++;
        Order memory newOrder = Order({
            id: orderId,
            productId: productId,
            buyer: msg.sender,
            seller: product.seller,
            escrowId: 0, // to be set when escrow is created
            courierJobId: 0, // to be set when courier job is created
            status: OrderStatus.PendingPayment,
            createdAt: block.timestamp
        });
        orders.push(newOrder);
        orderById[orderId] = newOrder;
        emit OrderCreated(orderId, productId, msg.sender, product.seller);
    }

    function getOrder(uint256 orderId) public view returns (Order memory) {
        return orderById[orderId];
    }

    address public escrowContractAddress;

    modifier onlyEscrowContract() {
        require(msg.sender == escrowContractAddress, "Caller is not the escrow contract");
        _;
    }

    function setEscrowContractAddress(address _escrowContractAddress) public onlyOwner {
        require(_escrowContractAddress != address(0), "Escrow contract address cannot be zero");
        escrowContractAddress = _escrowContractAddress;
    }

    function buyAndFund(uint256 orderId) external payable {
        require(escrowContractAddress != address(0), "Escrow contract address not set");
        Order storage order = orderById[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.status == OrderStatus.PendingPayment, "Order is not pending payment");
        require(msg.sender == order.buyer, "Only the buyer can fund the order");

        uint256 productPrice = productById[order.productId].priceWei;
        uint256 courierFee = 0.01 ether;
        uint256 platformFee = (productPrice * 5) / 100;
        uint256 totalAmount = productPrice + courierFee + platformFee;
        require(msg.value == totalAmount, "Incorrect payment amount");

        IEscrowContract(escrowContractAddress).fundOrder{value: msg.value}(
            order.id,
            order.buyer,
            order.seller,
            productPrice,
            courierFee,
            platformFee
        );
    }

    event EscrowFunded(
        uint256 indexed orderId,
        uint256 indexed escrowId
    );

    event OrderReceived(
        uint256 indexed orderId
    );

    function onEscrowFunded(uint256 orderId, uint256 escrowId) external onlyEscrowContract {
        Order storage order = orderById[orderId];
        require(order.id != 0, "Order does not exist");
        require(order.status == OrderStatus.PendingPayment, "Order is not pending payment");

        order.escrowId = escrowId;
        order.status = OrderStatus.PaymentSecured;
        emit EscrowFunded(orderId, escrowId);
        emit OrderReceived(orderId);
    }
}
