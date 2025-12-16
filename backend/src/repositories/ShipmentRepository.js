import { getRepository } from '../database/connection.js';
import { Shipment, ShipmentStatus } from '../entities/Shipment.js';

export class ShipmentRepository {
  static getRepository() {
    return getRepository(Shipment);
  }

  static async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({ 
      where: { id },
      relations: ['order', 'addresses']
    });
  }

  static async findByOrderId(orderId) {
    const repository = this.getRepository();
    return await repository.findOne({ 
      where: { orderId },
      relations: ['order', 'addresses']
    });
  }

  static async findByCourier(courierAddress) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { courier: courierAddress },
      relations: ['order']
    });
  }

  static async findAvailableForCourier() {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { status: ShipmentStatus.Assigned },
      relations: ['order', 'addresses'],
      order: { createdAt: 'DESC' }
    });
  }

  static async findByCourierAndStatus(courierAddress, status) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { 
        courier: courierAddress,
        status: status
      },
      relations: ['order', 'addresses'],
      order: { createdAt: 'DESC' }
    });
  }

  static async findAssignedToCourier(courierAddress) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { courier: courierAddress },
      relations: ['order', 'addresses'],
      order: { createdAt: 'DESC' }
    });
  }

  static async findActiveByCourier(courierAddress) {
    const repository = this.getRepository();
    return await repository.find({ 
      where: { 
        courier: courierAddress,
        status: [ShipmentStatus.Assigned, ShipmentStatus.InTransit]
      },
      relations: ['order', 'addresses'],
      order: { createdAt: 'DESC' }
    });
  }

  static async create(shipmentData) {
    const repository = this.getRepository();
    const shipment = repository.create(shipmentData);
    return await repository.save(shipment);
  }

  static async update(id, shipmentData) {
    const repository = this.getRepository();
    await repository.update(id, shipmentData);
    return await this.findById(id);
  }

  static async syncFromBlockchain(blockchainShipment) {
    const repository = this.getRepository();
    const existing = await this.findById(Number(blockchainShipment.id));
    
    const statusMap = {
      0: ShipmentStatus.Assigned,
      1: ShipmentStatus.InTransit,
      2: ShipmentStatus.Delivered
    };

    const shipmentData = {
      id: Number(blockchainShipment.id),
      orderId: Number(blockchainShipment.orderId),
      courier: blockchainShipment.courier,
      trackingNumber: blockchainShipment.trackingNumber.toString(),
      status: statusMap[blockchainShipment.status] || ShipmentStatus.Assigned,
      createdAt: new Date(Number(blockchainShipment.createdAt) * 1000),
      pickedUpAt: blockchainShipment.pickedUpAt ? new Date(Number(blockchainShipment.pickedUpAt) * 1000) : null,
      deliveredAt: blockchainShipment.deliveredAt ? new Date(Number(blockchainShipment.deliveredAt) * 1000) : null
    };

    if (existing) {
      return await this.update(existing.id, shipmentData);
    } else {
      return await this.create(shipmentData);
    }
  }
}
