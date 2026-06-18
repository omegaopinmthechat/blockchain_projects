import fs from "fs-extra";
import path from "path";
import ora from "ora";
import { execa } from "execa";
import { logger } from "../utils/logger.js";

// types

export interface ScaffoldOptions {
  projectName: string;
  projectDir: string;
}

// file content generators 
// These produce the actual file contents written into the new project.
// Kept as functions so values like projectName are interpolated correctly.


function makeChaincodePkgJson(): string {
  return JSON.stringify(
    {
      name: "basic-chaincode",
      version: "1.0.0",
      description: "Basic asset transfer chaincode",
      main: "index.js",
      scripts: {
        start: "fabric-chaincode-node start",
      },
      dependencies: {
        "fabric-contract-api": "^2.5.0",
        "fabric-shim": "^2.5.0",
      },
    },
    null,
    2
  );
}

function makeConfigtx(): string {
  return `# configtx.yaml — channel and org configuration
# Full version is in templates/network/configtx.yaml
# This is used by configtxgen to produce the genesis block

Organizations:
  - &Org1
    Name: Org1MSP
    ID: Org1MSP
    MSPDir: ../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('Org1MSP.admin', 'Org1MSP.peer', 'Org1MSP.client')"
      Writers:
        Type: Signature
        Rule: "OR('Org1MSP.admin', 'Org1MSP.client')"
      Admins:
        Type: Signature
        Rule: "OR('Org1MSP.admin')"
      Endorsement:
        Type: Signature
        Rule: "OR('Org1MSP.peer')"
`;
}

function makePackageJson(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      description: "A Hyperledger Fabric application",
      scripts: {
        "start-network": "bash scripts/start-network.sh",
        "stop-network": "bash scripts/stop-network.sh",
        "deploy-chaincode": "bash scripts/deploy-chaincode.sh",
        "create-channel": "bash scripts/create-channel.sh",
        "client": "ts-node app/index.ts",
        "cleanup": "bash scripts/cleanup.sh",
        "start-explorer": "bash scripts/start-explorer.sh",
        "stop-explorer": "bash scripts/stop-explorer.sh",
      },
      dependencies: {
        "@grpc/grpc-js": "^1.9.0",
        "@hyperledger/fabric-gateway": "^1.4.0",
      },
      devDependencies: {
        "@types/node": "^22.0.0",
        "ts-node": "^10.9.0",
        typescript: "^5.3.0",
      },
    },
    null,
    2,
  );
}

