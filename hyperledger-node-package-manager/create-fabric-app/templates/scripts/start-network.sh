#!/bin/bash
set -e

echo ""
echo "   Starting Hyperledger Fabric test network..."
echo ""

cd "$(dirname "$0")/../fabric-samples/test-network"

# Tear down any previous run first
./network.sh down 2>/dev/null || true

# Start with Certificate Authorities enabled
./network.sh up -ca

echo ""
echo "  ✔ Network is up!"
echo "  → Run: npm run create-channel"
echo ""