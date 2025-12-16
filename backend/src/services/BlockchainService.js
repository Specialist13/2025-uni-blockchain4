import { ethers } from 'ethers';
import { blockchainConfig, validateBlockchainConfig } from '../config/blockchain.js';

export class BlockchainService {
  static provider = null;
  static signer = null;
  static initialized = false;

  static initialize() {
    if (this.initialized) {
      return;
    }

    try {
      validateBlockchainConfig();
    } catch (error) {
      console.error('Blockchain configuration validation failed:', error.message);
      throw error;
    }

    this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);

    if (blockchainConfig.privateKey) {
      this.signer = new ethers.Wallet(blockchainConfig.privateKey, this.provider);
      console.log('Blockchain service initialized with signer:', this.signer.address);
    } else {
      console.warn('No private key provided. Contract calls requiring signatures will fail.');
    }

    this.initialized = true;
  }

  static getProvider() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.provider;
  }

  static getSigner() {
    if (!this.initialized) {
      this.initialize();
    }
    if (!this.signer) {
      throw new Error('No signer configured. Set BLOCKCHAIN_PRIVATE_KEY in environment variables.');
    }
    return this.signer;
  }

  static async getContract(address, abi) {
    const signer = this.getSigner();
    return new ethers.Contract(address, abi, signer);
  }

  static async getContractReadOnly(address, abi) {
    const provider = this.getProvider();
    return new ethers.Contract(address, abi, provider);
  }

  static async estimateGas(contract, methodName, ...args) {
    try {
      const gasEstimate = await contract[methodName].estimateGas(...args);
      return gasEstimate;
    } catch (error) {
      console.error(`Gas estimation failed for ${methodName}:`, error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  static async sendTransaction(contract, methodName, value, ...args) {
    try {
      const gasEstimate = await this.estimateGas(contract, methodName, ...args);
      const gasLimit = gasEstimate + (gasEstimate / 10n);

      const txOptions = {
        gasLimit,
        ...(blockchainConfig.gasPrice && { gasPrice: blockchainConfig.gasPrice }),
      };

      if (value && value > 0n) {
        txOptions.value = value;
      }

      const tx = await contract[methodName](...args, txOptions);
      console.log(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.hash}`);
      
      return { tx, receipt };
    } catch (error) {
      console.error(`Transaction failed for ${methodName}:`, error);
      
      if (error.reason) {
        throw new Error(`Transaction failed: ${error.reason}`);
      }
      if (error.message) {
        throw new Error(`Transaction failed: ${error.message}`);
      }
      throw new Error('Transaction failed with unknown error');
    }
  }

  static parseError(error) {
    if (error.reason) {
      return error.reason;
    }
    if (error.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  static formatAddress(address) {
    try {
      return ethers.getAddress(address);
    } catch (error) {
      throw new Error(`Invalid address format: ${address}`);
    }
  }

  static parseUnits(value, unit = 'ether') {
    return ethers.parseUnits(value.toString(), unit);
  }

  static formatUnits(value, unit = 'ether') {
    return ethers.formatUnits(value, unit);
  }
}
