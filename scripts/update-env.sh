#!/bin/bash

# Script to update .env files with wallet address and private key from ganache-accounts.json
# Usage: ./update-env.sh [ganache_port] [backend_port]

set -e

GANACHE_PORT="${1:-8545}"
BACKEND_PORT="${2:-3001}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ACCOUNTS_FILE="$SCRIPT_DIR/ganache-accounts.json"
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
FRONTEND_ENV="$PROJECT_ROOT/frontend/.env"

if [ ! -f "$ACCOUNTS_FILE" ]; then
    echo "Error: Accounts file not found: $ACCOUNTS_FILE"
    exit 1
fi

# Check if Node.js is available for parsing JSON
if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is required to parse accounts file"
    exit 1
fi

# Get first account from JSON file
FIRST_ACCOUNT=$(node -e "
const fs = require('fs');
const accounts = JSON.parse(fs.readFileSync('$ACCOUNTS_FILE', 'utf8'));
if (accounts.accounts && accounts.accounts.length > 0) {
    const acc = accounts.accounts[0];
    console.log(JSON.stringify({address: acc.address, privateKey: acc.privateKey}));
} else {
    console.error('No accounts found in file');
    process.exit(1);
}
")

if [ -z "$FIRST_ACCOUNT" ]; then
    echo "Error: Failed to read accounts from $ACCOUNTS_FILE"
    exit 1
fi

WALLET_ADDRESS=$(echo "$FIRST_ACCOUNT" | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.address);")
PRIVATE_KEY=$(echo "$FIRST_ACCOUNT" | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.privateKey);")

# Remove 0x prefix from private key if present
PRIVATE_KEY_CLEAN=$(echo "$PRIVATE_KEY" | sed 's/^0x//')

# Create backend .env from .env.example if it doesn't exist
if [ ! -f "$BACKEND_ENV" ]; then
    if [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
        cp "$PROJECT_ROOT/backend/.env.example" "$BACKEND_ENV"
    else
        echo "Error: backend/.env.example not found"
        exit 1
    fi
fi

# Create frontend .env from .env.example if it doesn't exist
if [ ! -f "$FRONTEND_ENV" ]; then
    if [ -f "$PROJECT_ROOT/frontend/.env.example" ]; then
        cp "$PROJECT_ROOT/frontend/.env.example" "$FRONTEND_ENV"
    else
        echo "Error: frontend/.env.example not found"
        exit 1
    fi
fi

# Update backend .env - only update required dynamic values
echo "Updating backend/.env (preserving constants)..."

# Update BLOCKCHAIN_RPC_URL (dynamic - depends on ganache port)
if grep -q "^BLOCKCHAIN_RPC_URL=" "$BACKEND_ENV"; then
    sed -i.bak "s|^BLOCKCHAIN_RPC_URL=.*|BLOCKCHAIN_RPC_URL=http://127.0.0.1:${GANACHE_PORT}|" "$BACKEND_ENV"
else
    echo "BLOCKCHAIN_RPC_URL=http://127.0.0.1:${GANACHE_PORT}" >> "$BACKEND_ENV"
fi

# Update BLOCKCHAIN_PRIVATE_KEY (dynamic - must be set)
if grep -q "^BLOCKCHAIN_PRIVATE_KEY=" "$BACKEND_ENV"; then
    sed -i.bak "s|^BLOCKCHAIN_PRIVATE_KEY=.*|BLOCKCHAIN_PRIVATE_KEY=${PRIVATE_KEY_CLEAN}|" "$BACKEND_ENV"
else
    echo "BLOCKCHAIN_PRIVATE_KEY=${PRIVATE_KEY_CLEAN}" >> "$BACKEND_ENV"
fi

# Note: Contract addresses (MARKETPLACE_CONTRACT_ADDRESS, ESCROW_CONTRACT_ADDRESS, COURIER_CONTRACT_ADDRESS)
# are constants and should be set manually or via deployment scripts - not overwritten here

# Update frontend .env - only update required dynamic values
echo "Updating frontend/.env (preserving constants)..."

# Update VITE_RPC_URL (dynamic - depends on ganache port)
if grep -q "^VITE_RPC_URL=" "$FRONTEND_ENV"; then
    sed -i.bak "s|^VITE_RPC_URL=.*|VITE_RPC_URL=http://127.0.0.1:${GANACHE_PORT}|" "$FRONTEND_ENV"
else
    echo "VITE_RPC_URL=http://127.0.0.1:${GANACHE_PORT}" >> "$FRONTEND_ENV"
fi

# Update VITE_API_URL (dynamic - depends on backend port)
if grep -q "^VITE_API_URL=" "$FRONTEND_ENV"; then
    sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://localhost:${BACKEND_PORT}|" "$FRONTEND_ENV"
else
    echo "VITE_API_URL=http://localhost:${BACKEND_PORT}" >> "$FRONTEND_ENV"
fi

# Note: Contract addresses (VITE_MARKETPLACE_CONTRACT_ADDRESS, VITE_ESCROW_CONTRACT_ADDRESS, VITE_COURIER_CONTRACT_ADDRESS)
# are constants and should be set manually or via deployment scripts - not overwritten here

# Clean up backup files
rm -f "$BACKEND_ENV.bak" "$FRONTEND_ENV.bak"

echo "Environment files updated successfully!"
echo "  Backend:  $BACKEND_ENV"
echo "  Frontend: $FRONTEND_ENV"
echo ""
echo "Using first account from ganache-accounts.json:"
echo "  Wallet Address: $WALLET_ADDRESS"
echo "  Private Key: ${PRIVATE_KEY_CLEAN:0:8}...${PRIVATE_KEY_CLEAN: -8}"
echo "  RPC URL: http://127.0.0.1:${GANACHE_PORT}"
