# End-to-End Test Plan

This document outlines comprehensive test scenarios for the C2C Marketplace API, designed for Postman testing.

## Prerequisites

1. **Backend Server Running**
   - Backend should be running on `http://localhost:3001`
   - Database should be initialized and connected
   - Blockchain service should be configured (Ganache running)

2. **Blockchain Setup**
   - Ganache running on `http://127.0.0.1:9545` (or configured RPC URL)
   - Smart contracts deployed
   - Contract addresses configured in `.env`
   - At least 3 test accounts with ETH balance:
     - **Seller Account** (for listing products)
     - **Buyer Account** (for purchasing)
     - **Courier Account** (for shipping - must be added to CourierContract)

3. **Postman Setup**
   - Create a new collection: "C2C Marketplace API Tests"
   - Set up environment variables (see Environment Variables section)

## Environment Variables (Postman)

Create a Postman environment with these variables:

```
base_url: http://localhost:3001
seller_token: (will be set after seller login)
buyer_token: (will be set after buyer login)
courier_token: (will be set after courier login)
seller_wallet: (seller's wallet address)
buyer_wallet: (buyer's wallet address)
courier_wallet: (courier's wallet address)
product_id: (will be set after product creation)
order_id: (will be set after order creation)
escrow_id: (will be set after order funding)
shipment_id: (will be set after shipment creation)
```

## Role System

The marketplace uses a simple role-based system:

- **Regular Users** (`role = null`): Default role for all users. Can both create products (sell) and create orders (buy). This is the standard marketplace user.
- **Couriers** (`role = 'courier'`): Special role for users who manage shipments. Have access to courier-specific endpoints for viewing available shipments, managing assigned deliveries, and accessing courier dashboard.

**Note:** Regular users can perform all buyer and seller actions. Only couriers have access to courier-specific shipment management endpoints.

## Test Scenarios

### Phase 1: Authentication & User Setup

#### 1.1 Register Regular User (Seller/Buyer)
**Request:**
```
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "UserPass123!",
  "username": "regular_user"
}
```

**Expected Response:** 201 Created
- Contains `user` object and `token`
- `user.role` should be `null` (regular user who can both buy and sell)
- Save `token` to `seller_token` variable (this user will act as seller)
- Note `user.walletAddress` (or set it manually if needed)

**Validation:**
- User ID is returned
- Token is present
- Email matches request
- Role is null (default)

---

#### 1.2 Register Another Regular User (Buyer)
**Request:**
```
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "email": "buyer@example.com",
  "password": "BuyerPass123!",
  "username": "buyer_user"
}
```

**Expected Response:** 201 Created
- `user.role` should be `null` (regular user who can both buy and sell)
- Save `token` to `buyer_token` variable (this user will act as buyer)
- Note `user.walletAddress`

---

#### 1.3 Register Courier
**Request:**
```
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "email": "courier@example.com",
  "password": "CourierPass123!",
  "username": "courier_user",
  "role": "courier"
}
```

**Expected Response:** 201 Created
- `user.role` should be `"courier"`
- Save `token` to `courier_token` variable
- Note `user.walletAddress` (must be added to CourierContract)

**Validation:**
- Role is set to "courier"
- User can access courier-specific endpoints

---

#### 1.4 Login Regular User (Seller)
**Request:**
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "UserPass123!"
}
```

**Expected Response:** 200 OK
- Token returned (update `seller_token` if needed)

---

#### 1.5 Login Regular User (Buyer)
**Request:**
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "buyer@example.com",
  "password": "BuyerPass123!"
}
```

**Expected Response:** 200 OK
- Token returned (update `buyer_token` if needed)

---

#### 1.6 Login Courier
**Request:**
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "courier@example.com",
  "password": "CourierPass123!"
}
```

**Expected Response:** 200 OK
- Token returned (update `courier_token` if needed)

---

### Phase 2: Product Listing

#### 2.1 Create Product (Seller)
**Request:**
```
POST {{base_url}}/api/products
Authorization: Bearer {{seller_token}}
Content-Type: application/json

