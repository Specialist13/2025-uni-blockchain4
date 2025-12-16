import { BlockchainService } from '../BlockchainService.js';
import { blockchainConfig } from '../../config/blockchain.js';
import { loadContractABI } from './ContractABILoader.js';

export class MarketplaceContractService {
  static contract = null;
  static abi = null;

  static initialize() {
    if (this.contract) {
      return;
    }

    this.abi = loadContractABI('MarketplaceContract');
    this.contract = BlockchainService.getContract(
      blockchainConfig.marketplaceContractAddress,
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
      this.abi = loadContractABI('MarketplaceContract');
    }
    return BlockchainService.getContractReadOnly(
      blockchainConfig.marketplaceContractAddress,
      this.abi
    );
  }

  static async addProduct(title, description, priceWei) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'addProduct',
      null,
      title,
      description,
      priceWei
    );
  }

  static async getProduct(productId) {
    const contract = this.getReadOnlyContract();
    return await contract.getProduct(productId);
  }

  static async createOrder(productId) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'createOrder',
      null,
      productId
    );
  }

  static async getOrder(orderId) {
    const contract = this.getReadOnlyContract();
    return await contract.getOrder(orderId);
  }

  static async buyAndFund(orderId, valueWei) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'buyAndFund',
      valueWei,
      orderId
    );
  }

  static async markReadyToShip(orderId, senderAddress, recipientAddress) {
    const contract = this.getContract();
    
    const sender = {
      name: senderAddress.name || '',
      line1: senderAddress.line1 || '',
      line2: senderAddress.line2 || '',
      city: senderAddress.city || '',
      state: senderAddress.state || '',
      zip: senderAddress.zip || senderAddress.postalCode || '',
      country: senderAddress.country || ''
    };

    const recipient = {
      name: recipientAddress.name || '',
      line1: recipientAddress.line1 || '',
      line2: recipientAddress.line2 || '',
      city: recipientAddress.city || '',
      state: recipientAddress.state || '',
      zip: recipientAddress.zip || recipientAddress.postalCode || '',
      country: recipientAddress.country || ''
    };

    return await BlockchainService.sendTransaction(
      contract,
      'markReadyToShip',
      null,
      orderId,
      sender,
      recipient
    );
  }

  static async confirmReceipt(orderId) {
    const contract = this.getContract();
    return await BlockchainService.sendTransaction(
      contract,
      'confirmReceipt',
      null,
      orderId
    );
  }

  static async getEvents(eventName, fromBlock = 0, toBlock = 'latest') {
    const contract = this.getReadOnlyContract();
    const filter = contract.filters[eventName]();
    return await contract.queryFilter(filter, fromBlock, toBlock);
  }
}
