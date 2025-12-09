# Setup and Running Guide

This guide will walk you through setting up and running the C2C Marketplace smart contracts.

## Prerequisites

- Node.js and npm installed
- Truffle installed globally or locally
- Ganache CLI (or use Truffle's built-in Ganache)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Truffle globally (if not already installed):
```bash
npm install -g truffle
```

3. Install Ganache CLI (optional, if you want to use standalone Ganache):
```bash
npm install -g ganache
```

## Running Ganache CLI

You have two options for running a local blockchain:

### Option 1: Standalone Ganache CLI

Run Ganache CLI in a separate terminal:

```bash
ganache
```

Or with specific options:
```bash
ganache --port 8545 --host 127.0.0.1
```

**Common Ganache CLI options:**
- `--port 8545` - Set the RPC port (default: 8545)
- `--host 127.0.0.1` - Set the host (default: 127.0.0.1)
- `--accounts 10` - Number of accounts to generate (default: 10)
- `--mnemonic "your phrase"` - Use a specific mnemonic for deterministic addresses
- `--gasLimit 6721975` - Set gas limit per transaction

When Ganache starts, you'll see:
- A list of accounts with their private keys
- The RPC server address (usually `http://127.0.0.1:8545`)
- Network ID

**Keep this terminal running** while you deploy and interact with contracts.

### Option 2: Truffle's Built-in Ganache

Alternatively, you can use Truffle's built-in Ganache:

```bash
truffle develop
```

This starts a Ganache instance and opens a Truffle console. You can run migrations directly in this console.

## Running the App

### Step 1: Start Ganache

Choose one of the options above and start Ganache.

### Step 2: Compile Contracts

```bash
truffle compile
```

### Step 3: Deploy Contracts

Make sure Ganache is running (if using standalone), then deploy:

```bash
truffle migrate --network development
```

Or if you're using `truffle develop`, you can run migrations directly in the console:
```javascript
migrate
```

### Step 4: Add Couriers

Before the marketplace can process shipments, you need to add courier addresses:

```bash
truffle console --network development
```

Then in the console:
```javascript
const courier = await CourierContract.deployed();
const accounts = await web3.eth.getAccounts();

// Add courier addresses
await courier.addCourier(accounts[1]); // First courier
await courier.addCourier(accounts[2]); // Second courier
```

## Interacting with Contracts

### Using Truffle Console

```bash
truffle console --network development
```

Example interactions:

```javascript
// Get contract instances
const marketplace = await MarketplaceContract.deployed();
const escrow = await EscrowContract.deployed();
const courier = await CourierContract.deployed();
const accounts = await web3.eth.getAccounts();

// Add a product (as seller)
await marketplace.addProduct(
  "Test Product",
  "This is a test product description",
  web3.utils.toWei("1", "ether"), // Price: 1 ETH
  { from: accounts[1] }
);

// Create an order (as buyer)
await marketplace.createOrder(1, { from: accounts[2] });

// Fund the order
await marketplace.buyAndFund(1, {
  from: accounts[2],
  value: web3.utils.toWei("1.06", "ether") // Product + courier fee + platform fee
});
```

## Troubleshooting

### "No couriers available" Error

Make sure you've added courier addresses using `addCourier()` before attempting to ship items.

### Reset and Redeploy

To reset and redeploy everything:

```bash
truffle migrate --reset --network development
```

## Useful Commands

```bash
# Compile contracts
truffle compile

# Deploy contracts
truffle migrate --network development

# Reset and redeploy
truffle migrate --reset --network development

# Open Truffle console
truffle console --network development

# Run tests
truffle test --network development

# Start Truffle's built-in Ganache
truffle develop
```