function makeReadme(projectName: string): string {
  return `# ${projectName}

A Hyperledger Fabric blockchain application created with create-fabric-app.

## What is this?

This project provides a complete Hyperledger Fabric blockchain network with:
- **Smart Contract (Chaincode)**: Business logic running on the blockchain
- **Network Scripts**: Easy commands to start/stop your blockchain network
- **Client Application**: Connect to the blockchain and execute transactions

## Prerequisites

- Docker Desktop running
- Node.js (v16 or higher)
- Basic understanding of blockchain concepts

## Quick Start

### 1. Start the Blockchain Network

\`\`\`bash
npm run start-network
\`\`\`

This command will:
- Start peer nodes (computers that validate transactions)
- Start orderer nodes (computers that order transactions)
- Start certificate authorities (manage identities)

**Expected output**: "Network is up! Peers and orderer are running."

### 2. Create a Channel

\`\`\`bash
npm run create-channel
\`\`\`

A channel is like a private "room" where specific organizations can transact.

**Expected output**: "Channel 'mychannel' created successfully."

### 3. Deploy Your Smart Contract

\`\`\`bash
npm run deploy-chaincode
\`\`\`

This deploys your business logic (smart contract) to the blockchain network.

**Expected output**: "Chaincode deployed successfully."

### 4. Run the Client Application

\`\`\`bash
npm run client
\`\`\`

This runs a sample application that:
- Connects to your blockchain network
- Initializes the ledger with sample assets
- Queries all assets from the blockchain

**Expected output**: List of assets stored on the blockchain.

### 5. Stop the Network

\`\`\`bash
npm run stop-network
\`\`\`

Cleans up all Docker containers and network artifacts.

## Understanding the Project Structure

\`\`\`
${projectName}/
├── chaincode/basic/              # Your Smart Contract (Business Logic)
│   ├── index.js                  # Main contract code
│   └── package.json              # Contract dependencies
│
├── app/                          # Client Application
│   └── index.ts                  # Application that interacts with blockchain
│
├── scripts/                      # Network Management Scripts
│   ├── start-network.sh          # Start blockchain network
│   ├── create-channel.sh         # Create communication channel
│   ├── deploy-chaincode.sh       # Deploy smart contract
│   └── stop-network.sh           # Stop and cleanup
│
├── network/                      # Network Configuration
│   └── configtx.yaml             # Channel and organization settings
│
└── fabric-samples/              # Hyperledger Fabric Test Network (auto-generated)
\`\`\`

## What Can You Do?

### Modify the Smart Contract

Edit \`chaincode/basic/index.js\` to change the business logic.

**Example functions available:**
- \`InitLedger\`: Initialize blockchain with sample data
- \`CreateAsset\`: Create a new asset on the blockchain
- \`ReadAsset\`: Read an asset by ID
- \`UpdateAsset\`: Update an existing asset
- \`DeleteAsset\`: Delete an asset
- \`TransferAsset\`: Transfer asset ownership
- \`GetAllAssets\`: Query all assets
- \`GetAssetHistory\`: Get complete history of an asset

**After modifying, redeploy:**
\`\`\`bash
npm run deploy-chaincode
\`\`\`

### Customize the Client Application

Edit \`app/index.ts\` to:
- Query different data from the blockchain
- Submit different transactions
- Create your own business workflows

**Run your changes:**
\`\`\`bash
npm run client
\`\`\`

## Common Commands

| Command | Description | When to use |
|---------|-------------|-------------|
| \`npm run start-network\` | Start blockchain network | First time, or after stopping |
| \`npm run create-channel\` | Create communication channel | After starting network |
| \`npm run deploy-chaincode\` | Deploy/update smart contract | After modifying chaincode |
| \`npm run client\` | Run client application | To interact with blockchain |
| \`npm run stop-network\` | Stop and clean everything | When done testing |
| \`npm run cleanup\` | Deep cleanup (removes Docker resources) | To free up disk space |

## Blockchain Concepts Explained

### Smart Contract (Chaincode)
Code that runs on the blockchain and defines:
- What data is stored
- What operations are allowed
- Who can do what

### Ledger
The database where all transactions are permanently recorded.

### Channel
A private "subnet" where specific organizations can transact privately.

### Peer
A server that maintains a copy of the ledger and executes smart contracts.

### Orderer
A server that orders transactions and creates blocks.

### Transaction
An action that modifies the ledger (e.g., create, update, delete).

### Query
Reading data from the ledger without modifying it.

## Troubleshooting

### Error: "Docker is not running"
**Solution**: Start Docker Desktop and wait for it to fully start.

### Error: "Network already exists"
**Solution**: Run \`npm run stop-network\` first, then try again.

### Error: "Chaincode deployment failed"
**Solution**: 
1. Check \`chaincode/basic/index.js\` for syntax errors
2. Ensure the network is running
3. Try redeploying

### Error: "Connection refused"
**Solution**: 
1. Ensure network is started: \`npm run start-network\`
2. Check Docker containers are running: \`docker ps\`

## Next Steps

1. **Learn the Smart Contract**: Open \`chaincode/basic/index.js\` and read the code
2. **Experiment**: Try creating/reading/updating assets using the client
3. **Modify**: Add your own functions to the smart contract
4. **Build**: Create your own blockchain application!

## Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Smart Contract Tutorial](https://hyperledger-fabric.readthedocs.io/en/latest/chaincode.html)
- [Application Development Tutorial](https://hyperledger-fabric.readthedocs.io/en/latest/write_first_app.html)

## Need Help?

If you encounter issues:
1. Check Docker is running: \`docker ps\`
2. View logs: Check terminal output for error messages
3. Clean restart: \`npm run stop-network\` then \`npm run start-network\`

---

**Happy Blockchain Development!** 🚀
`;
}

