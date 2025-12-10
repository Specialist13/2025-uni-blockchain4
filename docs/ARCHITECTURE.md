# High-Level Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [Communication Patterns](#communication-patterns)
5. [Data Flow](#data-flow)
6. [Technology Stack](#technology-stack)

---

## System Overview

### Purpose

This C2C (Consumer-to-Consumer) marketplace is a decentralized application (dApp) built on Ethereum that enables secure peer-to-peer transactions with integrated escrow protection and courier services. The system orchestrates the complete transaction lifecycle from product listing to final payment release.

### Key Actors

- **Buyer**: Purchases products, deposits payment to escrow, confirms receipt
- **Seller**: Lists products, prepares shipments, receives payment after delivery
- **Courier**: Picks up and delivers packages, updates shipment status
- **Platform**: Receives platform fees (5% of product price) for marketplace operation
- **Escrow Service**: Holds funds securely until delivery confirmation

### High-Level Transaction Flow

```
1. Seller lists product → 2. Buyer creates order → 3. Buyer funds escrow →
4. Seller prepares shipment → 5. Courier picks up → 6. Courier delivers →
7. Buyer confirms receipt → 8. Escrow releases funds → 9. Transaction complete
```

---

## Architecture

### System Architecture

```
┌─────────────┐
│  Frontend   │
│  (React/    │
│  Vue/Next)  │
└──────┬──────┘
       │
       │ HTTP/REST API
       │
┌──────▼───────────────────────────────────────┐
│         Backend Server                       │
│  ┌──────────────────────────────────────┐    │
│  │  API Layer                           │    │
│  │  - Product endpoints                 │    │
│  │  - Order endpoints                   │    │
│  │  - User authentication               │    │
│  │  - Image upload                      │    │
│  └──────┬───────────────────────────────┘    │
│         │                                    │
│  ┌──────▼───────────────────────────────┐    │
│  │  Event Indexer                       │    │
│  │  - Listens to contract events        │    │
│  │  - Updates database                  │    │
│  └──────┬───────────────────────────────┘    │
│         │                                    │
│  ┌──────▼────────────────────────────────┐   │
│  │  Database                             │   │
│  │  - Products (with images)             │   │
│  │  - Orders                             │   │
│  │  - Users                              │   │
│  └───────────────────────────────────────┘   │
└──────┬───────────────────────────────────────┘
       │
       │ Web3.js / Ethers.js
       │ (Contract Calls)
       │
┌──────▼──────────────────────────────────────┐
│         Ethereum Network                    │
│  ┌──────────────────────────────────────┐   │
│  │   MarketplaceContract                │   │
│  │   - Product listings                 │   │
│  │   - Order management                 │   │
│  │   - Transaction orchestration        │   │
│  └──────┬───────────────┬───────────────┘   │
│         │               │                   │
│  ┌──────▼──────┐  ┌─────▼──────────┐        │
│  │ Escrow      │  │ Courier        │        │
│  │ Contract    │  │ Contract       │        │
│  │ - Payment   │  │ - Shipping     │        │
│  │   escrow    │  │ - Tracking     │        │
│  │ - Fee dist. │  │ - Delivery     │        │
│  └─────────────┘  └────────────────┘        │
└─────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend**:
- User interface and interactions
- Wallet connection (MetaMask, WalletConnect)
- API calls to backend
- Direct contract calls for transactions (via backend or direct)

**Backend Server**:
- REST API endpoints for frontend
- User authentication and authorization
- Product image storage and management
- Event indexing from blockchain contracts
- Database management (products, orders, users)
- Search and filtering functionality
- Caching for performance

**Smart Contracts**:
- Core business logic and transaction orchestration
- Payment escrow and fee distribution
- Order and shipment status management
- Immutable transaction records

---

## Smart Contract Architecture

### Core Contracts

The system consists of three interconnected smart contracts:

#### 1. MarketplaceContract

**Purpose**: Central orchestrator for marketplace operations

**Key Responsibilities**:
- Product listing management
- Order lifecycle management (7 statuses)
- Transaction orchestration between contracts
- Status tracking

**Order Status Flow**:
```
PendingPayment → PaymentSecured → PreparingShipment → InTransit → 
Delivered → BuyerConfirmed → Completed
```

**Key Functions**:
- `addProduct()` - Seller lists a new product
- `createOrder()` - Buyer creates an order
- `buyAndFund()` - Buyer funds escrow via marketplace
- `markReadyToShip()` - Seller initiates shipping
- `confirmReceipt()` - Buyer confirms delivery

**Events Emitted**:
- `ProductAdded`, `OrderCreated`, `EscrowFunded`, `ShipmentPrepared`
- `ShipmentInTransit`, `requestConfirmation`, `FundsReleased`, `TransactionCompleted`

#### 2. EscrowContract

**Purpose**: Secure payment escrow and fee distribution

**Key Responsibilities**:
- Hold buyer funds until delivery confirmation
- Deduct and transfer courier fee immediately (0.01 ETH fixed)
- Calculate and hold platform fee (5% of product price)
- Release funds to seller upon buyer confirmation

**Escrow Status Flow**:
```
Initialized → Funded → CourierFeePaid → AwaitingDelivery → Released
```

**Fee Calculation**:
- Product Price: Set by seller
- Courier Fee: Fixed at 0.01 ETH
- Platform Fee: 5% of product price
- Total Payment: `productPrice + courierFee + platformFee`

#### 3. CourierContract

**Purpose**: Shipping assignment and delivery tracking

**Key Responsibilities**:
- Assign couriers to shipments
- Track shipment status (Assigned → InTransit → Delivered)
- Confirm pickup and delivery
- Store shipping addresses

**Shipment Status Flow**:
```
Assigned → InTransit → Delivered
```

**Key Functions**:
- `requestPickup()` - Called by marketplace when seller is ready
- `confirmPickup()` - Called by courier when package picked up
- `confirmDelivery()` - Called by courier when package delivered

### Contract Inter-Communication

Contracts communicate via **direct function calls** using interfaces:

- **MarketplaceContract ↔ EscrowContract**: Payment funding and release
- **MarketplaceContract ↔ CourierContract**: Shipping requests and status updates
- **EscrowContract ↔ CourierContract**: Courier fee transfer

All contracts are linked after deployment via setter functions (handled by migration script).

---

## Communication Patterns

### Frontend ↔ Backend Communication

**Read Operations** (via Backend API):
```
Frontend → Backend API → Database
```
- Get products list (with images)
- Get order history
- Search and filter products
- User authentication

**Write Operations** (via Backend API → Contracts):
```
Frontend → Backend API → Smart Contracts → Events → Backend Indexer → Database
```
- Create product listing (backend stores image, calls contract)
- Create order (backend validates, calls contract)
- Fund order (backend calculates fees, calls contract)

### Backend ↔ Smart Contracts Communication

**Event Indexing**:
```
Smart Contracts → Events → Backend Event Listener → Database Update
```
- Backend continuously listens to contract events
- Updates database when events occur
- Enables fast queries without blockchain calls

**Contract Calls**:
```
Backend → Web3/Ethers.js → Smart Contracts
```
- Backend makes contract calls on behalf of frontend
- Handles transaction signing (via service account or user delegation)
- Manages gas estimation and error handling

### Smart Contract ↔ Smart Contract Communication

**Direct Interface Calls**:
```
Contract A → Interface Call → Contract B → Callback → Contract A
```

**Example: Payment Flow**:
1. Marketplace calls `escrow.fundOrder(...)` with payment
2. Escrow creates escrow record and transfers courier fee
3. Escrow calls `marketplace.onEscrowFunded(...)` callback
4. Marketplace updates order status and emits event

### Complete Communication Flow

```
┌──────────┐
│  Buyer   │
└────┬─────┘
     │ 1. Click "Buy Now"
     ▼
┌─────────────────┐     2. POST /api/orders
│   Frontend      │──────────────────────────┐
└─────────────────┘                          │
                                             ▼
                                    ┌─────────────────┐
                                    │  Backend API    │
                                    │  - Validates    │
                                    │  - Calls        │
                                    │    contract     │
                                    └────────┬────────┘
                                             │ 3. marketplace.createOrder(...)
                                             ▼
                                    ┌──────────────────────┐
                                    │ MarketplaceContract  │
                                    └──────┬───────────────┘
                                           │ 4. escrow.fundOrder(...)
                                           ▼
                                    ┌──────────────────────┐
                                    │  EscrowContract      │
                                    │  - Creates escrow    │
                                    │  - Transfers fees    │
                                    └──────┬───────────────┘
                                           │ 5. Event: EscrowFunded
                                           ▼
                                    ┌──────────────────────┐
                                    │  Backend Indexer     │
                                    │  - Listens to event  │
                                    │  - Updates database  │
                                    └──────┬───────────────┘
                                           │ 6. Database updated
                                           ▼
                                    ┌──────────────────────┐
                                    │   Frontend Polling   │
                                    │   or WebSocket       │
                                    │   - Updates UI       │
                                    └──────────────────────┘
```

---

## Data Flow

### Product Listing Flow

```
1. Seller fills form (title, description, price, image)
   ↓
2. Frontend uploads image to Backend API
   ↓
3. Backend stores image, returns image URL
   ↓
4. Frontend calls Backend API: POST /api/products
   ↓
5. Backend calls marketplace.addProduct(...)
   ↓
6. Contract emits ProductAdded event
   ↓
7. Backend indexer updates database
   ↓
8. Frontend refreshes product list
```

### Purchase Flow

```
1. Buyer clicks "Buy Now"
   ↓
2. Frontend calls Backend API: POST /api/orders
   ↓
3. Backend validates, calls marketplace.createOrder(productId)
   ↓
4. Contract emits OrderCreated event
   ↓
5. Backend calculates total (price + courierFee + platformFee)
   ↓
6. Frontend calls Backend API: POST /api/orders/:id/fund
   ↓
7. Backend calls marketplace.buyAndFund(orderId, {value: total})
   ↓
8. Marketplace calls escrow.fundOrder(...)
   ↓
9. Escrow creates escrow, transfers courier fee
   ↓
10. Escrow calls marketplace.onEscrowFunded(...)
   ↓
11. Marketplace emits EscrowFunded event
   ↓
12. Backend indexer updates order status in database
   ↓
13. Frontend shows "Payment Secured"
```

### Shipping Flow

```
1. Seller marks "Ready to Ship" with addresses
   ↓
2. Frontend calls Backend API: POST /api/orders/:id/ship
   ↓
3. Backend calls marketplace.markReadyToShip(orderId, sender, recipient)
   ↓
4. Marketplace calls courier.requestPickup(...)
   ↓
5. Courier assigns courier, creates shipment
   ↓
6. Courier calls marketplace.onShipmentPickedUp(...)
   ↓
7. Marketplace emits ShipmentInTransit event
   ↓
8. Backend indexer updates order status
   ↓
9. Frontend shows "In Transit" status
   ↓
10. Courier calls courier.confirmDelivery(shipmentId)
   ↓
11. Courier calls marketplace.onShipmentDelivered(...)
   ↓
12. Marketplace emits requestConfirmation event
   ↓
13. Backend indexer updates order status
   ↓
14. Frontend prompts buyer: "Confirm Receipt"
```

### Payment Release Flow

```
1. Buyer clicks "Confirm Receipt"
   ↓
2. Frontend calls Backend API: POST /api/orders/:id/confirm
   ↓
3. Backend calls marketplace.confirmReceipt(orderId)
   ↓
4. Marketplace calls escrow.releaseFundsToSeller(escrowId)
   ↓
5. Escrow transfers product price to seller
   ↓
6. Escrow transfers platform fee to platform recipient
   ↓
7. Escrow calls marketplace.onFundsReleased(...)
   ↓
8. Marketplace emits TransactionCompleted event
   ↓
9. Backend indexer updates order status to "Completed"
   ↓
10. Frontend shows "Transaction Complete"
```

---

## Technology Stack

### Frontend
- **Framework**: React, Vue.js, or Next.js
- **Web3 Library**: Ethers.js or Web3.js (for direct contract calls if needed)
- **Wallet Integration**: MetaMask, WalletConnect
- **HTTP Client**: Axios or Fetch API
- **Deployment**: Local development server (e.g., `npm start`, `npm run dev`)

### Backend
- **Runtime**: Node.js, Python (FastAPI), or Go
- **Framework**: Express.js, FastAPI, or Gin
- **Database**: PostgreSQL or MongoDB (local installation)
- **File Storage**: Local file system or local IPFS node
- **Event Indexing**: Web3.js/Ethers.js event listeners
- **Authentication**: JWT tokens or OAuth
- **Deployment**: Local server (e.g., `node server.js`, `npm run dev`)

### Blockchain
- **Network**: Local Ganache instance (http://127.0.0.1:8545)
- **Development Tools**: Truffle or Hardhat
- **Smart Contracts**: Solidity ^0.8.21

### Recommended Backend API Endpoints

```
GET    /api/products              - List all products
GET    /api/products/:id         - Get product details
POST   /api/products              - Create product (with image)
GET    /api/orders                - Get user orders
POST   /api/orders                - Create order
POST   /api/orders/:id/fund       - Fund order
POST   /api/orders/:id/ship       - Mark ready to ship
POST   /api/orders/:id/confirm    - Confirm receipt
GET    /api/orders/:id            - Get order details
POST   /api/auth/login            - User login
POST   /api/auth/register         - User registration
```

---

## Summary

This architecture uses a **three-tier system**:

1. **Frontend**: User interface and wallet integration
2. **Backend**: API layer, event indexing, database, and file storage
3. **Smart Contracts**: Core business logic and transaction execution

The backend serves as a bridge between the frontend and blockchain, providing:
- Fast data access (database queries vs blockchain calls)
- Product image storage
- User authentication
- Event indexing for real-time updates
- Search and filtering capabilities

All critical transaction logic remains on-chain in smart contracts, ensuring security and decentralization, while the backend enhances user experience and provides additional features.
