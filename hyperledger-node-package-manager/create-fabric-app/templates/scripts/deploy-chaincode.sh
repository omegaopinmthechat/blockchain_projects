#!/bin/bash
set -e

CHANNEL_NAME=${1:-mychannel}
CC_NAME=${2:-basic}
CC_PATH="$(dirname "$0")/../chaincode/basic"
CC_LANG="javascript"

echo ""
echo "     Deploying chaincode..."
echo "     Channel:   $CHANNEL_NAME"
echo "     Name:      $CC_NAME"
echo "     Language:  $CC_LANG"
echo ""

cd "$(dirname "$0")/../fabric-samples/test-network"

./network.sh deployCC \
  -c  "$CHANNEL_NAME" \
  -ccn "$CC_NAME" \
  -ccp "$CC_PATH" \
  -ccl "$CC_LANG"

echo ""
echo "  ✔ Chaincode '$CC_NAME' deployed to '$CHANNEL_NAME'."
echo "  → You can now run the client app: npx ts-node app/index.ts"
echo ""