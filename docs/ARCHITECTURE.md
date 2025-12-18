# Architecture Documentation

## System Overview

A C2C marketplace with three main layers:
- **Frontend (FE)**: React application with Web3 integration
- **Backend (BE)**: Node.js/Express API with event indexing
- **Smart Contracts (SOL)**: Ethereum contracts for core business logic

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Pages      │  │  Components  │  │   Services   │   │
│  │   Context    │  │   Hooks      │  │      API     │   │
│  └──────────────┘  └──────────────┘  └───────┬──────┘   │
└──────────────────────────────────────────────┼──────────┘
                                               │ HTTP/REST
┌──────────────────────────────────────────────▼──────────┐
│                  Backend (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Controllers  │→ │  Services    │→ │ Repositories │   │
│  └──────────────┘  └───────┬──────┘  └──────────────┘   │
│                            │                            │
│  ┌─────────────────────────▼──────────────────────────┐ │
│  │         EventIndexerService                        │ │
│  │         (listens to contract events)               │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ Web3/Ethers.js
┌───────────────────────────▼─────────────────────────────┐
│              Smart Contracts (Solidity)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Marketplace  │  │   Escrow     │  │   Courier    │   │
│  │  Contract    │  │   Contract   │  │   Contract   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Main Components

**Context Providers**:
- `AuthContext`: User authentication state
- `Web3Context`: Wallet connection and Web3 provider

**Services**:
- `api.js`: Axios instance for backend communication
- `productService.js`: Product API calls
- `orderService.js`: Order API calls
- `escrowService.js`: Escrow API calls

**Pages**:
- `ProductsPage`, `ProductDetailPage`: Product browsing
- `OrdersPage`, `OrderDetailPage`: Order management
- `CourierDashboardPage`: Courier operations

### Frontend Flow Example

```jsx
// User creates order
const handleBuy = async () => {
  // 1. Frontend calls backend API
  const order = await orderService.createOrder(productId);
  
  // 2. Backend validates and calls smart contract
  // 3. Frontend polls or receives event update
  // 4. UI updates with new order status
};
```

---

## Backend Architecture

### Main Classes

#### Controllers Layer
- `ProductController`: Handles product HTTP requests
- `OrderController`: Handles order HTTP requests
- `EscrowController`: Handles escrow HTTP requests
- `ShipmentController`: Handles shipment HTTP requests
- `AuthController`: Handles authentication

#### Services Layer
- `ProductService`: Product business logic
- `OrderService`: Order orchestration and fee calculation
- `EscrowService`: Escrow management
- `ShipmentService`: Shipment tracking
- `EventIndexerService`: Listens to contract events and updates database
- `BlockchainService`: Web3 provider and contract interaction wrapper

#### Contract Services
- `MarketplaceContractService`: Wrapper for MarketplaceContract calls
- `EscrowContractService`: Wrapper for EscrowContract calls
- `CourierContractService`: Wrapper for CourierContract calls

#### Repositories Layer
- `ProductRepository`: Database operations for products
- `OrderRepository`: Database operations for orders
- `EscrowRepository`: Database operations for escrows
- `ShipmentRepository`: Database operations for shipments

### Backend Flow: Order Creation

```javascript
// OrderController.createOrder()
OrderController.createOrder(req, res)
  → OrderService.createOrder(productId, buyerAddress)
    → MarketplaceContractService.createOrder(productId, buyerAddress)
      → BlockchainService.sendTransaction(contract, 'createOrder', ...)
        → Smart Contract emits OrderCreated event
    → OrderRepository.create(orderData)
      → Database updated
```

### Backend Flow: Order Funding

```javascript
// OrderController.fundOrder()
OrderController.fundOrder(req, res)
  → OrderService.fundOrder(orderId, buyerAddress)
    → OrderService.calculateTotalFee(priceWei)
    → MarketplaceContractService.buyAndFund(orderId, totalWei)
      → BlockchainService.sendTransaction(contract, 'buyAndFund', valueWei, ...)
        → MarketplaceContract.buyAndFund() calls EscrowContract.fundOrder()
          → EscrowContract emits EscrowFunded event
    → EventIndexerService processes EscrowFunded event
      → OrderRepository.update(orderId, { status: 'PaymentSecured' })
```

### Backend Flow: Event Indexing

```javascript
// EventIndexerService listens to contract events
EventIndexerService.start()
  → setupMarketplaceListeners()
    → contract.on('ProductAdded', async (event) => {
        → queueEvent({ eventName: 'ProductAdded', ... })
          → processEvent()
            → ProductRepository.create(productData)
              → Database synced with blockchain
      })
```

---

## Smart Contracts Architecture

### Main Contracts

#### MarketplaceContract
**Purpose**: Central orchestrator for marketplace operations

**Key Functions**:
- `addProduct()`: Seller lists product
- `createOrder()`: Buyer creates order
- `buyAndFund()`: Buyer funds escrow
- `markReadyToShip()`: Seller initiates shipping
- `confirmReceipt()`: Buyer confirms delivery

**Order Status Flow**:
```
PendingPayment → PaymentSecured → PreparingShipment → 
InTransit → Delivered → BuyerConfirmed → Completed
```

#### EscrowContract
**Purpose**: Secure payment escrow and fee distribution

**Key Functions**:
- `fundOrder()`: Receives payment, transfers courier fee
- `releaseFundsToSeller()`: Releases funds after delivery confirmation

**Escrow Status Flow**:
```
Initialized → Funded → CourierFeePaid → AwaitingDelivery → Released
```

#### CourierContract
**Purpose**: Shipping assignment and delivery tracking

**Key Functions**:
- `requestPickup()`: Marketplace requests courier pickup
- `confirmPickup()`: Courier confirms pickup
- `confirmDelivery()`: Courier confirms delivery

**Shipment Status Flow**:
```
Assigned → InTransit → Delivered
```

### Contract Interaction Flow: Purchase & Payment

```solidity
// 1. Buyer funds order
MarketplaceContract.buyAndFund(orderId)
  → EscrowContract.fundOrder(orderId, buyer, seller, priceWei, ...)
    → EscrowContract.transferCourierFee(escrowId, courierAddress, courierFeeWei)
      → CourierContract.receivedCourierFee(orderId, escrowId)
        → EscrowContract.onCourierFeeConfirmed(...)
    → EscrowContract calls MarketplaceContract.onEscrowFunded(orderId, escrowId)
      → MarketplaceContract updates order status to PaymentSecured
```

### Contract Interaction Flow: Shipping

```solidity
// 1. Seller marks ready to ship
MarketplaceContract.markReadyToShip(orderId, sender, recipient)
  → CourierContract.requestPickup(orderId, sender, recipient)
    → CourierContract assigns courier and creates shipment

// 2. Courier picks up
CourierContract.confirmPickup(shipmentId)
  → MarketplaceContract.onShipmentPickedUp(orderId, shipmentId)
    → MarketplaceContract updates order status to InTransit
    → EscrowContract.onAwaitingDelivery(escrowId)

// 3. Courier delivers
CourierContract.confirmDelivery(shipmentId)
  → MarketplaceContract.onShipmentDelivered(orderId)
    → MarketplaceContract updates order status to Delivered
```

### Contract Interaction Flow: Payment Release

```solidity
// 1. Buyer confirms receipt
MarketplaceContract.confirmReceipt(orderId)
  → EscrowContract.releaseFundsToSeller(escrowId)
    → EscrowContract transfers product price to seller
    → EscrowContract transfers platform fee to platform recipient
    → EscrowContract calls MarketplaceContract.onFundsReleased(orderId)
      → MarketplaceContract updates order status to Completed
```

---

## Cross-System Flows

### Product Listing Flow

```
Frontend (ProductForm)
  → Backend API (POST /api/products)
    → ProductController.createProduct()
      → ProductService.createProduct()
        → MarketplaceContractService.addProduct()
          → Smart Contract (MarketplaceContract.addProduct())
            → Event: ProductAdded
              → EventIndexerService
                → ProductRepository.create()
                  → Database updated
                    → Frontend refreshes product list
```

### Order Creation & Funding Flow

```
Frontend (OrderDetail)
  → Backend API (POST /api/orders/:id/fund)
    → OrderController.fundOrder()
      → OrderService.fundOrder()
        → OrderService.calculateTotalFee()
        → MarketplaceContractService.buyAndFund()
          → Smart Contract (MarketplaceContract.buyAndFund())
            → Smart Contract (EscrowContract.fundOrder())
              → Event: EscrowFunded
                → EventIndexerService
                  → OrderRepository.update()
                    → Database updated
                      → Frontend shows "Payment Secured"
```

### Shipping Flow

```
Frontend (OrderDetail - Seller)
  → Backend API (POST /api/orders/:id/ship)
    → OrderController.markReadyToShip()
      → OrderService.markReadyToShip()
        → MarketplaceContractService.markReadyToShip()
          → Smart Contract (MarketplaceContract.markReadyToShip())
            → Smart Contract (CourierContract.requestPickup())
              → Event: AssignedShipment
                → EventIndexerService
                  → ShipmentRepository.create()
                    → Database updated

Frontend (CourierDashboard)
  → Backend API (POST /api/shipments/:id/pickup)
    → ShipmentController.confirmPickup()
      → ShipmentService.confirmPickup()
        → CourierContractService.confirmPickup()
          → Smart Contract (CourierContract.confirmPickup())
            → Smart Contract (MarketplaceContract.onShipmentPickedUp())
              → Event: ShipmentInTransit
                → EventIndexerService
                  → OrderRepository.update()
                    → Database updated
```

### Payment Release Flow

```
Frontend (OrderDetail - Buyer)
  → Backend API (POST /api/orders/:id/confirm)
    → OrderController.confirmReceipt()
      → OrderService.confirmReceipt()
        → MarketplaceContractService.confirmReceipt()
          → Smart Contract (MarketplaceContract.confirmReceipt())
            → Smart Contract (EscrowContract.releaseFundsToSeller())
              → Event: FundsReleased, TransactionCompleted
                → EventIndexerService
                  → OrderRepository.update()
                    → Database updated
                      → Frontend shows "Transaction Complete"
```

---

## Key Design Patterns

### Backend Patterns

**Service Layer Pattern**:
- Controllers handle HTTP concerns
- Services contain business logic
- Repositories handle data access

**Event-Driven Synchronization**:
- `EventIndexerService` listens to blockchain events
- Updates database to keep off-chain state in sync
- Enables fast queries without blockchain calls

**Contract Service Abstraction**:
- `MarketplaceContractService`, `EscrowContractService`, `CourierContractService`
- Wraps Web3/Ethers.js complexity
- Provides clean interface for services

### Smart Contract Patterns

**Orchestrator Pattern**:
- `MarketplaceContract` orchestrates transactions
- Delegates to specialized contracts (`EscrowContract`, `CourierContract`)
- Maintains order state and coordinates flow

**Callback Pattern**:
- Contracts call back to orchestrator after operations
- Example: `EscrowContract` calls `MarketplaceContract.onEscrowFunded()`
- Ensures state consistency across contracts

---

## Data Synchronization

### Blockchain → Database

```
Smart Contract Event
  → EventIndexerService listener
    → Event queued
      → Event processed
        → Repository updates database
          → Frontend queries database (fast)
```

### Database → Blockchain

```
Frontend Action
  → Backend API
    → Service layer
      → Contract Service
        → Blockchain transaction
          → Event emitted
            → EventIndexerService updates database
```

---

## Summary

**Frontend**: React app with Web3 integration, communicates via REST API

**Backend**: Express API with layered architecture (Controllers → Services → Repositories), event indexing for blockchain sync

**Smart Contracts**: Three contracts (Marketplace, Escrow, Courier) with orchestrated interactions

**Key Flow**: Frontend → Backend API → Contract Services → Smart Contracts → Events → EventIndexer → Database → Frontend