{
  "title": "Test Product - Vintage Camera",
  "description": "A beautiful vintage camera in excellent condition",
  "price": 1.0,
  "imageUrl": "https://example.com/camera.jpg",
  "imageUrls": [
    "https://example.com/camera1.jpg",
    "https://example.com/camera2.jpg"
  ]
}
```

**Expected Response:** 201 Created
- Product object with `id`, `title`, `description`, `price` (in Ether)
- `blockchainProductId` should be present
- Save `id` to `product_id` variable

**Validation:**
- Product ID is returned
- Blockchain transaction hash present
- Status is "active"

---

#### 2.2 List All Products
**Request:**
```
GET {{base_url}}/api/products
```

**Expected Response:** 200 OK
- Array of products
- Should include the product created in 2.1

**Query Parameters (Optional):**
- `?page=1&limit=10` - Pagination
- `?seller={{seller_wallet}}` - Filter by seller
- `?minPrice=0.5&maxPrice=2.0` - Price range in Ether
- `?search=camera` - Search term
- `?isActive=true` - Filter active products

---

#### 2.3 Get Product by ID
**Request:**
```
GET {{base_url}}/api/products/{{product_id}}
```

**Expected Response:** 200 OK
- Product details matching the created product

---

#### 2.4 Update Product (Seller)
**Request:**
```
PUT {{base_url}}/api/products/{{product_id}}
Authorization: Bearer {{seller_token}}
Content-Type: application/json

{
  "title": "Updated Product - Vintage Camera",
  "description": "Updated description",
  "price": 1.2
}
```

**Expected Response:** 200 OK
- Updated product details

---

### Phase 3: Order Creation & Payment

#### 3.1 Create Order (Buyer)
**Request:**
```
POST {{base_url}}/api/orders
Authorization: Bearer {{buyer_token}}
Content-Type: application/json

{
  "productId": {{product_id}}
}
```

**Expected Response:** 201 Created
- Order object with `id`, `productId`, `buyerAddress`, `sellerAddress`
- `status` should be "pending" or "created"
- `blockchainOrderId` should be present
- Save `id` to `order_id` variable

**Validation:**
- Order ID is returned
- Buyer address matches logged-in user
- Product ID matches request

---

#### 3.2 Get Order Details
**Request:**
```
GET {{base_url}}/api/orders/{{order_id}}
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 200 OK
- Complete order details including product info

---

#### 3.3 Fund Order (Buyer)
**Request:**
```
POST {{base_url}}/api/orders/{{order_id}}/fund
Authorization: Bearer {{buyer_token}}
```

**Note:** The endpoint automatically calculates fees based on the product price:
- Product price: 1.0 ETH
- Courier fee: ~0.05 ETH (5% of product price or fixed fee)
- Platform fee: ~0.03 ETH (3% of product price)
- Total: ~1.08 ETH

**Expected Response:** 200 OK
- Transaction hash
- Fees breakdown with `price`, `courierFee`, `platformFee`, and `total` (all in Ether)
- Escrow ID (save to `escrow_id` variable)
- Order status should update to "funded" or "awaiting_shipment"

**Validation:**
- Transaction hash is present
- Fees are calculated and returned in Ether
- Escrow ID is returned
- Order status updated

---

#### 3.4 Get Escrow Details
**Request:**
```
GET {{base_url}}/api/escrows/{{escrow_id}}
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 200 OK
- Escrow details including:
  - `buyerAddress`
  - `sellerAddress`
  - `amount` (in Ether)
  - `courierFee` (in Ether)
  - `platformFee` (in Ether)
  - `fundsSecured` (should be true)

---

#### 3.5 List Orders (Buyer)
**Request:**
```
GET {{base_url}}/api/orders
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 200 OK
- List of orders for the authenticated user

**Query Parameters:**
- `?status=funded` - Filter by status
- `?page=1&limit=10` - Pagination

---

### Phase 4: Shipping

