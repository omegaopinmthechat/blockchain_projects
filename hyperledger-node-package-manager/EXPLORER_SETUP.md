# Hyperledger Explorer Setup Guide

Hyperledger Explorer is a blockchain dashboard that provides:
- View blocks and transactions
- Search by block, transaction, or address
- View chaincode details
- Network status and metrics
- Beautiful web interface

---

## Quick Setup

### Option 1: Docker Compose (Easiest)

**Step 1: Download Explorer**

```bash
cd fabric-samples
git clone https://github.com/hyperledger/blockchain-explorer.git
cd blockchain-explorer
```

**Step 2: Configure Explorer**

Create `docker-compose.yaml`:

```yaml
version: '2.1'

networks:
  fabric_test:
    external: true

services:
  explorerdb.mynetwork.com:
    image: hyperledger/explorer-db:latest
    container_name: explorerdb.mynetwork.com
    hostname: explorerdb.mynetwork.com
    environment:
      - DATABASE_DATABASE=fabricexplorer
      - DATABASE_USERNAME=hppoc
      - DATABASE_PASSWORD=password
    healthcheck:
      test: "pg_isready -h localhost -p 5432 -q -U postgres"
      interval: 30s
      timeout: 10s
      retries: 5
    volumes:
      - ./persistence:/var/lib/postgresql/data
    networks:
      - fabric_test

  explorer.mynetwork.com:
    image: hyperledger/explorer:latest
    container_name: explorer.mynetwork.com
    hostname: explorer.mynetwork.com
    environment:
      - DATABASE_HOST=explorerdb.mynetwork.com
      - DATABASE_DATABASE=fabricexplorer
      - DATABASE_USERNAME=hppoc
      - DATABASE_PASSWORD=password
      - LOG_LEVEL_APP=info
      - LOG_LEVEL_DB=info
      - LOG_LEVEL_CONSOLE=debug
      - LOG_CONSOLE_STDOUT=true
      - DISCOVERY_AS_LOCALHOST=false
    volumes:
      - ./config.json:/opt/explorer/app/platform/fabric/config.json
      - ./connection-profile:/opt/explorer/app/platform/fabric/connection-profile
      - ../test-network/organizations:/tmp/organizations
    ports:
      - 8080:8080
    depends_on:
      explorerdb.mynetwork.com:
        condition: service_healthy
    networks:
      - fabric_test
```

**Step 3: Create Configuration**

Create `config.json`:

```json
{
  "network-configs": {
    "test-network": {
      "name": "Test Network",
      "profile": "./connection-profile/test-network.json"
    }
  },
  "license": "Apache-2.0"
}
```

**Step 4: Create Connection Profile**

Create `connection-profile/test-network.json`:

```json
{
  "name": "test-network",
  "version": "1.0.0",
  "client": {
    "tlsEnable": true,
    "adminUser": "admin",
    "adminPassword": "adminpw",
    "enableAuthentication": false,
    "organization": "Org1MSP",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        },
        "orderer": "300"
      }
    }
  },
  "channels": {
    "mychannel": {
      "peers": {
        "peer0.org1.example.com": {}
      }
    }
  },
  "organizations": {
    "Org1MSP": {
      "mspid": "Org1MSP",
      "adminPrivateKey": {
        "path": "/tmp/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
      },
      "peers": ["peer0.org1.example.com"],
      "signedCert": {
        "path": "/tmp/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem"
      }
    }
  },
  "peers": {
    "peer0.org1.example.com": {
      "tlsCACerts": {
        "path": "/tmp/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
      },
      "url": "grpcs://peer0.org1.example.com:7051"
    }
  }
}
```

**Step 5: Start Explorer**

```bash
docker-compose up -d
```

**Step 6: Access Explorer**

Open browser: **http://localhost:8080**

Default credentials: (if authentication enabled)
- Username: `exploreradmin`
- Password: `exploreradminpw`

---

## Option 2: Automated Script (Recommended)

I'll create a script that does everything automatically.

Create `scripts/start-explorer.sh`:

