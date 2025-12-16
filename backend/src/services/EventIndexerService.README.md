# Event Indexing Service

The Event Indexing Service listens to blockchain events from all smart contracts and synchronizes the database with the on-chain state.

## Features

- **Real-time Event Listening**: Listens to events as they occur on the blockchain
- **Event Queue Processing**: Queues events for reliable processing
- **Duplicate Prevention**: Tracks processed events to prevent duplicates
- **Event Replay**: Automatically replays missed events on startup and periodically
- **Database Synchronization**: Updates database entities when events occur
- **Graceful Shutdown**: Properly stops listeners on server shutdown

## Architecture

```
EventIndexerService
├── Event Listeners (Real-time)
│   ├── MarketplaceContract events
│   ├── EscrowContract events
│   └── CourierContract events
├── Event Queue
│   └── Processes events sequentially
├── Event Processors
│   ├── ProductAdded → ProductRepository.syncFromBlockchain()
│   ├── OrderCreated → OrderRepository.syncFromBlockchain()
│   ├── EscrowFunded → EscrowRepository.syncFromBlockchain()
│   └── ... (all event types)
└── Polling Service
    └── Periodically checks for missed events
```

## Events Handled

### MarketplaceContract Events
- `ProductAdded` - Syncs product to database
- `OrderCreated` - Syncs order to database
- `EscrowFunded` - Syncs escrow and order status
- `ShipmentPrepared` - Updates order status
- `ShipmentInTransit` - Updates order status
- `ShipmentDelivered` (requestConfirmation) - Updates order status
- `FundsReleased` - Updates order status
- `TransactionCompleted` - Updates order status to completed

### EscrowContract Events
- `CourierFeeConfirmed` - Updates escrow status

### CourierContract Events
- `AssignedShipment` - Syncs shipment to database
- `CourierFeeReceived` - Logs courier fee receipt

## Usage

The service automatically starts when the server starts:

```javascript
// In server.js
await EventIndexerService.start();
```

### Manual Control

```javascript
import { EventIndexerService } from './services/EventIndexerService.js';

// Start the service
await EventIndexerService.start();

// Stop the service
await EventIndexerService.stop();
```

## Configuration

Environment variables:

```env
# Event polling interval (milliseconds)
EVENT_POLL_INTERVAL=15000

# Contract addresses (required)
MARKETPLACE_CONTRACT_ADDRESS=0x...
ESCROW_CONTRACT_ADDRESS=0x...
COURIER_CONTRACT_ADDRESS=0x...

# Blockchain RPC URL
BLOCKCHAIN_RPC_URL=http://127.0.0.1:9545
```

## Event Processing Flow

1. **Event Occurs**: Smart contract emits an event
2. **Listener Catches**: Event listener receives the event
3. **Queue Event**: Event is added to processing queue
4. **Check Duplicate**: Verify event hasn't been processed
5. **Process Event**: Call appropriate handler
6. **Sync Database**: Update database with blockchain data
7. **Mark Processed**: Record event as processed

## Event Replay

The service automatically replays missed events:

1. **On Startup**: Checks last processed block for each contract
2. **Periodic Polling**: Every 15 seconds (configurable), checks for new blocks
3. **Range Replay**: Replays events from last processed block to current block
4. **Duplicate Prevention**: Skips events already in database

## Database Schema

### ProcessedEvent Entity

Tracks processed events to prevent duplicates:

```javascript
{
  id: integer,
  eventName: string,
  contractAddress: string,
  transactionHash: string (unique),
  blockNumber: integer,
  logIndex: integer,
  processedAt: datetime
}
```

## Error Handling

- Events that fail to process are re-queued
- Errors are logged but don't stop the service
- Failed events are retried after 1 second delay
- Service continues processing other events even if one fails

## Performance Considerations

- **Queue Processing**: Events processed sequentially to avoid race conditions
- **Batch Polling**: Checks multiple blocks at once
- **Indexed Queries**: ProcessedEvent table has indexes on transactionHash and blockNumber
- **Configurable Polling**: Adjust `EVENT_POLL_INTERVAL` based on network speed

## Monitoring

The service logs:
- Event queued messages
- Event processed messages
- Error messages for failed events
- Replay statistics
- Last processed block numbers

Example logs:
```
Starting event indexer...
Last processed blocks: { marketplace: 1234, escrow: 1230, courier: 1232 }
Queued event: ProductAdded (0xabc...-0)
Processing event: ProductAdded (0xabc...-0)
Successfully processed event: ProductAdded (0xabc...-0)
Replaying events for marketplace from block 1234 to 1250
Replayed 5 events for marketplace
```

## Troubleshooting

### Events Not Processing

1. Check blockchain connection: `BLOCKCHAIN_RPC_URL` is correct
2. Check contract addresses: All addresses are set in `.env`
3. Check database: Database is initialized and connected
4. Check logs: Look for error messages

### Duplicate Events

- The service prevents duplicates using `transactionHash` and `logIndex`
- If duplicates occur, check `ProcessedEvent` table
- Clear processed events table if needed (development only)

### Missing Events

- Service replays events on startup
- Polling catches missed events every 15 seconds
- Check `lastProcessedBlocks` in logs
- Manually trigger replay if needed

## Development

### Testing Event Processing

```javascript
// Manually trigger event replay
await EventIndexerService.replayEvents(
  'marketplace',
  blockchainConfig.marketplaceContractAddress,
  0,
  currentBlock
);
```

### Clearing Processed Events

```javascript
// In development only - clears all processed events
const repo = ProcessedEventRepository.getRepository();
await repo.clear();
```

## Future Enhancements

- WebSocket support for real-time event streaming
- Event filtering by contract/event type
- Event processing metrics and monitoring
- Distributed event processing (multiple workers)
- Event archival for historical queries