**Important:** Before marking an order as ready to ship, you must register at least one courier address in the CourierContract. The contract requires at least one courier to be available before it can process pickup requests.

#### 4.0 Add Courier to Contract (Admin/Setup)
**Request:**
```
POST {{base_url}}/api/admin/couriers
Content-Type: application/json

{
  "courierAddress": "{{courier_wallet}}"
}
```

**Expected Response:** 200 OK
- Transaction hash
- Courier address confirmation

**Validation:**
- Transaction hash is returned
- Courier is successfully registered

**Note:** This endpoint uses the contract owner account (configured via `BLOCKCHAIN_PRIVATE_KEY`). You only need to do this once per courier address. If you're using the courier account from your test setup, use that wallet address here.

---

#### 4.1 Mark Order Ready to Ship (Seller)
**Request:**
```
POST {{base_url}}/api/orders/{{order_id}}/ship
Authorization: Bearer {{seller_token}}
Content-Type: application/json

{
  "senderAddress": {
    "name": "John Seller",
    "line1": "123 Seller Street",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "recipientAddress": {
    "name": "Jane Buyer",
    "line1": "456 Buyer Avenue",
    "line2": "",
    "city": "Los Angeles",
    "state": "CA",
    "postalCode": "90001",
    "country": "USA"
  }
}
```

**Expected Response:** 200 OK
- Transaction hash
- Shipment ID (save to `shipment_id` variable)
- Order status should update to "shipped" or "in_transit"

**Validation:**
- Shipment ID is returned
- Transaction hash present
- Order status updated

---

#### 4.2 Get Shipment by Order ID
**Request:**
```
GET {{base_url}}/api/shipments/order/{{order_id}}
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 200 OK
- Shipment details including:
  - `orderId`
  - `status` (should be "preparing" or "pending_pickup")
  - `pickup` address
  - `dropoff` address

---

#### 4.3 Get Shipment by ID
**Request:**
```
GET {{base_url}}/api/shipments/{{shipment_id}}
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 200 OK
- Complete shipment details

---

#### 4.4 Confirm Pickup (Courier)
**Request:**
```
POST {{base_url}}/api/shipments/{{shipment_id}}/pickup
Authorization: Bearer {{courier_token}}
```

**Expected Response:** 200 OK
- Transaction hash
- Shipment status should update to "in_transit"

**Note:** 
- For testing, you can enable admin bypass by setting `ENABLE_COURIER_ADMIN_BYPASS=true` in your `.env` file. This allows the backend admin account (configured via `BLOCKCHAIN_PRIVATE_KEY`) to sign courier transactions. The contract owner can also call these functions directly.
- The contract has been modified to allow the owner to bypass courier checks for testing purposes.

---

#### 4.5 Confirm Delivery (Courier)
**Request:**
```
POST {{base_url}}/api/shipments/{{shipment_id}}/delivery
Authorization: Bearer {{courier_token}}
```

**Expected Response:** 200 OK
- Transaction hash
- Shipment status should update to "delivered"

**Note:** Same as 4.4 - admin bypass can be enabled for testing via `ENABLE_COURIER_ADMIN_BYPASS=true`.
- Order status should update to "awaiting_confirmation"

---

### Phase 4.5: Courier-Specific Endpoints

#### 4.6 List Available Shipments (Courier Only)
**Request:**
```
GET {{base_url}}/api/shipments/courier/available
Authorization: Bearer {{courier_token}}
```

**Expected Response:** 200 OK
- Array of shipments with status "Assigned" (ready for pickup)
- Each shipment includes order and address information

**Validation:**
- Only couriers can access this endpoint
- Returns shipments available for pickup

**Error Test:** Try accessing with regular user token - should return 403 Forbidden

---

#### 4.7 List Assigned Shipments (Courier Only)
**Request:**
```
GET {{base_url}}/api/shipments/courier/assigned
Authorization: Bearer {{courier_token}}
```

