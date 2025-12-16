import { ShipmentRepository } from '../repositories/ShipmentRepository.js';
import { CourierContractService } from './contracts/CourierContractService.js';
import { ShipmentStatus } from '../entities/Shipment.js';

export class ShipmentService {
  static async getShipment(id) {
    if (!id) {
      throw new Error('Shipment ID is required');
    }

    const shipment = await ShipmentRepository.findById(id);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return shipment;
  }

  static async getShipmentByOrderId(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const shipment = await ShipmentRepository.findByOrderId(orderId);
    if (!shipment) {
      throw new Error('Shipment not found for this order');
    }

    return shipment;
  }

  static async syncShipmentFromEvent(eventData) {
    if (!eventData) {
      throw new Error('Event data is required');
    }

    let shipmentId;
    
    if (eventData.shipmentId) {
      shipmentId = eventData.shipmentId;
    } else if (eventData.shipment && eventData.shipment.id) {
      shipmentId = eventData.shipment.id;
    } else if (eventData.args && eventData.args.shipmentId) {
      shipmentId = eventData.args.shipmentId;
    } else if (eventData.args && eventData.args.shipment && eventData.args.shipment.id) {
      shipmentId = eventData.args.shipment.id;
    } else {
      throw new Error('Event data must contain shipmentId or shipment object');
    }

    const blockchainShipment = await CourierContractService.getShipment(shipmentId);
    
    if (!blockchainShipment) {
      throw new Error('Shipment not found on blockchain');
    }

    return await ShipmentRepository.syncFromBlockchain(blockchainShipment);
  }

  static async syncShipmentFromBlockchain(shipmentId) {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const blockchainShipment = await CourierContractService.getShipment(shipmentId);
    
    if (!blockchainShipment) {
      throw new Error('Shipment not found on blockchain');
    }

    return await ShipmentRepository.syncFromBlockchain(blockchainShipment);
  }

  static async confirmPickup(shipmentId, courierAddress) {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    if (!courierAddress) {
      throw new Error('Courier address is required');
    }

    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    if (shipment.courier.toLowerCase() !== courierAddress.toLowerCase()) {
      throw new Error('Only the assigned courier can confirm pickup');
    }

    if (shipment.status !== ShipmentStatus.Assigned) {
      throw new Error(`Shipment cannot be picked up. Current status: ${shipment.status}`);
    }

    const txResult = await CourierContractService.confirmPickup(shipmentId);

    const updatedShipment = await ShipmentRepository.syncFromBlockchain(
      await CourierContractService.getShipment(shipmentId)
    );

    return {
      shipment: updatedShipment,
      transaction: txResult
    };
  }

  static async confirmDelivery(shipmentId, courierAddress) {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    if (!courierAddress) {
      throw new Error('Courier address is required');
    }

    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    if (shipment.courier.toLowerCase() !== courierAddress.toLowerCase()) {
      throw new Error('Only the assigned courier can confirm delivery');
    }

    if (shipment.status !== ShipmentStatus.InTransit) {
      throw new Error(`Shipment cannot be delivered. Current status: ${shipment.status}`);
    }

    const txResult = await CourierContractService.confirmDelivery(shipmentId);

    const updatedShipment = await ShipmentRepository.syncFromBlockchain(
      await CourierContractService.getShipment(shipmentId)
    );

    return {
      shipment: updatedShipment,
      transaction: txResult
    };
  }
}
