import { getRepository } from '../database/connection.js';
import { Escrow, EscrowStatus } from '../entities/Escrow.js';

export class EscrowRepository {
  static getRepository() {
    return getRepository(Escrow);
  }

  static async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({ 
      where: { id },
      relations: ['order']
    });
  }

  static async findByOrderId(orderId) {
    const repository = this.getRepository();
    return await repository.findOne({ 
      where: { orderId },
      relations: ['order']
    });
  }

  static async findByBuyer(buyerAddress) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { buyer: buyerAddress },
      relations: ['order']
    });
  }

  static async findBySeller(sellerAddress) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { seller: sellerAddress },
      relations: ['order']
    });
  }

  static async create(escrowData) {
    const repository = this.getRepository();
    const escrow = repository.create(escrowData);
    return await repository.save(escrow);
  }

  static async update(id, escrowData) {
    const repository = this.getRepository();
    await repository.update(id, escrowData);
    return await this.findById(id);
  }

  static async syncFromBlockchain(blockchainEscrow) {
    const repository = this.getRepository();
    const existing = await this.findById(Number(blockchainEscrow.id));
    
    const statusMap = {
      0: EscrowStatus.Initialized,
      1: EscrowStatus.Funded,
      2: EscrowStatus.CourierFeePaid,
      3: EscrowStatus.AwaitingDelivery,
      4: EscrowStatus.Released
    };

    const escrowData = {
      id: Number(blockchainEscrow.id),
      buyer: blockchainEscrow.buyer,
      seller: blockchainEscrow.seller,
      orderId: Number(blockchainEscrow.orderId),
      amountWei: blockchainEscrow.amountWei.toString(),
      courierFeeWei: blockchainEscrow.courierFeeWei.toString(),
      platformFeeWei: blockchainEscrow.platformFeeWei.toString(),
      fundsSecured: blockchainEscrow.fundsSecured,
      courierFeeTransferred: blockchainEscrow.courierFeeTransferred,
      releasedToSeller: blockchainEscrow.releasedToSeller,
      status: statusMap[blockchainEscrow.status] || EscrowStatus.Initialized,
      createdAt: new Date(Number(blockchainEscrow.createdAt) * 1000),
      closedAt: blockchainEscrow.closedAt ? new Date(Number(blockchainEscrow.closedAt) * 1000) : null
    };

    if (existing) {
      return await this.update(existing.id, escrowData);
    } else {
      return await this.create(escrowData);
    }
  }
}
