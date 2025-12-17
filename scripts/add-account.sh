#!/bin/bash

# Script to add an account to ganache-accounts.json
# Usage: ./scripts/add-account.sh <address> <private_key>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACCOUNTS_FILE="$SCRIPT_DIR/ganache-accounts.json"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <address> <private_key>"
    echo ""
    echo "Example:"
    echo "  $0 0x0F4F2Ac550A1b4e2280d04c21cEa7EBD822934b5 aa3680d5d48a8283413f7a108367c7299ca73f553735860a87b08f39395618b7"
    exit 1
fi

ADDRESS="$1"
PRIVATE_KEY="$2"

# Remove 0x prefix from private key if present
PRIVATE_KEY=$(echo "$PRIVATE_KEY" | sed 's/^0x//')

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is required to update accounts file"
    exit 1
fi

# Use Node.js to add the account
node -e "
const fs = require('fs');
const accountsFile = '$ACCOUNTS_FILE';

let accountsData;
try {
    accountsData = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
} catch (error) {
    accountsData = { accounts: [] };
}

if (!accountsData.accounts) {
    accountsData.accounts = [];
}

const address = '$ADDRESS';
const privateKey = '$PRIVATE_KEY';

// Check if account already exists
const existingIndex = accountsData.accounts.findIndex(
    acc => acc.address.toLowerCase() === address.toLowerCase()
);

const accountData = {
    address: address,
    privateKey: privateKey
};

if (existingIndex >= 0) {
    console.log('Updating existing account:', address);
    accountsData.accounts[existingIndex] = accountData;
} else {
    console.log('Adding new account:', address);
    accountsData.accounts.push(accountData);
}

fs.writeFileSync(accountsFile, JSON.stringify(accountsData, null, 2) + '\n');
console.log('Account added/updated successfully!');
console.log('Total accounts:', accountsData.accounts.length);
"

echo ""
echo "Account added to $ACCOUNTS_FILE"
echo "Note: You may need to restart Ganache for the changes to take effect"