**Query Parameters (Optional):**
- `?status=Assigned` - Filter by status
- `?status=InTransit` - Filter by status
- `?activeOnly=true` - Show only active shipments (Assigned or InTransit)

**Expected Response:** 200 OK
- Array of shipments assigned to the authenticated courier
- Includes all statuses or filtered by query parameters

**Validation:**
- Only couriers can access this endpoint
- Returns shipments for the authenticated courier's wallet address

**Error Test:** Try accessing with regular user token - should return 403 Forbidden

---

#### 4.8 Get Courier Dashboard (Courier Only)
**Request:**
```
GET {{base_url}}/api/shipments/courier/dashboard
Authorization: Bearer {{courier_token}}
```

**Expected Response:** 200 OK
- Dashboard object containing:
  - `stats`: Object with counts (total, active, assigned, inTransit, delivered)
  - `activeShipments`: Array of active shipments
  - `recentShipments`: Array of recent shipments (last 10)

**Validation:**
- Only couriers can access this endpoint
- Stats reflect courier's shipment counts

**Error Test:** Try accessing with regular user token - should return 403 Forbidden

---

### Phase 5: Order Completion

#### 5.1 Confirm Receipt (Buyer)
**Request:**
```
POST {{base_url}}/api/orders/{{order_id}}/confirm
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 200 OK
- Transaction hash
- Order status should update to "completed"
- Escrow should release funds to seller

**Validation:**
- Transaction hash present
- Order status is "completed"
- Funds released (check escrow status)

---

#### 5.2 Verify Order Completion
**Request:**
```
GET {{base_url}}/api/orders/{{order_id}}
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 200 OK
- Order status should be "completed"
- All related entities should reflect completion

---

## Additional Test Scenarios

### Error Handling Tests

#### E1. Create Product Without Authentication
**Request:**
```
POST {{base_url}}/api/products
Content-Type: application/json

{
  "title": "Test Product",
  "description": "Test",
  "price": 1.0
}
```

**Expected Response:** 401 Unauthorized

---

#### E2. Create Order with Invalid Product ID
**Request:**
```
POST {{base_url}}/api/orders
Authorization: Bearer {{buyer_token}}
Content-Type: application/json

{
  "productId": 99999
}
```

**Expected Response:** 404 Not Found or 400 Bad Request

---

#### E3. Fund Order with Insufficient Balance
**Note:** The fund order endpoint doesn't accept a value parameter - it automatically calculates the required amount based on product price and fees. To test insufficient funds, ensure the buyer's wallet has less ETH than required.

**Request:**
```
POST {{base_url}}/api/orders/{{order_id}}/fund
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 400 Bad Request or Transaction Failure
- Error message about insufficient funds or transaction failure

---

#### E4. Access Order as Unauthorized User
**Request:**
```
GET {{base_url}}/api/orders/{{order_id}}
```

**Expected Response:** 401 Unauthorized

---

#### E5. Access Courier Endpoints as Regular User
**Request:**
```
GET {{base_url}}/api/shipments/courier/available
Authorization: Bearer {{buyer_token}}
```

**Expected Response:** 403 Forbidden
- Error message: "This endpoint is only available for couriers"

**Test all courier endpoints:**
- `GET /api/shipments/courier/available` - Should return 403
- `GET /api/shipments/courier/assigned` - Should return 403
- `GET /api/shipments/courier/dashboard` - Should return 403

---

#### E6. Register with Invalid Role
**Request:**
```
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "email": "invalid@example.com",
  "password": "Pass123!",
  "username": "invalid_user",
  "role": "admin"
}
```

**Expected Response:** 400 Bad Request
- Error message: "Role must be null (regular user) or 'courier'"

---

### Edge Cases

#### EC1. List Products with Filters
Test various filter combinations:
- Price range filtering
- Seller filtering
- Search functionality
- Pagination

#### EC2. Multiple Orders for Same Product
- Create multiple orders for the same product
- Verify each order is independent

#### EC3. Order Status Transitions
Verify status transitions:
- `created` → `funded` → `shipped` → `in_transit` → `delivered` → `completed`

---

## Postman Collection Structure

Organize your Postman collection as follows:

```
C2C Marketplace API Tests
├── 1. Authentication
│   ├── Register Seller
│   ├── Register Buyer
│   ├── Register Courier
│   ├── Login Seller
│   └── Login Buyer
├── 2. Products
│   ├── Create Product
│   ├── List Products
│   ├── Get Product by ID
│   ├── Update Product
│   └── Deactivate Product
├── 3. Orders
│   ├── Create Order
│   ├── Get Order
│   ├── List Orders
│   ├── Fund Order
│   ├── Mark Ready to Ship
│   └── Confirm Receipt
├── 4. Escrows
│   └── Get Escrow
├── 5. Shipments
│   ├── Get Shipment by ID
│   ├── Get Shipment by Order ID
│   ├── Confirm Pickup
│   └── Confirm Delivery
├── 5.5. Courier Endpoints
│   ├── List Available Shipments
│   ├── List Assigned Shipments
│   └── Get Courier Dashboard
└── 6. Error Cases
    ├── Unauthorized Access
    ├── Invalid Product ID
    ├── Insufficient Funds
    ├── Invalid Order State
    ├── Role-Based Access Control (Regular User accessing courier endpoints)
    └── Invalid Role Registration
