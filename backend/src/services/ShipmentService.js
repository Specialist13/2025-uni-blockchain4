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

    const enableAdminBypass = process.env.ENABLE_COURIER_ADMIN_BYPASS === 'true';
    
    if (!enableAdminBypass) {
      if (shipment.courier.toLowerCase() !== courierAddress.toLowerCase()) {
        throw new Error('Only the assigned courier can confirm pickup');
      }
    }

    if (shipment.status !== ShipmentStatus.Assigned) {
      throw new Error(`Shipment cannot be picked up. Current status: ${shipment.status}`);
    }

    const blockchainShipment = await CourierContractService.getShipment(shipmentId);
    
    if (!enableAdminBypass) {
      const blockchainCourierAddress = blockchainShipment.courier?.toLowerCase();
      const providedCourierAddress = courierAddress.toLowerCase();
      
      if (blockchainCourierAddress !== providedCourierAddress) {
        throw new Error(`Courier address mismatch. Blockchain shipment has courier: ${blockchainShipment.courier}, but provided: ${courierAddress}. The transaction must be signed by the courier's account.`);
      }

      const { BlockchainService } = await import('./BlockchainService.js');
      const signer = BlockchainService.getSigner();
      const signerAddress = await signer.getAddress();
      const signerAddressLower = signerAddress.toLowerCase();
      
      if (signerAddressLower !== providedCourierAddress) {
        throw new Error(`Transaction signer mismatch. The transaction will be signed by: ${signerAddress}, but the shipment is assigned to courier: ${blockchainShipment.courier}. The transaction must be signed by the courier's account. For testing, you may need to configure the backend to use the courier's private key.`);
      }
    } else {
      console.warn('⚠️  ADMIN BYPASS ENABLED: Courier validation skipped. Ensure admin account is registered as a courier in the contract.');
    }

    const txResult = await CourierContractService.confirmPickup(shipmentId);

    let updatedBlockchainShipment;
    let retries = 3;
    while (retries > 0) {
      updatedBlockchainShipment = await CourierContractService.getShipment(shipmentId);
      if (updatedBlockchainShipment && Number(updatedBlockchainShipment.status) === 1) {
        break;
      }
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const updatedShipment = await ShipmentRepository.syncFromBlockchain(
      updatedBlockchainShipment || await CourierContractService.getShipment(shipmentId)
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

    const enableAdminBypass = process.env.ENABLE_COURIER_ADMIN_BYPASS === 'true';
    
    if (!enableAdminBypass) {
      if (shipment.courier.toLowerCase() !== courierAddress.toLowerCase()) {
        throw new Error('Only the assigned courier can confirm delivery');
      }
    }

    const blockchainShipment = await CourierContractService.getShipment(shipmentId);
    
    const blockchainStatus = blockchainShipment.status;
    const blockchainStatusMap = {
      0: ShipmentStatus.Assigned,
      1: ShipmentStatus.InTransit,
      2: ShipmentStatus.Delivered
    };
    const currentBlockchainStatus = blockchainStatusMap[Number(blockchainStatus)] || shipment.status;
    
    if (shipment.status !== ShipmentStatus.InTransit && currentBlockchainStatus !== ShipmentStatus.InTransit) {
      throw new Error(`Shipment cannot be delivered. Current status: ${shipment.status} (blockchain: ${currentBlockchainStatus})`);
    }
    
    if (shipment.status !== ShipmentStatus.InTransit && currentBlockchainStatus === ShipmentStatus.InTransit) {
      await ShipmentRepository.syncFromBlockchain(blockchainShipment);
    }
    
    if (!enableAdminBypass) {
      const blockchainCourierAddress = blockchainShipment.courier?.toLowerCase();
      const providedCourierAddress = courierAddress.toLowerCase();
      
      if (blockchainCourierAddress !== providedCourierAddress) {
        throw new Error(`Courier address mismatch. Blockchain shipment has courier: ${blockchainShipment.courier}, but provided: ${courierAddress}. The transaction must be signed by the courier's account.`);
      }
    } else {
      console.warn('⚠️  ADMIN BYPASS ENABLED: Courier validation skipped. Ensure admin account is registered as a courier in the contract.');
    }

    const txResult = await CourierContractService.confirmDelivery(shipmentId);

    let updatedBlockchainShipment;
    let retries = 3;
    while (retries > 0) {
      updatedBlockchainShipment = await CourierContractService.getShipment(shipmentId);
      if (updatedBlockchainShipment && Number(updatedBlockchainShipment.status) === 2) {
        break;
      }
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const updatedShipment = await ShipmentRepository.syncFromBlockchain(
      updatedBlockchainShipment || await CourierContractService.getShipment(shipmentId)
    );

    return {
      shipment: updatedShipment,
      transaction: txResult
    };
  }

  static async listAvailableShipments() {
    const shipments = await ShipmentRepository.findAvailableForCourier();
    
    const syncedShipments = [];
    for (const shipment of shipments) {
      try {
        const syncedShipment = await this.syncShipmentFromBlockchain(shipment.id);
        if (syncedShipment.status === ShipmentStatus.Assigned) {
          syncedShipments.push(syncedShipment);
        }
      } catch (error) {
        console.warn(`Failed to sync shipment ${shipment.id} from blockchain:`, error.message);
        if (shipment.status === ShipmentStatus.Assigned) {
          syncedShipments.push(shipment);
        }
      }
    }
    
    return syncedShipments;
  }

  static async listCourierShipments(courierAddress, options = {}) {
    if (!courierAddress) {
      throw new Error('Courier address is required');
    }

    const { status, activeOnly } = options;

    let shipments;
    if (activeOnly) {
      shipments = await ShipmentRepository.findActiveByCourier(courierAddress);
    } else if (status) {
      shipments = await ShipmentRepository.findByCourierAndStatus(courierAddress, status);
    } else {
      shipments = await ShipmentRepository.findAssignedToCourier(courierAddress);
    }

    for (const shipment of shipments) {
      try {
        await this.syncShipmentFromBlockchain(shipment.id);
      } catch (error) {
        console.warn(`Failed to sync shipment ${shipment.id} from blockchain:`, error.message);
      }
    }

    if (activeOnly) {
      return await ShipmentRepository.findActiveByCourier(courierAddress);
    }

    if (status) {
      return await ShipmentRepository.findByCourierAndStatus(courierAddress, status);
    }

    return await ShipmentRepository.findAssignedToCourier(courierAddress);
  }

  static async getCourierDashboard(courierAddress) {
    if (!courierAddress) {
      throw new Error('Courier address is required');
    }

    const allShipments = await ShipmentRepository.findAssignedToCourier(courierAddress);
    
    for (const shipment of allShipments) {
      try {
        await this.syncShipmentFromBlockchain(shipment.id);
      } catch (error) {
        console.warn(`Failed to sync shipment ${shipment.id} from blockchain:`, error.message);
      }
    }

    const syncedAllShipments = await ShipmentRepository.findAssignedToCourier(courierAddress);
    const activeShipments = await ShipmentRepository.findActiveByCourier(courierAddress);
    const assignedShipments = await ShipmentRepository.findByCourierAndStatus(courierAddress, ShipmentStatus.Assigned);
    const inTransitShipments = await ShipmentRepository.findByCourierAndStatus(courierAddress, ShipmentStatus.InTransit);
    const deliveredShipments = await ShipmentRepository.findByCourierAndStatus(courierAddress, ShipmentStatus.Delivered);

    return {
      stats: {
        total: syncedAllShipments.length,
        active: activeShipments.length,
        assigned: assignedShipments.length,
        inTransit: inTransitShipments.length,
        delivered: deliveredShipments.length
      },
      activeShipments,
      recentShipments: syncedAllShipments.slice(0, 10)
    };
  }
}
