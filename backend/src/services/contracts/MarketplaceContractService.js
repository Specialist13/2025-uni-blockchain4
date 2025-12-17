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

  static async addProduct(title, description, priceWei, sellerAddress = null) {
    const contract = this.getContract();
    
    if (sellerAddress) {
      const formattedSellerAddress = BlockchainService.formatAddress(sellerAddress);
      return await BlockchainService.sendTransaction(
        contract,
        'addProductForSeller',
        null,
        formattedSellerAddress,
        title,
        description,
        priceWei
      );
    } else {
      return await BlockchainService.sendTransaction(
        contract,
        'addProduct',
        null,
        title,
        description,
        priceWei
      );
    }
  }

  static async getProduct(productId) {
    const contract = this.getReadOnlyContract();
    return await contract.getProduct(productId);
  }

  static async getNextProductId() {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.nextProductId();
    } catch (error) {
      console.warn('Could not get nextProductId:', error.message);
      return null;
    }
  }

  static async createOrder(productId, buyerAddress) {
    const contract = this.getContract();
    const formattedAddress = BlockchainService.formatAddress(buyerAddress);
    
    console.log(`Creating order - productId: ${productId} (type: ${typeof productId}), buyerAddress: ${formattedAddress}`);
    
    const product = await this.getProduct(productId);
    console.log(`Product verification - id: ${product.id}, isActive: ${product.isActive}, seller: ${product.seller}`);
    
    if (Number(product.id) === 0) {
      throw new Error('Product does not exist on blockchain');
    }
    if (!product.isActive) {
      throw new Error('Product is not active on blockchain');
    }
    if (product.seller.toLowerCase() === formattedAddress.toLowerCase()) {
      throw new Error('Buyer cannot purchase their own product');
    }
    if (formattedAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Buyer address cannot be zero');
    }
    
    try {
      const signer = BlockchainService.getSigner();
      const signerAddress = await signer.getAddress();
      console.log(`Transaction will be sent from: ${signerAddress}`);
    } catch (error) {
      console.warn('Could not get signer address:', error.message);
    }
    
    const productIdNum = typeof productId === 'bigint' ? productId : BigInt(productId);
    console.log(`Calling createOrder with productId: ${productIdNum}, buyer: ${formattedAddress}`);
    
    return await BlockchainService.sendTransaction(
      contract,
      'createOrder',
      null,
      productIdNum,
      formattedAddress
    );
  }

  static async getOrder(orderId) {
    const contract = this.getReadOnlyContract();
    return await contract.getOrder(orderId);
  }

  static async buyAndFund(orderId, valueWei, buyerPrivateKey = null) {
    let contract;
    if (buyerPrivateKey) {
      const buyerSigner = BlockchainService.createSignerFromPrivateKey(buyerPrivateKey);
      if (buyerSigner) {
        contract = BlockchainService.getContract(
          blockchainConfig.marketplaceContractAddress,
          this.abi,
          buyerSigner
        );
      } else {
        contract = this.getContract();
      }
    } else {
      contract = this.getContract();
    }
    return await BlockchainService.sendTransaction(
      contract,
      'buyAndFund',
      valueWei,
      orderId
    );
  }

  static async markReadyToShip(orderId, senderAddress, recipientAddress, sellerPrivateKey = null) {
    let contract;
    if (sellerPrivateKey) {
      const sellerSigner = BlockchainService.createSignerFromPrivateKey(sellerPrivateKey);
      if (sellerSigner) {
        if (!this.abi) {
          this.abi = loadContractABI('MarketplaceContract');
        }
        contract = BlockchainService.getContract(
          blockchainConfig.marketplaceContractAddress,
          this.abi,
          sellerSigner
        );
      } else {
        contract = this.getContract();
      }
    } else {
      contract = this.getContract();
    }
    
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

  static async confirmReceipt(orderId, buyerPrivateKey = null) {
    let contract;
    if (buyerPrivateKey) {
      const buyerSigner = BlockchainService.createSignerFromPrivateKey(buyerPrivateKey);
      if (buyerSigner) {
        contract = BlockchainService.getContract(
          blockchainConfig.marketplaceContractAddress,
          this.abi,
          buyerSigner
        );
      } else {
        contract = this.getContract();
      }
    } else {
      contract = this.getContract();
    }
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
