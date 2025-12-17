#!/bin/bash

# Script to start Ganache with predefined accounts from ganache-accounts.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ACCOUNTS_FILE="$SCRIPT_DIR/ganache-accounts.json"
GANACHE_PORT="${1:-8545}"

if [ ! -f "$ACCOUNTS_FILE" ]; then
    echo "Error: Accounts file not found: $ACCOUNTS_FILE"
    exit 1
fi

# Check if Node.js is available for parsing JSON
if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is required to parse accounts file"
    exit 1
fi

# Build ganache command with accounts
GANACHE_CMD="ganache --port $GANACHE_PORT --host 127.0.0.1"

# Read accounts from JSON and add them to ganache command
# Each account gets 1000 ETH (1000 * 10^18 wei)
# Private keys must be prefixed with 0x for Ganache
ACCOUNTS=$(node -e "
const fs = require('fs');
const accounts = JSON.parse(fs.readFileSync('$ACCOUNTS_FILE', 'utf8'));
const accountArgs = accounts.accounts.map(acc => {
    const privateKey = acc.privateKey.startsWith('0x') ? acc.privateKey : '0x' + acc.privateKey;
    return \`--account=\${privateKey},1000000000000000000000\`;
}).join(' ');
console.log(accountArgs);
")

if [ -z "$ACCOUNTS" ]; then
    echo "Error: Failed to parse accounts from $ACCOUNTS_FILE"
    exit 1
fi

# Start ganache with the accounts
FULL_CMD="$GANACHE_CMD $ACCOUNTS"

echo "Starting Ganache on port $GANACHE_PORT with 10 predefined accounts..."

if command -v ganache >/dev/null 2>&1; then
    eval "$FULL_CMD" &
    echo $! > "$PROJECT_ROOT/.ganache.pid"
    echo "Ganache started (PID: $(cat $PROJECT_ROOT/.ganache.pid))"
    sleep 3
elif command -v npx >/dev/null 2>&1; then
    eval "npx $FULL_CMD" &
    echo $! > "$PROJECT_ROOT/.ganache.pid"
    echo "Ganache started (PID: $(cat $PROJECT_ROOT/.ganache.pid))"
    sleep 3
else
    echo "Error: ganache not found. Install with: npm install -g ganache"
    echo "Or install locally: npm install"
    exit 1
fi
