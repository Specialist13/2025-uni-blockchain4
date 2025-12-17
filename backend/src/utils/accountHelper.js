import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACCOUNTS_FILE = path.resolve(__dirname, '../../../scripts/ganache-accounts.json');

async function checkAccountInGanache(address) {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const accounts = await provider.listAccounts();
    const normalizedAddress = address.toLowerCase();
    const exists = accounts.some(acc => acc.toLowerCase() === normalizedAddress);
    
    if (!exists && accounts.length > 0) {
      console.warn(`Account ${address} not found in Ganache. Ganache has ${accounts.length} accounts.`);
    }
    
    return exists;
  } catch (error) {
    console.warn('Could not check Ganache accounts:', error.message);
    return false;
  }
}

export async function getPrivateKeyForAddress(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      console.warn(`Accounts file not found: ${ACCOUNTS_FILE}`);
      const existsInGanache = await checkAccountInGanache(walletAddress);
      if (existsInGanache) {
        throw new Error(`Account ${walletAddress} exists in Ganache but accounts file is missing. Please ensure scripts/ganache-accounts.json exists with all accounts.`);
      }
      throw new Error(`Accounts file not found at ${ACCOUNTS_FILE}. Please ensure the file exists with all seller accounts.`);
    }

    const accountsData = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    
    if (!accountsData.accounts || !Array.isArray(accountsData.accounts)) {
      console.warn('Invalid accounts file format');
      throw new Error(`Invalid accounts file format in ${ACCOUNTS_FILE}. Expected an object with an 'accounts' array.`);
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const account = accountsData.accounts.find(
      acc => acc.address.toLowerCase() === normalizedAddress
    );

    if (account && account.privateKey) {
      return account.privateKey.startsWith('0x') 
        ? account.privateKey 
        : '0x' + account.privateKey;
    }

    const existsInGanache = await checkAccountInGanache(walletAddress);
    const availableAddresses = accountsData.accounts.map(acc => acc.address).join(', ');
    
    let errorMessage = `Private key not found for seller address: ${walletAddress}.\n\n`;
    if (existsInGanache) {
      errorMessage += `⚠️  This account exists in Ganache but is not in ${ACCOUNTS_FILE}.\n`;
    } else {
      errorMessage += `⚠️  This account is not found in Ganache or the accounts file.\n`;
    }
    errorMessage += `\nAvailable accounts in file (${accountsData.accounts.length}):\n`;
    accountsData.accounts.forEach((acc, idx) => {
      errorMessage += `  ${idx + 1}. ${acc.address}\n`;
    });
    errorMessage += `\nTo add the missing account:\n`;
    errorMessage += `  1. If you have the private key:\n`;
    errorMessage += `     ./scripts/add-account.sh ${walletAddress} <private_key>\n\n`;
    errorMessage += `  2. If Ganache was started with --deterministic, try:\n`;
    errorMessage += `     node scripts/find-account-private-key.js ${walletAddress}\n\n`;
    errorMessage += `  3. Or manually add to ${ACCOUNTS_FILE}:\n`;
    errorMessage += `     {"address": "${walletAddress}", "privateKey": "<private_key>"}\n\n`;
    errorMessage += `Note: You'll need to restart Ganache after adding the account.\n`;
    errorMessage += `Alternative: Recreate the product/order using an account from the list above.`;
    
    throw new Error(errorMessage);
  } catch (error) {
    if (error.message.includes('Private key not found') || error.message.includes('Accounts file not found') || error.message.includes('Invalid accounts file format')) {
      throw error;
    }
    console.error('Error reading accounts file:', error);
    throw new Error(`Failed to read accounts file: ${error.message}`);
  }
}
