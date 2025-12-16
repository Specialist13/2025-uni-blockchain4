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

  static getContract(address, abi, customSigner = null) {
    const signer = customSigner || this.getSigner();
    return new ethers.Contract(address, abi, signer);
  }

  static createSignerFromPrivateKey(privateKey) {
    if (!privateKey) {
      return null;
    }
    const provider = this.getProvider();
    return new ethers.Wallet(privateKey, provider);
  }

  static getContractReadOnly(address, abi) {
    const provider = this.getProvider();
    return new ethers.Contract(address, abi, provider);
  }

  static async estimateGas(contract, methodName, value, ...args) {
    try {
      const options = value && value > 0n ? { value } : {};
      const gasEstimate = await contract[methodName].estimateGas(...args, options);
      return gasEstimate;
    } catch (error) {
      console.error(`Gas estimation failed for ${methodName}:`, error);
      console.error(`Error details:`, JSON.stringify({
        code: error.code,
        message: error.message,
        reason: error.reason,
        shortMessage: error.shortMessage,
        data: error.data,
        info: error.info
      }, null, 2));
      
      if (error.code === 'UNSUPPORTED_OPERATION' || error.message?.includes('no matching fragment')) {
        const argsStr = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg);
          }
          return String(arg);
        }).join(', ');
        
        throw new Error(`Contract function signature mismatch for ${methodName}(${argsStr}). The deployed contract may not have the updated function signature. Please redeploy the contract with the latest changes. If you recently changed the function parameters, the contract must be recompiled and redeployed.`);
      }
      
      if (error.message?.includes('missing revert data') || error.data === null || error.code === 'CALL_EXCEPTION' || error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        let revertReason = null;
        
        try {
          const staticCallOptions = value && value > 0n ? { value } : {};
          await contract[methodName].staticCall(...args, staticCallOptions);
        } catch (staticCallError) {
          console.error(`Static call error for ${methodName}:`, staticCallError);
          
          if (staticCallError.reason) {
            revertReason = staticCallError.reason;
          } else if (staticCallError.shortMessage) {
            revertReason = staticCallError.shortMessage;
          } else if (staticCallError.data) {
            try {
              const decoded = contract.interface.parseError(staticCallError.data);
              if (decoded) {
                revertReason = decoded.name;
              }
            } catch (parseError) {
              try {
                const errorFragment = contract.interface.getError(staticCallError.data.slice(0, 10));
                if (errorFragment) {
                  revertReason = errorFragment.name;
                }
              } catch (parseError2) {
                if (staticCallError.message && !staticCallError.message.includes('missing revert data')) {
                  const msgMatch = staticCallError.message.match(/revert\s+(.+?)(?:\s*\(|$)/i);
                  if (msgMatch) {
                    revertReason = msgMatch[1].trim();
                  } else {
                    revertReason = staticCallError.message;
                  }
                }
              }
            }
          } else if (staticCallError.info?.error?.message) {
            const ganacheError = staticCallError.info.error.message;
            if (ganacheError && ganacheError !== 'VM Exception while processing transaction: revert') {
              revertReason = ganacheError.replace(/^VM Exception while processing transaction: revert\s*/i, '');
            }
          } else if (staticCallError.message) {
            const errorMsg = staticCallError.message;
            if (errorMsg.includes('revert') && !errorMsg.includes('missing revert data')) {
              const match = errorMsg.match(/revert\s+(.+?)(?:\s*\(|$)/i);
              if (match) {
                revertReason = match[1].trim();
              } else {
                revertReason = errorMsg;
              }
            }
          }
        }
        
        if (error.info?.error?.message && !revertReason) {
          const ganacheError = error.info.error.message;
          if (ganacheError && ganacheError !== 'VM Exception while processing transaction: revert') {
            revertReason = ganacheError.replace(/^VM Exception while processing transaction: revert\s*/i, '');
          }
        }
        
        if (error.reason && !revertReason) {
          revertReason = error.reason;
        }
        
        if (error.shortMessage && !revertReason) {
          revertReason = error.shortMessage;
        }
        
        if (revertReason && revertReason !== 'require(false)' && revertReason.trim() !== '') {
          throw new Error(`Transaction would revert: ${revertReason}`);
        }
        
        const argsStr = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg);
          }
          return String(arg);
        }).join(', ');
        
        let helpfulMessage = `Transaction would revert for ${methodName}(${argsStr}). `;
        
        if (error.code === 'CALL_EXCEPTION' && error.data === null && !revertReason) {
          helpfulMessage += `The contract function signature may not match the deployed contract. `;
          helpfulMessage += `If you recently changed ${methodName} function parameters (e.g., changed createOrder(uint256) to createOrder(uint256, address)), `;
          helpfulMessage += `you MUST redeploy the contract. The deployed contract still has the old signature. `;
        }
        
        helpfulMessage += `This usually means: 1) The contract function signature doesn't match (contract may need redeployment), 2) A require() statement failed (e.g., product doesn't exist, product is not active, buyer is the seller), or 3) The contract state is invalid. `;
        helpfulMessage += `Since Ganache is not providing the revert reason, please verify the contract state matches your expectations. Original error: ${error.message}`;
        throw new Error(helpfulMessage);
      }
      
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  static async sendTransaction(contract, methodName, value, ...args) {
    const maxRetries = parseInt(process.env.TRANSACTION_MAX_RETRIES || '3');
    const retryDelay = parseInt(process.env.TRANSACTION_RETRY_DELAY_MS || '1000');

    const valueBigInt = value ? (typeof value === 'string' ? BigInt(value) : BigInt(value)) : 0n;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const gasEstimate = await this.estimateGas(contract, methodName, valueBigInt, ...args);
        const gasLimit = gasEstimate + (gasEstimate / 10n);

        const txOptions = {
          gasLimit,
          ...(blockchainConfig.gasPrice && { gasPrice: blockchainConfig.gasPrice }),
        };

        if (valueBigInt > 0n) {
          txOptions.value = valueBigInt;
        }

        const tx = await contract[methodName](...args, txOptions);
        console.log(`Transaction sent: ${tx.hash} (attempt ${attempt}/${maxRetries})`);
        
        const receipt = await tx.wait();
        
        if (receipt.status === 0) {
          throw new Error(`Transaction reverted: ${tx.hash}`);
        }
        
        console.log(`Transaction confirmed: ${receipt.hash}`);
        return { tx, receipt };
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryableError = this.isRetryableError(error);
        
        console.error(`Transaction failed for ${methodName} (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (!isRetryableError || isLastAttempt) {
          if (error.reason) {
            throw new Error(`Transaction failed: ${error.reason}`);
          }
          if (error.message) {
            throw new Error(`Transaction failed: ${error.message}`);
          }
          throw new Error('Transaction failed with unknown error');
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  static isRetryableError(error) {
    if (!error || !error.message) {
      return false;
    }

    const retryablePatterns = [
      'network',
      'timeout',
      'ECONNRESET',
      'ETIMEDOUT',
      'nonce',
      'replacement transaction',
      'already known'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
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
