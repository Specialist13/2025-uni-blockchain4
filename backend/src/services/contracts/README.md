# Contract Services

This directory contains service wrappers for interacting with the smart contracts on the blockchain.

## Setup

1. Ensure your `.env` file contains the following variables:
   ```
   BLOCKCHAIN_RPC_URL=http://127.0.0.1:9545
   BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
   MARKETPLACE_CONTRACT_ADDRESS=0x...
   ESCROW_CONTRACT_ADDRESS=0x...
   COURIER_CONTRACT_ADDRESS=0x...
   ```

2. After compiling contracts with Truffle, copy the ABIs:
   ```bash
   # Copy compiled ABIs to backend/src/contracts/
   cp build/contracts/MarketplaceContract.json backend/src/contracts/MarketplaceContract.json
   cp build/contracts/EscrowContract.json backend/src/contracts/EscrowContract.json
   cp build/contracts/CourierContract.json backend/src/contracts/CourierContract.json
   ```
   
   Then extract the `abi` field from each JSON file and update the corresponding files in `backend/src/contracts/`.

## Usage

### MarketplaceContractService

```javascript
import { MarketplaceContractService } from './services/contracts/index.js';

// Add a product
await MarketplaceContractService.addProduct(
  'Product Title',
  'Product Description',
  ethers.parseEther('1.0') // price in wei
);

// Create an order
await MarketplaceContractService.createOrder(productId, buyerAddress);

// Fund an order
await MarketplaceContractService.buyAndFund(orderId, totalAmountWei);

// Mark ready to ship
await MarketplaceContractService.markReadyToShip(
  orderId,
  senderAddress,
  recipientAddress
);

// Confirm receipt
await MarketplaceContractService.confirmReceipt(orderId);

// Read operations (no gas required)
const product = await MarketplaceContractService.getProduct(productId);
const order = await MarketplaceContractService.getOrder(orderId);
```

### EscrowContractService

```javascript
import { EscrowContractService } from './services/contracts/index.js';

// Fund escrow (called by marketplace contract)
await EscrowContractService.fundOrder(
  orderId,
  buyerAddress,
  sellerAddress,
  priceWei,
  courierFeeWei,
  platformFeeWei
);

// Get escrow details
const escrow = await EscrowContractService.getEscrow(escrowId);

// Release funds to seller
await EscrowContractService.releaseFundsToSeller(escrowId);
```

### CourierContractService

```javascript
import { CourierContractService } from './services/contracts/index.js';

// Request pickup
await CourierContractService.requestPickup(
  orderId,
  pickupAddress,
  dropoffAddress
);

// Confirm pickup
await CourierContractService.confirmPickup(shipmentId);

// Confirm delivery
await CourierContractService.confirmDelivery(shipmentId);

// Get shipment details
const shipment = await CourierContractService.getShipment(shipmentId);
```

## Error Handling

All contract calls use the `BlockchainService.sendTransaction()` method which includes:
- Automatic gas estimation with 10% buffer
- Error parsing and meaningful error messages
- Transaction receipt waiting

Errors will be thrown with descriptive messages that can be caught and handled:

```javascript
try {
  await MarketplaceContractService.addProduct(title, description, price);
} catch (error) {
  console.error('Failed to add product:', error.message);
  // Handle error
}
```

## Events

You can listen to contract events:

```javascript
// Get all ProductAdded events
const events = await MarketplaceContractService.getEvents(
  'ProductAdded',
  0, // fromBlock
  'latest' // toBlock
);
```

## Notes

- The services automatically initialize on first use
- Read-only operations don't require a signer
- Write operations require a private key configured in `.env`
- Gas estimation includes a 10% buffer for safety
- Address formatting is handled automatically (checksummed)
