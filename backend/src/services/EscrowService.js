import { EscrowRepository } from '../repositories/EscrowRepository.js';
import { EscrowContractService } from './contracts/EscrowContractService.js';
import { EscrowStatus } from '../entities/Escrow.js';

export class EscrowService {
  static async getEscrow(id) {
    if (!id) {
      throw new Error('Escrow ID is required');
    }

    const escrow = await EscrowRepository.findById(id);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow;
  }

  static async getEscrowByOrderId(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const escrow = await EscrowRepository.findByOrderId(orderId);
    if (!escrow) {
      throw new Error('Escrow not found for this order');
    }

    return escrow;
  }

  static async syncEscrowFromEvent(eventData) {
    if (!eventData || !eventData.escrowId) {
      throw new Error('Event data with escrowId is required');
    }

    const { escrowId } = eventData;
    const blockchainEscrow = await EscrowContractService.getEscrow(escrowId);
    
    if (!blockchainEscrow) {
      throw new Error('Escrow not found on blockchain');
    }

    return await EscrowRepository.syncFromBlockchain(blockchainEscrow);
  }

  static async syncEscrowFromBlockchain(escrowId) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    const blockchainEscrow = await EscrowContractService.getEscrow(escrowId);
    
    if (!blockchainEscrow) {
      throw new Error('Escrow not found on blockchain');
    }

    return await EscrowRepository.syncFromBlockchain(blockchainEscrow);
  }

  static determineStatusFromContractState(blockchainEscrow) {
    if (!blockchainEscrow) {
      return EscrowStatus.Initialized;
    }

    if (blockchainEscrow.releasedToSeller) {
      return EscrowStatus.Released;
    }

    if (blockchainEscrow.courierFeeTransferred && blockchainEscrow.fundsSecured) {
      return EscrowStatus.AwaitingDelivery;
    }

    if (blockchainEscrow.courierFeeTransferred) {
      return EscrowStatus.CourierFeePaid;
    }

    if (blockchainEscrow.fundsSecured) {
      return EscrowStatus.Funded;
    }

    return EscrowStatus.Initialized;
  }

  static async syncEscrowStatus(escrowId) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    const blockchainEscrow = await EscrowContractService.getEscrow(escrowId);
    
    if (!blockchainEscrow) {
      throw new Error('Escrow not found on blockchain');
    }

    const status = this.determineStatusFromContractState(blockchainEscrow);
    
    const existingEscrow = await EscrowRepository.findById(Number(escrowId));
    if (!existingEscrow) {
      return await EscrowRepository.syncFromBlockchain(blockchainEscrow);
    }

    const updateData = {
      fundsSecured: blockchainEscrow.fundsSecured,
      courierFeeTransferred: blockchainEscrow.courierFeeTransferred,
      releasedToSeller: blockchainEscrow.releasedToSeller,
      status,
      closedAt: blockchainEscrow.closedAt ? new Date(Number(blockchainEscrow.closedAt) * 1000) : null
    };

    return await EscrowRepository.update(existingEscrow.id, updateData);
  }
}
