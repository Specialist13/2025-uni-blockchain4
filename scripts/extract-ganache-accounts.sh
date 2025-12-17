#!/bin/bash

# Script to extract wallet address and private key from ganache output
# This can be used when ganache is started with --deterministic flag
# which uses a known mnemonic and generates predictable accounts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Try to extract from ganache output if it's running
GANACHE_PORT="${1:-8545}"

echo "Attempting to get accounts from Ganache at http://127.0.0.1:${GANACHE_PORT}..."

# Try using curl to call ganache's JSON-RPC endpoint
if command -v curl >/dev/null 2>&1; then
    ACCOUNTS=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' \
        http://127.0.0.1:${GANACHE_PORT} 2>/dev/null | grep -o '"result":\[.*\]' | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)
    
    if [ -n "$ACCOUNTS" ]; then
        echo "Found account: $ACCOUNTS"
        echo ""
        echo "Note: Ganache uses deterministic accounts when started with --deterministic"
        echo "The first account is typically:"
        echo "  Address: 0x627306090abaB3A6e1400e9345bC60c78a8BEf57"
        echo "  Private Key: c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
        echo ""
        echo "To use these values, run:"
        echo "  make update-env WALLET_ADDRESS=0x627306090abaB3A6e1400e9345bC60c78a8BEf57 PRIVATE_KEY=c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
        exit 0
    fi
fi

# If ganache is not responding, provide default deterministic values
echo "Ganache might not be running or not accessible."
echo ""
echo "When Ganache is started with --deterministic flag, the first account is:"
echo "  Address: 0x627306090abaB3A6e1400e9345bC60c78a8BEf57"
echo "  Private Key: c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
echo ""
echo "To start everything with these values, run:"
echo "  make start WALLET_ADDRESS=0x627306090abaB3A6e1400e9345bC60c78a8BEf57 PRIVATE_KEY=c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
