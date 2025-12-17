import { OrderRepository } from '../repositories/OrderRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { OrderStatus } from '../entities/Order.js';
import { MarketplaceContractService } from './contracts/MarketplaceContractService.js';
import { CourierContractService } from './contracts/CourierContractService.js';
import { ShipmentService } from './ShipmentService.js';
import { blockchainConfig } from '../config/blockchain.js';
import { loadContractABI } from './contracts/ContractABILoader.js';
import { BlockchainService } from './BlockchainService.js';

export class OrderService {
  static getCourierFeeWei(priceWei) {
    const courierFeePercent = parseFloat(process.env.COURIER_FEE_PERCENT || '5');
    const courierFeeFixed = process.env.COURIER_FEE_FIXED_WEI || '100000000000000000';
    
    if (courierFeePercent > 0) {
      const price = BigInt(priceWei);
      const fee = (price * BigInt(Math.floor(courierFeePercent * 100))) / BigInt(10000);
      return fee.toString();
    }
    
    return courierFeeFixed;
  }

  static getPlatformFeeWei(priceWei) {
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '3');
    const price = BigInt(priceWei);
    const fee = (price * BigInt(Math.floor(platformFeePercent * 100))) / BigInt(10000);
    return fee.toString();
  }

  static calculateTotalFee(priceWei) {
    const price = BigInt(priceWei);
    const courierFeeWei = BigInt('10000000000000000');
    const platformFeeWei = (price * BigInt(5)) / BigInt(100);
    const total = price + courierFeeWei + platformFeeWei;
    
    return {
      priceWei: priceWei,
      courierFeeWei: courierFeeWei.toString(),
      platformFeeWei: platformFeeWei.toString(),
      totalWei: total.toString()
    };
  }

  static validateAddress(address) {
    if (!address) {
      throw new Error('Address is required');
    }

    const requiredFields = ['name', 'line1', 'city', 'state', 'country'];
    const missingFields = requiredFields.filter(field => !address[field] || address[field].trim() === '');

    if (missingFields.length > 0) {
      throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
    }

    if (address.name && address.name.length > 255) {
      throw new Error('Address name must be 255 characters or less');
    }

    if (address.line1 && address.line1.length > 255) {
      throw new Error('Address line1 must be 255 characters or less');
    }

    if (address.line2 && address.line2.length > 255) {
      throw new Error('Address line2 must be 255 characters or less');
    }

    if (address.city && address.city.length > 100) {
      throw new Error('Address city must be 100 characters or less');
    }

    if (address.state && address.state.length > 100) {
      throw new Error('Address state must be 100 characters or less');
    }

    if (address.postalCode && address.postalCode.length > 50) {
      throw new Error('Address postalCode must be 50 characters or less');
    }

    if (address.zip && address.zip.length > 50) {
      throw new Error('Address zip must be 50 characters or less');
    }

    if (address.country && address.country.length > 100) {
      throw new Error('Address country must be 100 characters or less');
    }

    return {
      name: address.name.trim(),
      line1: address.line1.trim(),
      line2: address.line2 ? address.line2.trim() : '',
      city: address.city.trim(),
      state: address.state.trim(),
      zip: address.zip || address.postalCode || '',
      country: address.country.trim()
    };
  }

  static formatAddressForContract(address) {
    return {
      name: address.name || '',
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || address.postalCode || '',
      country: address.country || ''
    };
  }

  static async createOrder(productId, buyerAddress) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    if (!buyerAddress) {
      throw new Error('Buyer address is required');
    }

    const product = await ProductRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not active');
    }

    if (product.seller.toLowerCase() === buyerAddress.toLowerCase()) {
      throw new Error('Buyer cannot purchase their own product');
    }

    const existingOrders = await OrderRepository.findActiveByProductId(productId);
    if (existingOrders.length > 0) {
      throw new Error('Product already has an active order');
    }

    let blockchainProduct;
    try {
      blockchainProduct = await MarketplaceContractService.getProduct(productId);
      if (!blockchainProduct || Number(blockchainProduct.id) === 0) {
        const nextProductId = await MarketplaceContractService.getNextProductId();
        throw new Error(`Product ${productId} does not exist on blockchain. Next available product ID is ${nextProductId}. If you recently redeployed the contract, you need to re-add products to the blockchain.`);
      }
      if (!blockchainProduct.isActive) {
        throw new Error('Product is not active on blockchain');
      }
      
      const blockchainSeller = blockchainProduct.seller.toLowerCase();
      if (blockchainSeller === buyerAddress.toLowerCase()) {
        throw new Error('Buyer cannot purchase their own product');
      }
    } catch (error) {
      if (error.message.includes('does not exist') || error.message.includes('not active') || error.message.includes('cannot purchase')) {
        throw error;
      }
      throw new Error(`Failed to verify product on blockchain: ${error.message}`);
    }

    const txResult = await MarketplaceContractService.createOrder(productId, buyerAddress);

    let blockchainOrderId = null;
    
    if (txResult.receipt && txResult.receipt.logs) {
      try {
        const contract = MarketplaceContractService.getReadOnlyContract();
        const iface = contract.interface;
        const orderCreatedTopic = iface.getEvent('OrderCreated').topicHash;
        
        for (const log of txResult.receipt.logs) {
          if (log.topics && log.topics[0] === orderCreatedTopic) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed && parsed.name === 'OrderCreated' && parsed.args && parsed.args.orderId !== undefined) {
                blockchainOrderId = Number(parsed.args.orderId);
                break;
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse OrderCreated event:', error.message);
      }
    }

    if (!blockchainOrderId) {
      try {
        const contract = MarketplaceContractService.getReadOnlyContract();
        const ordersLength = await contract.orders.length();
        blockchainOrderId = Number(ordersLength);
      } catch (error) {
        throw new Error('Failed to determine order ID from transaction. Please check the OrderCreated event.');
      }
    }

    const order = await OrderRepository.create({
      id: blockchainOrderId,
      productId,
      buyer: buyerAddress,
      seller: product.seller,
      status: OrderStatus.PendingPayment
    });

    return order;
  }

  static async getOrder(id) {
    if (!id) {
      throw new Error('Order ID is required');
    }

    const order = await OrderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  static async listOrders(options = {}) {
    const { buyer, seller, status, userAddress, page = 1, limit = 20 } = options;

    const repository = OrderRepository.getRepository();
    const queryBuilder = repository.createQueryBuilder('order');

    if (userAddress) {
      queryBuilder.andWhere(
        '(order.buyer = :userAddress OR order.seller = :userAddress)',
        { userAddress }
      );
    } else {
      if (buyer) {
        queryBuilder.andWhere('order.buyer = :buyer', { buyer });
      }

      if (seller) {
        queryBuilder.andWhere('order.seller = :seller', { seller });
      }
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('order.createdAt', 'DESC');
    queryBuilder.leftJoinAndSelect('order.product', 'product');

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async fundOrder(orderId, buyerAddress, buyerPrivateKey = null) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!buyerAddress) {
      throw new Error('Buyer address is required');
    }

    let order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const blockchainOrder = await MarketplaceContractService.getOrder(orderId);
    if (!blockchainOrder || Number(blockchainOrder.id) === 0) {
      throw new Error('Order does not exist on blockchain');
    }

    const blockchainBuyer = blockchainOrder.buyer.toLowerCase();
    if (blockchainBuyer !== buyerAddress.toLowerCase()) {
      throw new Error(`Only the buyer can fund this order. Order buyer: ${blockchainOrder.buyer}, provided: ${buyerAddress}`);
    }

    if (order.status !== OrderStatus.PendingPayment) {
      throw new Error(`Order cannot be funded. Current status: ${order.status}`);
    }

    const blockchainProduct = await MarketplaceContractService.getProduct(order.productId);
    if (!blockchainProduct || Number(blockchainProduct.id) === 0) {
      throw new Error('Product does not exist on blockchain');
    }

    const productPriceWei = blockchainProduct.priceWei.toString();
    const fees = this.calculateTotalFee(productPriceWei);

    const txResult = await MarketplaceContractService.buyAndFund(
      orderId,
      fees.totalWei,
      buyerPrivateKey
    );

    const updatedBlockchainOrder = await MarketplaceContractService.getOrder(orderId);
    if (updatedBlockchainOrder && Number(updatedBlockchainOrder.id) !== 0) {
      order = await OrderRepository.syncFromBlockchain(updatedBlockchainOrder);
      order = await OrderRepository.findById(orderId);
    }

    return {
      order,
      fees,
      transaction: txResult
    };
  }

  static async markReadyToShip(orderId, senderAddress, recipientAddress, sellerAddress = null) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!senderAddress) {
      throw new Error('Sender address is required');
    }

    if (!recipientAddress) {
      throw new Error('Recipient address is required');
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (sellerAddress && order.seller.toLowerCase() !== sellerAddress.toLowerCase()) {
      throw new Error('Only the seller can mark this order as ready to ship');
    }

    if (order.status !== OrderStatus.PaymentSecured) {
      throw new Error(`Order cannot be marked ready to ship. Current status: ${order.status}`);
    }

    const validatedSender = this.validateAddress(senderAddress);
    const validatedRecipient = this.validateAddress(recipientAddress);

    const formattedSender = this.formatAddressForContract(validatedSender);
    const formattedRecipient = this.formatAddressForContract(validatedRecipient);

    const txResult = await MarketplaceContractService.markReadyToShip(
      orderId,
      formattedSender,
      formattedRecipient
    );

    let shipment = null;
    
    if (txResult.receipt) {
      try {
        const courierABI = loadContractABI('CourierContract');
        const courierContract = BlockchainService.getContractReadOnly(
          blockchainConfig.courierContractAddress,
          courierABI
        );
        
        const eventInterface = courierContract.interface;
        const logs = txResult.receipt.logs || [];
        const courierContractAddress = blockchainConfig.courierContractAddress.toLowerCase();
        
        for (const log of logs) {
          if (log.address && log.address.toLowerCase() !== courierContractAddress) {
            continue;
          }
          
          try {
            const parsedLog = eventInterface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            if (parsedLog && parsedLog.name === 'AssignedShipment') {
              let shipmentId = null;
              
              if (parsedLog.args.shipment && parsedLog.args.shipment.id) {
                shipmentId = parsedLog.args.shipment.id;
              } else if (parsedLog.args.shipmentId) {
                shipmentId = parsedLog.args.shipmentId;
              }
              
              if (shipmentId) {
                shipment = await ShipmentService.syncShipmentFromBlockchain(
                  Number(shipmentId)
                );
                break;
              }
            }
          } catch (parseError) {
            continue;
          }
        }
      } catch (error) {
        console.warn('Could not sync shipment from transaction receipt:', error.message);
      }
    }

    const updatedOrder = await OrderRepository.findById(orderId);

    return {
      order: updatedOrder,
      shipment,
      transaction: txResult
    };
  }

  static async confirmReceipt(orderId, buyerAddress, buyerPrivateKey = null) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!buyerAddress) {
      throw new Error('Buyer address is required');
    }

    let order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.buyer.toLowerCase() !== buyerAddress.toLowerCase()) {
      throw new Error('Only the buyer can confirm receipt');
    }

    const blockchainOrder = await MarketplaceContractService.getOrder(orderId);
    
    const blockchainStatus = blockchainOrder.status;
    const statusMap = {
      0: OrderStatus.PendingPayment,
      1: OrderStatus.PaymentSecured,
      2: OrderStatus.PreparingShipment,
      3: OrderStatus.InTransit,
      4: OrderStatus.Delivered,
      5: OrderStatus.BuyerConfirmed,
      6: OrderStatus.Completed
    };
    const currentBlockchainStatus = statusMap[Number(blockchainStatus)] || order.status;
    
    if (order.status !== OrderStatus.Delivered && currentBlockchainStatus !== OrderStatus.Delivered) {
      throw new Error(`Order cannot be confirmed. Current status: ${order.status} (blockchain: ${currentBlockchainStatus})`);
    }
    
    if (order.status !== OrderStatus.Delivered && currentBlockchainStatus === OrderStatus.Delivered) {
      order = await OrderRepository.syncFromBlockchain(blockchainOrder);
    }

    const txResult = await MarketplaceContractService.confirmReceipt(orderId, buyerPrivateKey);

    let updatedBlockchainOrder;
    let retries = 3;
    while (retries > 0) {
      updatedBlockchainOrder = await MarketplaceContractService.getOrder(orderId);
      if (updatedBlockchainOrder && Number(updatedBlockchainOrder.status) >= 5) {
        break;
      }
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const updatedOrder = await OrderRepository.syncFromBlockchain(
      updatedBlockchainOrder || await MarketplaceContractService.getOrder(orderId)
    );

    return {
      order: updatedOrder,
      transaction: txResult
    };
  }
}
