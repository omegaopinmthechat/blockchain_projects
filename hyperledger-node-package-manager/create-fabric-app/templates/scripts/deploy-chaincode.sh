#!/bin/bash
set -e

CHANNEL_NAME=${1:-mychannel}
CC_NAME=${2:-basic}

echo ""
echo "     Deploying chaincode..."
echo "     Channel:   $CHANNEL_NAME"
echo "     Name:      $CC_NAME"
echo "     Language:  javascript"
echo ""

cd "$(dirname "$0")/../fabric-samples/test-network"

./network.sh deployCC \
  -c  "$CHANNEL_NAME" \
  -ccn "$CC_NAME" \
  -ccp ../../chaincode/basic \
  -ccl javascript

echo ""
echo "  ✔ Chaincode '$CC_NAME' deployed to '$CHANNEL_NAME'."
echo "  → You can now run the client app: npm run client"
echo ""