```bash
#!/bin/bash
set -e

echo "Setting up Hyperledger Explorer..."

EXPLORER_DIR="./fabric-samples/blockchain-explorer"

# Check if explorer already exists
if [ ! -d "$EXPLORER_DIR" ]; then
    echo "Downloading Hyperledger Explorer..."
    cd fabric-samples
    git clone https://github.com/hyperledger/blockchain-explorer.git
    cd ..
fi

cd "$EXPLORER_DIR"

# Create docker-compose.yaml
cat > docker-compose.yaml << 'EOF'
version: '2.1'

networks:
  fabric_test:
    external: true

services:
  explorerdb.mynetwork.com:
    image: hyperledger/explorer-db:latest
    container_name: explorerdb.mynetwork.com
    hostname: explorerdb.mynetwork.com
    environment:
      - DATABASE_DATABASE=fabricexplorer
      - DATABASE_USERNAME=hppoc
      - DATABASE_PASSWORD=password
    healthcheck:
      test: "pg_isready -h localhost -p 5432 -q -U postgres"
      interval: 30s
      timeout: 10s
      retries: 5
    volumes:
      - ./persistence:/var/lib/postgresql/data
    networks:
      - fabric_test

  explorer.mynetwork.com:
    image: hyperledger/explorer:latest
    container_name: explorer.mynetwork.com
    hostname: explorer.mynetwork.com
    environment:
      - DATABASE_HOST=explorerdb.mynetwork.com
      - DATABASE_DATABASE=fabricexplorer
      - DATABASE_USERNAME=hppoc
      - DATABASE_PASSWORD=password
      - LOG_LEVEL_APP=info
      - LOG_LEVEL_DB=info
      - LOG_LEVEL_CONSOLE=debug
      - LOG_CONSOLE_STDOUT=true
      - DISCOVERY_AS_LOCALHOST=false
    volumes:
      - ./config.json:/opt/explorer/app/platform/fabric/config.json
      - ./connection-profile:/opt/explorer/app/platform/fabric/connection-profile
      - ../test-network/organizations:/tmp/organizations
    ports:
      - 8080:8080
    depends_on:
      explorerdb.mynetwork.com:
        condition: service_healthy
    networks:
      - fabric_test
EOF

# Create config.json
cat > config.json << 'EOF'
{
  "network-configs": {
    "test-network": {
      "name": "Test Network",
      "profile": "./connection-profile/test-network.json"
    }
  },
  "license": "Apache-2.0"
}
EOF

# Create connection profile directory
mkdir -p connection-profile

# Create connection profile
cat > connection-profile/test-network.json << 'EOF'
{
  "name": "test-network",
  "version": "1.0.0",
  "client": {
    "tlsEnable": true,
    "adminUser": "admin",
    "adminPassword": "adminpw",
    "enableAuthentication": false,
    "organization": "Org1MSP",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        },
        "orderer": "300"
      }
    }
  },
  "channels": {
    "mychannel": {
      "peers": {
        "peer0.org1.example.com": {}
      }
    }
  },
  "organizations": {
    "Org1MSP": {
      "mspid": "Org1MSP",
      "adminPrivateKey": {
        "path": "/tmp/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
      },
      "peers": ["peer0.org1.example.com"],
      "signedCert": {
        "path": "/tmp/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem"
      }
    }
  },
  "peers": {
    "peer0.org1.example.com": {
      "tlsCACerts": {
        "path": "/tmp/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
      },
      "url": "grpcs://peer0.org1.example.com:7051"
    }
  }
}
EOF

# Start Explorer
echo "Starting Hyperledger Explorer..."
docker-compose up -d

echo ""
echo "Hyperledger Explorer started successfully!"
echo ""
echo "Access Explorer at: http://localhost:8080"
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check status
docker-compose ps

echo ""
echo "To stop Explorer: cd fabric-samples/blockchain-explorer && docker-compose down"
```

Make it executable:
```bash
chmod +x scripts/start-explorer.sh
```

Run it:
```bash
npm run start-explorer
```

Add to `package.json`:
```json
{
  "scripts": {
    "start-explorer": "bash scripts/start-explorer.sh",
    "stop-explorer": "cd fabric-samples/blockchain-explorer && docker-compose down"
  }
}
```

