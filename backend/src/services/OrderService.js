import { OrderRepository } from '../repositories/OrderRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { OrderStatus } from '../entities/Order.js';
import { MarketplaceContractService } from './contracts/MarketplaceContractService.js';

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
    const courierFeeWei = this.getCourierFeeWei(priceWei);
    const platformFeeWei = this.getPlatformFeeWei(priceWei);
    const price = BigInt(priceWei);
    const courier = BigInt(courierFeeWei);
    const platform = BigInt(platformFeeWei);
    const total = price + courier + platform;
    
    return {
      priceWei: priceWei,
      courierFeeWei,
      platformFeeWei,
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

    const txResult = await MarketplaceContractService.createOrder(productId);

    const order = await OrderRepository.create({
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
    const { buyer, seller, status, page = 1, limit = 20 } = options;

    const repository = OrderRepository.getRepository();
    const queryBuilder = repository.createQueryBuilder('order');

    if (buyer) {
      queryBuilder.andWhere('order.buyer = :buyer', { buyer });
    }

    if (seller) {
      queryBuilder.andWhere('order.seller = :seller', { seller });
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

  static async fundOrder(orderId, buyerAddress) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!buyerAddress) {
      throw new Error('Buyer address is required');
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.buyer.toLowerCase() !== buyerAddress.toLowerCase()) {
      throw new Error('Only the buyer can fund this order');
    }

    if (order.status !== OrderStatus.PendingPayment) {
      throw new Error(`Order cannot be funded. Current status: ${order.status}`);
    }

    if (!order.product) {
      throw new Error('Product information not found for this order');
    }

    const fees = this.calculateTotalFee(order.product.priceWei);

    const txResult = await MarketplaceContractService.buyAndFund(
      orderId,
      fees.totalWei
    );

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

    return {
      order,
      transaction: txResult
    };
  }

  static async confirmReceipt(orderId, buyerAddress) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!buyerAddress) {
      throw new Error('Buyer address is required');
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.buyer.toLowerCase() !== buyerAddress.toLowerCase()) {
      throw new Error('Only the buyer can confirm receipt');
    }

    if (order.status !== OrderStatus.Delivered) {
      throw new Error(`Order cannot be confirmed. Current status: ${order.status}`);
    }

    const txResult = await MarketplaceContractService.confirmReceipt(orderId);

    return {
      order,
      transaction: txResult
    };
  }
}
