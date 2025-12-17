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

  static async confirmPickup(shipmentId, courierPrivateKey = null) {
    let contract;
    if (courierPrivateKey) {
      const courierSigner = BlockchainService.createSignerFromPrivateKey(courierPrivateKey);
      if (courierSigner) {
        contract = BlockchainService.getContract(
          blockchainConfig.courierContractAddress,
          this.abi,
          courierSigner
        );
      } else {
        contract = this.getContract();
      }
    } else {
      contract = this.getContract();
    }
    return await BlockchainService.sendTransaction(
      contract,
      'confirmPickup',
      null,
      shipmentId
    );
  }

  static async confirmDelivery(shipmentId, courierPrivateKey = null) {
    let contract;
    if (courierPrivateKey) {
      const courierSigner = BlockchainService.createSignerFromPrivateKey(courierPrivateKey);
      if (courierSigner) {
        contract = BlockchainService.getContract(
          blockchainConfig.courierContractAddress,
          this.abi,
          courierSigner
        );
      } else {
        contract = this.getContract();
      }
    } else {
      contract = this.getContract();
    }
    return await BlockchainService.sendTransaction(
      contract,
      'confirmDelivery',
      null,
      shipmentId
    );
  }

  static async getShipment(shipmentId) {
    const contract = this.getReadOnlyContract();
    
    try {
      const result = await contract.shipmentById(shipmentId);
      
      if (result && typeof result === 'object') {
        if ('id' in result && 'orderId' in result && 'courier' in result) {
          return result;
        }
        
        if (Array.isArray(result) && result.length >= 10) {
          const [
            id,
            orderId,
            courier,
            pickup,
            dropoff,
            trackingNumber,
            status,
            createdAt,
            pickedUpAt,
            deliveredAt
          ] = result;
          
          return {
            id,
            orderId,
            courier,
            pickup,
            dropoff,
            trackingNumber,
            status,
            createdAt,
            pickedUpAt,
            deliveredAt
          };
        }
      }
      
      return result;
    } catch (error) {
      if (error.message && error.message.includes('could not decode result data')) {
        const { BlockchainService } = await import('../BlockchainService.js');
        const provider = BlockchainService.getProvider();
        const iface = contract.interface;
        const functionFragment = iface.getFunction('shipmentById');
        
        const data = iface.encodeFunctionData(functionFragment, [shipmentId]);
        const rawResult = await provider.call({
          to: contract.target,
          data: data
        });
        
        const decoded = iface.decodeFunctionResult(functionFragment, rawResult);
        
        if (Array.isArray(decoded) && decoded.length >= 10) {
          const [
            id,
            orderId,
            courier,
            pickup,
            dropoff,
            trackingNumber,
            status,
            createdAt,
            pickedUpAt,
            deliveredAt
          ] = decoded;
          
          return {
            id,
            orderId,
            courier,
            pickup,
            dropoff,
            trackingNumber,
            status,
            createdAt,
            pickedUpAt,
            deliveredAt
          };
        }
        
        return decoded[0] || decoded;
      }
      
      throw error;
    }
  }

  static async addCourier(courierAddress) {
    const contract = this.getContract();
    const formattedAddress = BlockchainService.formatAddress(courierAddress);
    return await BlockchainService.sendTransaction(
      contract,
      'addCourier',
      null,
      formattedAddress
    );
  }

  static async getEvents(eventName, fromBlock = 0, toBlock = 'latest') {
    const contract = this.getReadOnlyContract();
    const filter = contract.filters[eventName]();
    return await contract.queryFilter(filter, fromBlock, toBlock);
  }
}
