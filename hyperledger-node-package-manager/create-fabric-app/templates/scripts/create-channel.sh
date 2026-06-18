#!/bin/bash
set -e

# Default channel name is mychannel, override with: bash create-channel.sh yourchannel
CHANNEL_NAME=${1:-mychannel}

echo ""
echo "   Creating channel: $CHANNEL_NAME"
echo ""

cd "$(dirname "$0")/../fabric-samples/test-network"

./network.sh createChannel -c "$CHANNEL_NAME"

echo ""
echo "  ✔ Channel '$CHANNEL_NAME' created."
echo "  → Run: npm run deploy-chaincode"
echo ""