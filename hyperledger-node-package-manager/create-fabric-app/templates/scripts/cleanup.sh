#!/bin/bash
set -e

echo ""
echo "  ╔════════════════════════════════════════════╗"
echo "  ║     Hyperledger Fabric Cleanup           ║"
echo "  ╚════════════════════════════════════════════╝"
echo ""
echo "  This will remove:"
echo "  • Docker containers (Hyperledger Fabric)"
echo "  • Docker volumes"
echo "  • Docker networks"
echo "  • Optionally: Docker images (~5-7 GB)"
echo ""

read -p "  Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "  Cleanup cancelled."
    exit 0
fi

echo ""
echo "  [1/4] Stopping network..."
cd "$(dirname "$0")/../fabric-samples/test-network"
./network.sh down 2>/dev/null || true
echo "  ✔ Network stopped"

echo ""
echo "  [2/4] Removing Docker containers..."
CONTAINERS=$(docker ps -a --filter "name=hyperledger" -q 2>/dev/null || true)
if [ ! -z "$CONTAINERS" ]; then
    docker rm -f $CONTAINERS 2>/dev/null || true
    echo "  ✔ Containers removed"
else
    echo "  ↷ No containers found"
fi

echo ""
echo "  [3/4] Removing Docker volumes..."
VOLUMES=$(docker volume ls -q 2>/dev/null || true)
if [ ! -z "$VOLUMES" ]; then
    for vol in $VOLUMES; do
        docker volume rm $vol 2>/dev/null || true
    done
    echo "  ✔ Volumes removed"
else
    echo "  ↷ No volumes found"
fi

echo ""
echo "  [4/4] Removing Docker networks..."
NETWORKS=$(docker network ls --filter "name=fabric" -q 2>/dev/null || true)
if [ ! -z "$NETWORKS" ]; then
    docker network rm $NETWORKS 2>/dev/null || true
    echo "  ✔ Networks removed"
else
    echo "  ↷ No networks found"
fi

echo ""
read -p "  Remove Docker images? This will free ~5-7 GB (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  Removing Docker images..."
    IMAGES=$(docker images "hyperledger/*" -q 2>/dev/null || true)
    if [ ! -z "$IMAGES" ]; then
        docker rmi -f $IMAGES 2>/dev/null || true
        echo "  ✔ Images removed (~5-7 GB freed)"
    else
        echo "  ↷ No images found"
    fi
else
    echo "  ↷ Keeping Docker images"
fi

echo ""
echo "  ╔════════════════════════════════════════════╗"
echo "  ║   ✔  Cleanup completed!                   ║"
echo "  ╚════════════════════════════════════════════╝"
echo ""
