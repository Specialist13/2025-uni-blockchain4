import dotenv from 'dotenv';

dotenv.config();

export const blockchainConfig = {
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:9545',
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  marketplaceContractAddress: process.env.MARKETPLACE_CONTRACT_ADDRESS || '',
  escrowContractAddress: process.env.ESCROW_CONTRACT_ADDRESS || '',
  courierContractAddress: process.env.COURIER_CONTRACT_ADDRESS || '',
  networkId: process.env.NETWORK_ID || '*',
  gasLimit: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 5000000,
  gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : undefined,
};

export function validateBlockchainConfig() {
  const errors = [];

  if (!blockchainConfig.rpcUrl) {
    errors.push('BLOCKCHAIN_RPC_URL is required');
  }

  if (!blockchainConfig.marketplaceContractAddress) {
    errors.push('MARKETPLACE_CONTRACT_ADDRESS is required');
  }

  if (!blockchainConfig.escrowContractAddress) {
    errors.push('ESCROW_CONTRACT_ADDRESS is required');
  }

  if (!blockchainConfig.courierContractAddress) {
    errors.push('COURIER_CONTRACT_ADDRESS is required');
  }

  if (errors.length > 0) {
    throw new Error(`Blockchain configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}
