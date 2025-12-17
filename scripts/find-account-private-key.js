#!/usr/bin/env node

/**
 * Script to help find private keys for accounts
 * This can derive accounts from a mnemonic if Ganache was started with --deterministic
 * 
 * Usage:
 *   node scripts/find-account-private-key.js <address> [mnemonic]
 * 
 * If mnemonic is not provided, it will try to use the default Ganache deterministic mnemonic
 */

import { ethers } from 'ethers';

const TARGET_ADDRESS = process.argv[2];
const MNEMONIC = process.argv[3] || 'myth like bonus scare over problem client lizard pioneer submit female collect';

if (!TARGET_ADDRESS) {
  console.error('Usage: node scripts/find-account-private-key.js <address> [mnemonic]');
  process.exit(1);
}

console.log(`Looking for private key for address: ${TARGET_ADDRESS}`);
console.log(`Using mnemonic: ${MNEMONIC.substring(0, 20)}...\n`);

try {
  const normalizedTarget = TARGET_ADDRESS.toLowerCase();
  
  // Try to derive accounts from mnemonic (up to 20 accounts)
  console.log('Checking first 20 accounts from mnemonic...');
  for (let i = 0; i < 20; i++) {
    const hdNode = ethers.HDNodeWallet.fromPhrase(MNEMONIC);
    const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${i}`);
    const address = wallet.address.toLowerCase();
    
    if (address === normalizedTarget) {
      console.log(`\n✅ Found matching account at index ${i}!`);
      console.log(`Address: ${wallet.address}`);
      console.log(`Private Key: ${wallet.privateKey}`);
      console.log(`\nTo add this account, run:`);
      console.log(`  ./scripts/add-account.sh ${wallet.address} ${wallet.privateKey.replace('0x', '')}`);
      process.exit(0);
    }
  }
  
  console.log('\n❌ Account not found in first 20 derived accounts.');
  console.log('\nPossible solutions:');
  console.log('1. The account was created with a different mnemonic');
  console.log('2. The account was created manually and you need to provide the private key');
  console.log('3. Ganache was started with custom accounts (not from mnemonic)');
  console.log('\nIf you have the private key, add it manually:');
  console.log(`  ./scripts/add-account.sh ${TARGET_ADDRESS} <private_key>`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