function makeStartNetworkScript(): string {
  return `#!/bin/bash
set -e

echo "Starting Hyperledger Fabric test network..."

cd "$(dirname "$0")/../fabric-samples/test-network"

# Bring down any previous network first
./network.sh down

# Start network with Certificate Authorities
./network.sh up -ca

echo ""
echo "Network is up. Peers and orderer are running."
echo "Run 'npm run create-channel' to create a channel."
`;
}

function makeStopNetworkScript(): string {
  return `#!/bin/bash
set -e

echo "Stopping Hyperledger Fabric test network..."

cd "$(dirname "$0")/../fabric-samples/test-network"

./network.sh down

echo "Network stopped and cleaned up."
`;
}

function makeCleanupScript(): string {
  return `#!/bin/bash
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

if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
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
if [ ! -z "\$CONTAINERS" ]; then
    docker rm -f \$CONTAINERS 2>/dev/null || true
    echo "  ✔ Containers removed"
else
    echo "  ↷ No containers found"
fi

echo ""
echo "  [3/4] Removing Docker volumes..."
VOLUMES=$(docker volume ls -q 2>/dev/null || true)
if [ ! -z "\$VOLUMES" ]; then
    for vol in \$VOLUMES; do
        docker volume rm \$vol 2>/dev/null || true
    done
    echo "  ✔ Volumes removed"
else
    echo "  ↷ No volumes found"
fi

echo ""
echo "  [4/4] Removing Docker networks..."
NETWORKS=$(docker network ls --filter "name=fabric" -q 2>/dev/null || true)
if [ ! -z "\$NETWORKS" ]; then
    docker network rm \$NETWORKS 2>/dev/null || true
    echo "  ✔ Networks removed"
else
    echo "  ↷ No networks found"
fi

echo ""
read -p "  Remove Docker images? This will free ~5-7 GB (y/n): " -n 1 -r
echo ""

if [[ \$REPLY =~ ^[Yy]$ ]]; then
    echo "  Removing Docker images..."
    IMAGES=$(docker images "hyperledger/*" -q 2>/dev/null || true)
    if [ ! -z "\$IMAGES" ]; then
        docker rmi -f \$IMAGES 2>/dev/null || true
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
`;
}

function makeCreateChannelScript(): string {
  return `#!/bin/bash
set -e

CHANNEL_NAME=\${1:-mychannel}

echo "Creating channel: $CHANNEL_NAME"

cd "$(dirname "$0")/../fabric-samples/test-network"

./network.sh createChannel -c $CHANNEL_NAME

echo "Channel '$CHANNEL_NAME' created successfully."
`;
}

function makeDeployChaincode(): string {
  return `#!/bin/bash
set -e

CHANNEL_NAME=\${1:-mychannel}
CC_NAME=\${2:-basic}

# Get absolute path to chaincode directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CC_PATH="$SCRIPT_DIR/../chaincode/basic"

echo "Deploying chaincode '$CC_NAME' to channel '$CHANNEL_NAME'..."

cd "$SCRIPT_DIR/../fabric-samples/test-network"

./network.sh deployCC \\
  -c "$CHANNEL_NAME" \\
  -ccn "$CC_NAME" \\
  -ccp "$CC_PATH" \\
  -ccl javascript

echo "Chaincode deployed successfully."
`;
}

function makeChaincode(): string {
  return `'use strict';

const { Contract } = require('fabric-contract-api');

class BasicContract extends Contract {

  // Initialize the ledger with some sample data
  async InitLedger(ctx) {
    const assets = [
      { ID: 'asset1', Color: 'blue',  Size: 5,  Owner: 'Tomoko', AppraisedValue: 300 },
      { ID: 'asset2', Color: 'red',   Size: 5,  Owner: 'Brad',   AppraisedValue: 400 },
      { ID: 'asset3', Color: 'green', Size: 10, Owner: 'Jin Soo', AppraisedValue: 500 },
    ];

    for (const asset of assets) {
      await ctx.stub.putState(
        asset.ID,
        Buffer.from(JSON.stringify(asset))
      );
    }
  }

  // Create a new asset on the ledger
  async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
    const asset = { ID: id, Color: color, Size: size, Owner: owner, AppraisedValue: appraisedValue };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    return JSON.stringify(asset);
  }

  // Read an asset by ID
  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(\`Asset \${id} does not exist\`);
    }
    return assetJSON.toString();
  }

  // Transfer asset ownership
  async TransferAsset(ctx, id, newOwner) {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(\`Asset \${id} does not exist\`);
    }
    const asset = JSON.parse(assetJSON.toString());
    asset.Owner = newOwner;
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    return JSON.stringify(asset);
  }

  // Get all assets on the ledger
  async GetAllAssets(ctx) {
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      allResults.push(JSON.parse(strValue));
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
}

module.exports = BasicContract;
`;
}

