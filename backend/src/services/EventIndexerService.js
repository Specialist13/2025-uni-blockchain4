import { BlockchainService } from './BlockchainService.js';
import { blockchainConfig } from '../config/blockchain.js';
import { MarketplaceContractService } from './contracts/MarketplaceContractService.js';
import { EscrowContractService } from './contracts/EscrowContractService.js';
import { CourierContractService } from './contracts/CourierContractService.js';
import { ProcessedEventRepository } from '../repositories/ProcessedEventRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { OrderRepository } from '../repositories/OrderRepository.js';
import { EscrowRepository } from '../repositories/EscrowRepository.js';
import { ShipmentRepository } from '../repositories/ShipmentRepository.js';

export class EventIndexerService {
  static isRunning = false;
  static listeners = [];
  static eventQueue = [];
  static processingQueue = false;
  static pollingInterval = null;
  static lastProcessedBlocks = {};

  static async start() {
    if (this.isRunning) {
      console.log('Event indexer is already running');
      return;
    }

    try {
      BlockchainService.initialize();
      
      this.lastProcessedBlocks = {
        marketplace: await ProcessedEventRepository.getLastProcessedBlock(
          blockchainConfig.marketplaceContractAddress
        ),
        escrow: await ProcessedEventRepository.getLastProcessedBlock(
          blockchainConfig.escrowContractAddress
        ),
        courier: await ProcessedEventRepository.getLastProcessedBlock(
          blockchainConfig.courierContractAddress
        )
      };

      console.log('Starting event indexer...');
      console.log('Last processed blocks:', this.lastProcessedBlocks);

      this.setupMarketplaceListeners();
      this.setupEscrowListeners();
      this.setupCourierListeners();

      this.startQueueProcessor();
      this.startPolling();

      this.isRunning = true;
      console.log('Event indexer started successfully');
    } catch (error) {
      console.error('Failed to start event indexer:', error);
      throw error;
    }
  }

  static async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping event indexer...');

