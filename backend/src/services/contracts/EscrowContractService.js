import { BlockchainService } from '../BlockchainService.js';
import { blockchainConfig } from '../../config/blockchain.js';
import { loadContractABI } from './ContractABILoader.js';

export class EscrowContractService {
  static contract = null;
  static abi = null;

  static initialize() {
    if (this.contract) {
      return;
    }

    this.abi = loadContractABI('EscrowContract');
    this.contract = BlockchainService.getContract(
      blockchainConfig.escrowContractAddress,
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
      this.abi = loadContractABI('EscrowContract');
    }
    return BlockchainService.getContractReadOnly(
      blockchainConfig.escrowContractAddress,
      this.abi
    );
  }

  static async fundOrder(orderId, buyer, seller, priceWei, courierFeeWei, platformFeeWei) {
    const contract = this.getContract();
    const totalValue = priceWei + courierFeeWei + platformFeeWei;
    
    return await BlockchainService.sendTransaction(
      contract,
      'fundOrder',
      totalValue,
      orderId,
      buyer,
      seller,
      priceWei,
      courierFeeWei,
      platformFeeWei
    );
  }

  static async getEscrow(escrowId) {
    const contract = this.getReadOnlyContract();
    return await contract.getEscrow(escrowId);
  }

  static async onAwaitingDelivery(escrowId) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'onAwaitingDelivery',
      null,
      escrowId
    );
  }

  static async releaseFundsToSeller(escrowId) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'releaseFundsToSeller',
      null,
      escrowId
    );
  }

  static async getEvents(eventName, fromBlock = 0, toBlock = 'latest') {
    const contract = this.getReadOnlyContract();
    const filter = contract.filters[eventName]();
    return await contract.queryFilter(filter, fromBlock, toBlock);
  }
}
