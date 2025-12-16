import { BlockchainService } from '../BlockchainService.js';
import { blockchainConfig } from '../../config/blockchain.js';
import { loadContractABI } from './ContractABILoader.js';

export class CourierContractService {
  static contract = null;
  static abi = null;

  static initialize() {
    if (this.contract) {
      return;
    }

    this.abi = loadContractABI('CourierContract');
    this.contract = BlockchainService.getContract(
      blockchainConfig.courierContractAddress,
      this.abi
    );
  }

  static getContract() {
    if (!this.contract) {
      this.initialize();
    }
    return this.contract;
  }

  static getReadOnlyContract() {
    if (!this.abi) {
      this.abi = loadContractABI('CourierContract');
    }
    return BlockchainService.getContractReadOnly(
      blockchainConfig.courierContractAddress,
      this.abi
    );
  }

  static async requestPickup(orderId, pickupAddress, dropoffAddress) {
    const contract = this.getContract();
    
    const pickup = {
      name: pickupAddress.name || '',
      line1: pickupAddress.line1 || '',
      line2: pickupAddress.line2 || '',
      city: pickupAddress.city || '',
      state: pickupAddress.state || '',
      postalCode: pickupAddress.postalCode || pickupAddress.zip || '',
      country: pickupAddress.country || ''
    };

    const dropoff = {
      name: dropoffAddress.name || '',
      line1: dropoffAddress.line1 || '',
      line2: dropoffAddress.line2 || '',
      city: dropoffAddress.city || '',
      state: dropoffAddress.state || '',
      postalCode: dropoffAddress.postalCode || dropoffAddress.zip || '',
      country: dropoffAddress.country || ''
    };

    return await BlockchainService.sendTransaction(
      contract,
      'requestPickup',
      null,
      orderId,
      pickup,
      dropoff
    );
  }

  static async confirmPickup(shipmentId) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'confirmPickup',
      null,
      shipmentId
    );
  }

  static async confirmDelivery(shipmentId) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'confirmDelivery',
      null,
      shipmentId
    );
  }

  static async getShipment(shipmentId) {
    const contract = this.getReadOnlyContract();
    return await contract.shipmentById(shipmentId);
  }

  static async getEvents(eventName, fromBlock = 0, toBlock = 'latest') {
    const contract = this.getReadOnlyContract();
    const filter = contract.filters[eventName]();
    return await contract.queryFilter(filter, fromBlock, toBlock);
  }
}