    this.listeners.forEach(listener => {
      if (listener.removeAllListeners) {
        listener.removeAllListeners();
      }
    });
    this.listeners = [];

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.processingQueue = false;
    this.isRunning = false;
    console.log('Event indexer stopped');
  }

  static setupMarketplaceListeners() {
    const contract = MarketplaceContractService.getReadOnlyContract();
    
    contract.on('ProductAdded', async (...args) => {
      const event = args[args.length - 1];
      const [productId, seller, title, priceWei] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'ProductAdded',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { productId, seller, title, priceWei },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('OrderCreated', async (...args) => {
      const event = args[args.length - 1];
      const [orderId, productId, buyer, seller] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'OrderCreated',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { orderId, productId, buyer, seller },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('EscrowFunded', async (...args) => {
      const event = args[args.length - 1];
      const [orderId, escrowId] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'EscrowFunded',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { orderId, escrowId },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('ShipmentPrepared', async (...args) => {
      const event = args[args.length - 1];
      const [orderId] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'ShipmentPrepared',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { orderId },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('ShipmentInTransit', async (...args) => {
      const event = args[args.length - 1];
      const [buyer, orderId] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'ShipmentInTransit',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { buyer, orderId },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('requestConfirmation', async (...args) => {
      const event = args[args.length - 1];
      const [buyer, orderId] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'ShipmentDelivered',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { buyer, orderId },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('FundsReleased', async (...args) => {
      const event = args[args.length - 1];
      const [seller, orderId] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'FundsReleased',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { seller, orderId },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('TransactionCompleted', async (...args) => {
      const event = args[args.length - 1];
      const [buyer, orderId] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'TransactionCompleted',
        contractAddress: blockchainConfig.marketplaceContractAddress,
        contractType: 'marketplace',
        args: { buyer, orderId },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    this.listeners.push(contract);
  }

  static setupEscrowListeners() {
    const contract = EscrowContractService.getReadOnlyContract();
    
    contract.on('CourierFeeConfirmed', async (...args) => {
      const event = args[args.length - 1];
      const [orderId, escrowId, amountWei] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'CourierFeeConfirmed',
        contractAddress: blockchainConfig.escrowContractAddress,
        contractType: 'escrow',
        args: { orderId, escrowId, amountWei },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    this.listeners.push(contract);
  }

  static setupCourierListeners() {
    const contract = CourierContractService.getReadOnlyContract();
    
    contract.on('AssignedShipment', async (...args) => {
      const event = args[args.length - 1];
      const [shipment, courier] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'AssignedShipment',
        contractAddress: blockchainConfig.courierContractAddress,
        contractType: 'courier',
        args: { shipment, courier },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    contract.on('CourierFeeReceived', async (...args) => {
      const event = args[args.length - 1];
      const [orderId, escrowId, amountWei] = args.slice(0, -1);
      
      await this.queueEvent({
        eventName: 'CourierFeeReceived',
        contractAddress: blockchainConfig.courierContractAddress,
        contractType: 'courier',
        args: { orderId, escrowId, amountWei },
        event: {
          transactionHash: event.log?.transactionHash || event.transactionHash,
          blockNumber: event.log?.blockNumber || event.blockNumber,
          logIndex: event.log?.index || event.logIndex || 0
        }
      });
    });

    this.listeners.push(contract);
  }

  static async queueEvent(eventData) {
    const eventKey = `${eventData.event.transactionHash}-${eventData.event.logIndex}`;
    
    const isProcessed = await ProcessedEventRepository.isProcessed(
      eventData.event.transactionHash,
      eventData.event.logIndex
    );

    if (isProcessed) {
      console.log(`Event ${eventKey} already processed, skipping`);
      return;
    }

    this.eventQueue.push(eventData);
    console.log(`Queued event: ${eventData.eventName} (${eventKey})`);
  }

  static startQueueProcessor() {
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;
    this.processQueue();
  }

  static async processQueue() {
    const maxRetries = parseInt(process.env.EVENT_MAX_RETRIES || '5');
    const retryDelay = parseInt(process.env.EVENT_RETRY_DELAY_MS || '1000');
    const eventRetryCounts = new Map();

    while (this.processingQueue) {
      if (this.eventQueue.length > 0) {
        const eventData = this.eventQueue.shift();
        const eventKey = `${eventData.event.transactionHash}-${eventData.event.logIndex}`;
        const retryCount = eventRetryCounts.get(eventKey) || 0;

        try {
          await this.processEvent(eventData);
          eventRetryCounts.delete(eventKey);
        } catch (error) {
          console.error(`Error processing event ${eventData.eventName} (retry ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount < maxRetries) {
            eventRetryCounts.set(eventKey, retryCount + 1);
            const delay = retryDelay * Math.pow(2, retryCount);
            this.eventQueue.push(eventData);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`Max retries reached for event ${eventKey}. Moving to failed events.`);
            eventRetryCounts.delete(eventKey);
            await this.handleFailedEvent(eventData, error);
          }
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  static async handleFailedEvent(eventData, error) {
    const eventKey = `${eventData.event.transactionHash}-${eventData.event.logIndex}`;
    console.error(`Permanently failed event ${eventKey} after max retries:`, {
      eventName: eventData.eventName,
      contractAddress: eventData.contractAddress,
      transactionHash: eventData.event.transactionHash,
      blockNumber: eventData.event.blockNumber,
      logIndex: eventData.event.logIndex,
      error: error.message || 'Unknown error',
      stack: error.stack
    });
  }

  static async processEvent(eventData) {
    const eventKey = `${eventData.event.transactionHash}-${eventData.event.logIndex}`;
    
    try {
      console.log(`Processing event: ${eventData.eventName} (${eventKey})`);

      switch (eventData.eventName) {
        case 'ProductAdded':
          await this.handleProductAdded(eventData);
          break;
        case 'OrderCreated':
          await this.handleOrderCreated(eventData);
          break;
        case 'EscrowFunded':
          await this.handleEscrowFunded(eventData);
          break;
        case 'ShipmentPrepared':
          await this.handleShipmentPrepared(eventData);
          break;
        case 'ShipmentInTransit':
          await this.handleShipmentInTransit(eventData);
          break;
        case 'ShipmentDelivered':
          await this.handleShipmentDelivered(eventData);
          break;
        case 'CourierFeeConfirmed':
          await this.handleCourierFeeConfirmed(eventData);
          break;
        case 'FundsReleased':
          await this.handleFundsReleased(eventData);
          break;
        case 'TransactionCompleted':
          await this.handleTransactionCompleted(eventData);
          break;
        case 'AssignedShipment':
          await this.handleAssignedShipment(eventData);
          break;
        case 'CourierFeeReceived':
          await this.handleCourierFeeReceived(eventData);
          break;
        default:
          console.warn(`Unknown event type: ${eventData.eventName}`);
      }

      await ProcessedEventRepository.create({
        eventName: eventData.eventName,
        contractAddress: eventData.contractAddress,
        transactionHash: eventData.event.transactionHash,
        blockNumber: eventData.event.blockNumber,
        logIndex: eventData.event.logIndex
      });

      console.log(`Successfully processed event: ${eventData.eventName} (${eventKey})`);
    } catch (error) {
      console.error(`Failed to process event ${eventData.eventName}:`, error);
      throw error;
    }
  }

  static async handleProductAdded(eventData) {
    const { productId } = eventData.args;
    const product = await MarketplaceContractService.getProduct(productId);
    await ProductRepository.syncFromBlockchain(product);
  }

  static async handleOrderCreated(eventData) {
    const { orderId } = eventData.args;
    const order = await MarketplaceContractService.getOrder(orderId);
    await OrderRepository.syncFromBlockchain(order);
  }

  static async handleEscrowFunded(eventData) {
    const { orderId, escrowId } = eventData.args;
    
    const escrow = await EscrowContractService.getEscrow(escrowId);
    await EscrowRepository.syncFromBlockchain(escrow);
    
    const order = await MarketplaceContractService.getOrder(orderId);
    await OrderRepository.syncFromBlockchain(order);
  }

  static async handleShipmentPrepared(eventData) {
    const { orderId } = eventData.args;
    const order = await MarketplaceContractService.getOrder(orderId);
    await OrderRepository.syncFromBlockchain(order);
  }

  static async handleShipmentInTransit(eventData) {
    const { orderId } = eventData.args;
    const order = await MarketplaceContractService.getOrder(orderId);
    await OrderRepository.syncFromBlockchain(order);
  }

  static async handleShipmentDelivered(eventData) {
    const { orderId } = eventData.args;
    const order = await MarketplaceContractService.getOrder(orderId);
    await OrderRepository.syncFromBlockchain(order);
  }

  static async handleCourierFeeConfirmed(eventData) {
    const { escrowId } = eventData.args;
    const escrow = await EscrowContractService.getEscrow(escrowId);
    await EscrowRepository.syncFromBlockchain(escrow);
  }

  static async handleFundsReleased(eventData) {
    const { orderId } = eventData.args;
    const order = await MarketplaceContractService.getOrder(orderId);
    await OrderRepository.syncFromBlockchain(order);
  }

  static async handleTransactionCompleted(eventData) {
    const { orderId } = eventData.args;
    const order = await MarketplaceContractService.getOrder(orderId);
    await OrderRepository.syncFromBlockchain(order);
  }

  static async handleAssignedShipment(eventData) {
    const { shipment } = eventData.args;
    await ShipmentRepository.syncFromBlockchain(shipment);
  }

  static async handleCourierFeeReceived(eventData) {
    console.log('CourierFeeReceived event processed:', eventData.args);
  }

  static startPolling() {
    const pollInterval = parseInt(process.env.EVENT_POLL_INTERVAL || '15000');
    
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForMissedEvents();
      } catch (error) {
        console.error('Error polling for missed events:', error);
      }
    }, pollInterval);
  }

  static async pollForMissedEvents() {
    const provider = BlockchainService.getProvider();
    const currentBlock = await provider.getBlockNumber();
    
    const contracts = [
      { name: 'marketplace', address: blockchainConfig.marketplaceContractAddress },
      { name: 'escrow', address: blockchainConfig.escrowContractAddress },
      { name: 'courier', address: blockchainConfig.courierContractAddress }
    ];

    for (const contract of contracts) {
      const lastBlock = this.lastProcessedBlocks[contract.name] || 0;
      const fromBlock = Math.max(lastBlock - 100, 0);
      const toBlock = currentBlock;

      if (fromBlock < toBlock) {
        await this.replayEvents(contract.name, contract.address, fromBlock, toBlock);
        this.lastProcessedBlocks[contract.name] = toBlock;
      }
    }
  }

  static async replayEvents(contractType, contractAddress, fromBlock, toBlock) {
    console.log(`Replaying events for ${contractType} from block ${fromBlock} to ${toBlock}`);
    
    try {
      let events = [];
      
      if (contractType === 'marketplace') {
        const contract = MarketplaceContractService.getReadOnlyContract();
        const allEvents = await contract.queryFilter({}, fromBlock, toBlock);
        events = allEvents.map(event => ({
          eventName: event.eventName,
          contractAddress,
          contractType,
          args: event.args,
          event: {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex
          }
        }));
      } else if (contractType === 'escrow') {
        const contract = EscrowContractService.getReadOnlyContract();
        const allEvents = await contract.queryFilter({}, fromBlock, toBlock);
        events = allEvents.map(event => ({
          eventName: event.eventName,
          contractAddress,
          contractType,
          args: event.args,
          event: {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex
          }
        }));
      } else if (contractType === 'courier') {
        const contract = CourierContractService.getReadOnlyContract();
        const allEvents = await contract.queryFilter({}, fromBlock, toBlock);
        events = allEvents.map(event => ({
          eventName: event.eventName,
          contractAddress,
          contractType,
          args: event.args,
          event: {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex
          }
        }));
      }

      for (const eventData of events) {
        await this.queueEvent(eventData);
      }

      if (events.length > 0) {
        console.log(`Replayed ${events.length} events for ${contractType}`);
      }
    } catch (error) {
      console.error(`Error replaying events for ${contractType}:`, error);
    }
  }
}
