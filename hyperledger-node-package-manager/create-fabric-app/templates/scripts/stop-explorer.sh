#!/bin/bash
set -e

echo "Stopping Hyperledger Explorer..."

if [ -d "fabric-samples/blockchain-explorer" ]; then
    cd fabric-samples/blockchain-explorer
    docker-compose down
    echo "Explorer stopped."
else
    echo "Explorer not found. Run 'npm run start-explorer' first to set up."
fi