---

## Usage

### Start Everything:

```bash
# 1. Start network
npm run start-network

# 2. Create channel
npm run create-channel

# 3. Deploy chaincode
npm run deploy-chaincode

# 4. Start Explorer
npm run start-explorer

# 5. Open browser
# http://localhost:8080
```

### Stop Everything:

```bash
npm run stop-explorer
npm run stop-network
```

---

## Explorer Features

### Dashboard
- Network overview
- Block height
- Transaction count
- Chaincode information

### Blocks
- View all blocks
- Block details
- Transactions in block
- Block hash

### Transactions
- View all transactions
- Transaction details
- Endorsements
- Read/Write sets

### Chaincodes
- Installed chaincodes
- Chaincode versions
- Channel assignments

### Channels
- Channel list
- Peers in channel
- Block activity

### Network
- Peer nodes
- Orderer nodes
- Status indicators

---

## Troubleshooting

### Issue: "Cannot connect to network"

**Solution:**
```bash
# Ensure network is running
docker ps

# Restart explorer
cd fabric-samples/blockchain-explorer
docker-compose down
docker-compose up -d
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Remove old database
cd fabric-samples/blockchain-explorer
docker-compose down -v
rm -rf persistence
docker-compose up -d
```

### Issue: "Port 8080 already in use"

**Solution:**
```bash
# Change port in docker-compose.yaml
ports:
  - 8081:8080  # Change 8080 to 8081

# Access at http://localhost:8081
```

### Issue: "Cannot find crypto materials"

**Solution:**
- Ensure test network is running
- Check that organizations folder exists
- Verify connection profile paths

---

## Alternative: Minifab Explorer

Simpler alternative using Minifab:

```bash
# Install minifab
curl -o minifab -sL https://tinyurl.com/yxa2q6yr && chmod +x minifab

# Start network with explorer
./minifab up -e true

# Access at http://localhost:7010
```

---

## Commercial Alternatives

### 1. IBM Blockchain Platform
- **Website**: https://www.ibm.com/blockchain/platform
- **Features**: Full enterprise solution, visual tools, monitoring
- **Cost**: Free trial, then paid
- **Best for**: Enterprise deployments

### 2. Oracle Blockchain Platform
- **Website**: https://www.oracle.com/blockchain/
- **Features**: Pre-assembled, REST APIs, cloud integration
- **Cost**: Pay-as-you-go
- **Best for**: Oracle ecosystem users

### 3. Amazon Managed Blockchain
- **Website**: https://aws.amazon.com/managed-blockchain/
- **Features**: Fully managed, auto-scaling, monitoring
- **Cost**: Pay-as-you-go
- **Best for**: AWS users

### 4. Azure Blockchain Service
- **Website**: https://azure.microsoft.com/en-us/products/blockchain-service/
- **Features**: Managed network, governance tools
- **Cost**: Pay-as-you-go
- **Best for**: Azure ecosystem

---

## Community Tools

### 1. Fabric Operations Console
- Open-source admin console
- Network management
- Node monitoring
- https://github.com/hyperledger-labs/fabric-operations-console

### 2. Fabric-Network-Builder
- Visual network builder
- Configuration generator
- https://github.com/hyperledger/fabric-samples

### 3. Caliper Benchmark
- Performance testing
- Load generation
- Metrics dashboard
- https://github.com/hyperledger/caliper

---

## Next Steps

1. **Start with Explorer** - Best for development and testing
2. **Learn the dashboard** - Understand blocks, transactions, chaincode
3. **Monitor your network** - Watch transactions in real-time
4. **Debug issues** - Use logs and transaction details
5. **Production** - Consider commercial solutions for production deployments

---

## Quick Reference

```bash
# Start everything
npm run start-network
npm run create-channel
npm run deploy-chaincode
npm run start-explorer

# Access
http://localhost:8080

# Stop everything
npm run stop-explorer
npm run stop-network

# View logs
cd fabric-samples/blockchain-explorer
docker-compose logs -f explorer.mynetwork.com
```

---

**Happy Exploring!**
