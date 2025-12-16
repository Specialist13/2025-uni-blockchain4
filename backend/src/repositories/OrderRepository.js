import { getRepository } from '../database/connection.js';
import { Order, OrderStatus } from '../entities/Order.js';
import { Not } from 'typeorm';

export class OrderRepository {
  static getRepository() {
    return getRepository(Order);
  }

  static async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({ 
      where: { id },
      relations: ['product', 'escrow', 'shipment']
    });
  }

  static async findByBuyer(buyerAddress) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { buyer: buyerAddress },
      relations: ['product']
    });
  }

  static async findBySeller(sellerAddress) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { seller: sellerAddress },
      relations: ['product']
    });
  }

  static async findByStatus(status) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { status },
      relations: ['product']
    });
  }

  static async findActiveByProductId(productId) {
    const repository = this.getRepository();
    return await repository.find({
      where: {
        productId,
        status: Not(OrderStatus.Completed)
      }
    });
  }

  static async create(orderData) {
    const repository = this.getRepository();
    const order = repository.create(orderData);
    return await repository.save(order);
  }

  static async update(id, orderData) {
    const repository = this.getRepository();
    await repository.update(id, orderData);
    return await this.findById(id);
  }

  static async syncFromBlockchain(blockchainOrder) {
    const repository = this.getRepository();
    const existing = await this.findById(Number(blockchainOrder.id));
    
    const statusMap = {
      0: OrderStatus.PendingPayment,
      1: OrderStatus.PaymentSecured,
      2: OrderStatus.PreparingShipment,
      3: OrderStatus.InTransit,
      4: OrderStatus.Delivered,
      5: OrderStatus.BuyerConfirmed,
      6: OrderStatus.Completed
    };

    const orderData = {
      id: Number(blockchainOrder.id),
      productId: Number(blockchainOrder.productId),
      seller: blockchainOrder.seller,
      escrowId: blockchainOrder.escrowId ? Number(blockchainOrder.escrowId) : null,
      courierJobId: blockchainOrder.courierJobId ? Number(blockchainOrder.courierJobId) : null,
      status: statusMap[blockchainOrder.status] || OrderStatus.PendingPayment,
      createdAt: new Date(Number(blockchainOrder.createdAt) * 1000)
    };

    if (existing) {
      if (!existing.buyer) {
        orderData.buyer = blockchainOrder.buyer;
      } else {
        orderData.buyer = existing.buyer;
      }
      return await this.update(existing.id, orderData);
    } else {
      orderData.buyer = blockchainOrder.buyer;
      return await this.create(orderData);
    }
  }
}