function makeAppClient(_projectName: string): string {
  return `import * as grpc from '@grpc/grpc-js';
import { connect, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

// Network connection settings
const channelName     = 'mychannel';
const chaincodeName   = 'basic';
const mspId           = 'Org1MSP';

// Paths to crypto material generated by the test network
const cryptoPath      = path.resolve(__dirname, '..', 'fabric-samples', 'test-network',
                          'organizations', 'peerOrganizations', 'org1.example.com');
const keyDirPath      = path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certPath        = path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp',
                          'signcerts', 'cert.pem');
const tlsCertPath     = path.join(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
const peerEndpoint    = 'localhost:7051';
const peerHostAlias   = 'peer0.org1.example.com';

async function main(): Promise<void> {
  const client = await newGrpcConnection();

  const gateway = connect({
    client,
    identity: await newIdentity(),
    signer: await newSigner(),
  });

  try {
    const network  = gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);

    // Initialize the ledger (comment out if already initialized)
    console.log('Initializing ledger...');
    try {
      await contract.submitTransaction('InitLedger');
      console.log('Ledger initialized successfully.');
    } catch (err) {
      console.log('Ledger may already be initialized, continuing...');
    }

    // Get all assets
    console.log('Getting all assets...');
    const result = await contract.evaluateTransaction('GetAllAssets');
    
    // Debug: Show raw result
    console.log('Raw result:', result.toString());
    
    // Parse and display
    try {
      // Convert Buffer to string properly
      const resultString = Buffer.from(result).toString('utf8');
      const assets = JSON.parse(resultString);
      console.log('Assets:', assets);
    } catch (parseError) {
      console.error('Failed to parse result as JSON');
      console.error('Raw result:', result.toString());
    }

  } finally {
    gateway.close();
    client.close();
  }
}

async function newGrpcConnection(): Promise<grpc.Client> {
  const tlsRootCert = await fs.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': peerHostAlias,
  });
}

async function newIdentity() {
  const credentials = await fs.readFile(certPath);
  return { mspId, credentials };
}

async function newSigner() {
  const files = await fs.readdir(keyDirPath);
  const keyPath = path.join(keyDirPath, files[0]!);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

main().catch(console.error);
`;
}

function makeGitignore(): string {
  return `node_modules/
dist/
wallet/
*.pem
.env
fabric-samples/
`;
}

function makeEnvFile(): string {
  return `# Fabric connection settings
CHANNEL_NAME=mychannel
CHAINCODE_NAME=basic
MSP_ID=Org1MSP
PEER_ENDPOINT=localhost:7051
`;
}

function makeTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "commonjs",
        lib: ["ES2022"],
        outDir: "./dist",
        rootDir: "./",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: "node",
      },
      include: ["app/**/*"],
      exclude: ["node_modules", "dist", "fabric-samples"],
    },
    null,
    2,
  );
}

//  directory + file builder

interface FileEntry {
  filePath: string; // relative to projectDir
  content: string;
}

function buildFileTree(options: ScaffoldOptions): FileEntry[] {
  const { projectName } = options;
  return [
    { filePath: "package.json", content: makePackageJson(projectName) },
    { filePath: "README.md", content: makeReadme(projectName) },
    { filePath: ".gitignore", content: makeGitignore() },
    { filePath: ".env", content: makeEnvFile() },
    { filePath: "tsconfig.json", content: makeTsConfig() },

    // Scripts
    { filePath: "scripts/start-network.sh", content: makeStartNetworkScript() },
    { filePath: "scripts/stop-network.sh", content: makeStopNetworkScript() },
    {
      filePath: "scripts/create-channel.sh",
      content: makeCreateChannelScript(),
    },
    { filePath: "scripts/deploy-chaincode.sh", content: makeDeployChaincode() },
    { filePath: "scripts/cleanup.sh", content: makeCleanupScript() },

    // Chaincode — BOTH files needed for deployCC to work
    { filePath: "chaincode/basic/index.js", content: makeChaincode() },
    {
      filePath: "chaincode/basic/package.json",
      content: makeChaincodePkgJson(),
    },

    // Network config
    { filePath: "network/configtx.yaml", content: makeConfigtx() },

    // Client app
    { filePath: "app/index.ts", content: makeAppClient(projectName) },
  ];
}