```

## Test Execution Order

For a complete end-to-end test, execute in this order:

1. **Setup Phase**
   - Register all users (seller, buyer, courier)
   - Login all users
   - Ensure wallet addresses are set

2. **Product Phase**
   - Create product (regular user as seller)
   - List products
   - Get product details

3. **Order Phase**
   - Create order (regular user as buyer)
   - Fund order (buyer)
   - Verify escrow created

4. **Shipping Phase**
   - Mark ready to ship (seller)
   - List available shipments (courier)
   - Get courier dashboard (courier)
   - Confirm pickup (courier)
   - Confirm delivery (courier)

5. **Completion Phase**
   - Confirm receipt (buyer)
   - Verify order completion
   - Verify funds released

## Success Criteria

A successful end-to-end test should verify:

✅ All API endpoints return expected status codes  
✅ Data persists correctly in database  
✅ Blockchain transactions are created and confirmed  
✅ Order status transitions correctly through all phases  
✅ Escrow holds and releases funds correctly  
✅ Shipment tracking works end-to-end  
✅ Error handling works for invalid inputs  
✅ Authentication and authorization work correctly  
✅ Role-based access control works (couriers can access courier endpoints, regular users cannot)  
✅ Regular users can both create products and create orders  
✅ Courier-specific endpoints return appropriate data  

## Notes

1. **Blockchain Delays**: Some operations may take time to confirm on the blockchain. Wait for transaction confirmations before proceeding.

2. **Gas Costs**: Ensure test accounts have sufficient ETH for gas fees.

3. **Event Indexing**: The event indexer should automatically sync blockchain events to the database. Monitor backend logs to ensure events are being processed.

4. **Courier Setup**: Before testing shipping, ensure courier addresses are added to the CourierContract using Truffle console:
   ```javascript
   const courier = await CourierContract.deployed();
   await courier.addCourier(courierWalletAddress);
   ```

5. **Ether Values**: 
   - All API requests and responses use Ether values (numbers) instead of Wei
   - Product prices, fees, and amounts are specified in Ether (e.g., `1.5` for 1.5 ETH)
   - The backend automatically handles Wei conversions for blockchain transactions

6. **Testing Without Blockchain**: Some read operations (GET endpoints) may work without blockchain, but write operations (POST/PUT) require blockchain connectivity.

## Troubleshooting

- **401 Unauthorized**: Check token is set correctly in Authorization header
- **500 Internal Server Error**: Check backend logs, verify blockchain connection
- **Transaction Failed**: Check account has sufficient ETH, verify contract addresses in .env
- **Event Not Indexed**: Check event indexer is running, verify contract addresses
