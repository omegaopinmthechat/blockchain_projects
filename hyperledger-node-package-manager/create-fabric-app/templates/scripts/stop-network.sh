#!/bin/bash
set -e

echo ""
echo "   Stopping Hyperledger Fabric test network..."
echo ""

cd "$(dirname "$0")/../fabric-samples/test-network"

./network.sh down

echo ""
echo "  ✔ Network stopped and cleaned up."
echo ""