// main export

export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const { projectDir } = options;

  const spinner = ora("Scaffolding project structure...").start();

  try {
    // 1. Ensure the root project directory exists
    await fs.ensureDir(projectDir);

    // 2. Validate fabric-samples exists (installed by installFabric)
    const fabricSamplesPath = path.join(projectDir, "fabric-samples");
    const fabricSamplesExists = await fs.pathExists(fabricSamplesPath);

    if (!fabricSamplesExists) {
      spinner.warn("fabric-samples directory not found in expected location.");
      logger.warn(`Expected path: ${fabricSamplesPath}`);
      logger.warn("Checking if fabric-samples exists elsewhere...");
      
      // Check current directory
      const currentDirSamples = path.join(process.cwd(), "fabric-samples");
      if (await fs.pathExists(currentDirSamples)) {
        logger.info("Found fabric-samples in current directory, moving...");
        await fs.move(currentDirSamples, fabricSamplesPath);
      } else {
        spinner.fail("fabric-samples directory not found.");
        throw new Error(
          `Fabric installation appears incomplete. The fabric-samples directory is missing.\n` +
          `Expected location: ${fabricSamplesPath}\n` +
          `This usually means the Fabric installation step failed.\n` +
          `Try running with DEBUG=1 for more details.`
        );
      }
    }

    spinner.text = "Writing project files...";

    // 3. Write every file
    const files = buildFileTree(options);

    for (const { filePath, content } of files) {
      const fullPath = path.join(projectDir, filePath);

      // ensureDir creates parent folders automatically (like mkdir -p)
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, "utf-8");
    }

    // 4. Make shell scripts executable (Unix/Linux/Mac only)
    if (process.platform !== "win32") {
      const scripts = files
        .filter((f) => f.filePath.endsWith(".sh"))
        .map((f) => path.join(projectDir, f.filePath));

      for (const scriptPath of scripts) {
        await fs.chmod(scriptPath, 0o755);
      }
    }

    spinner.succeed("Project structure created.");

    // 5. Install npm dependencies
    const installSpinner = ora("Installing dependencies...").start();
    try {
      await execa("npm", ["install"], {
        cwd: projectDir,
        stdio: "pipe",
      });
      installSpinner.succeed("Dependencies installed.");
    } catch (err) {
      installSpinner.warn("Failed to install dependencies automatically.");
      logger.warn("Please run 'npm install' manually in your project directory.");
    }

    // 6. Install chaincode dependencies
    const chaincodeSpinner = ora("Installing chaincode dependencies...").start();
    const chaincodePath = path.join(projectDir, "chaincode", "basic");
    try {
      await execa("npm", ["install"], {
        cwd: chaincodePath,
        stdio: "pipe",
      });
      chaincodeSpinner.succeed("Chaincode dependencies installed.");
    } catch (err) {
      chaincodeSpinner.warn("Failed to install chaincode dependencies.");
      logger.warn("Please run 'npm install' in the chaincode/basic directory.");
    }

    // 7. Print the final success tree
    printSuccessMessage(options);
  } catch (err) {
    spinner.fail("Failed to scaffold project.");
    throw err;
  }
}

function printSuccessMessage(options: ScaffoldOptions): void {
  const { projectName } = options;

  console.log(`
  Success! Created ${projectName}

  cd ${projectName}

  npm run start-network      → Start the Fabric test network
  npm run create-channel     → Create a channel (mychannel)
  npm run deploy-chaincode   → Deploy the basic chaincode
  npm run client             → Run the TypeScript client app
  npm run stop-network       → Stop and clean up

  Edit your smart contract:  chaincode/basic/index.js
  Edit your client app:      app/index.ts
  `);
}
