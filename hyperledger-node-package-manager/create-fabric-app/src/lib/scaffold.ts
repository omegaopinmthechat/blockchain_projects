import fs from "fs-extra";
import path from "path";
import ora from "ora";

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
      },
      dependencies: {
        "@hyperledger/fabric-gateway": "^1.4.0",
      },
      devDependencies: {
        "@types/node": "^22.0.0",
        typescript: "^6.0.0",
      },
    },
    null,
    2,
  );
}

function makeReadme(projectName: string): string {
  return `# ${projectName}

A Hyperledger Fabric application scaffolded by create-fabric-app.

## Getting started

\`\`\`bash
# Start the test network
npm run start-network

# Deploy chaincode
npm run deploy-chaincode

# Stop the network
npm run stop-network
\`\`\`

## Project structure

\`\`\`
${projectName}/
├── fabric-samples/          ← Cloned by Hyperledger (do not edit)
├── network/
│   └── configtx.yaml        ← Channel & org configuration
├── chaincode/
│   └── basic/
│       └── index.ts         ← Your smart contract (chaincode)
├── app/
│   └── index.ts             ← Client application entry point
└── scripts/
    ├── start-network.sh
    ├── stop-network.sh
    ├── deploy-chaincode.sh
    └── create-channel.sh
\`\`\`

## Useful commands

| Command | Description |
|---------|-------------|
| \`npm run start-network\` | Starts the Fabric test network |
| \`npm run stop-network\` | Stops and cleans up the network |
| \`npm run deploy-chaincode\` | Packages + deploys chaincode |
| \`npm run create-channel\` | Creates a new channel |
`;
}

function makeStartNetworkScript(): string {
  return `#!/bin/bash
set -e

echo "Starting Hyperledger Fabric test network..."

cd fabric-samples/test-network

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

cd fabric-samples/test-network

./network.sh down

echo "Network stopped and cleaned up."
`;
}

function makeCreateChannelScript(): string {
  return `#!/bin/bash
set -e

CHANNEL_NAME=\${1:-mychannel}

echo "Creating channel: $CHANNEL_NAME"

cd fabric-samples/test-network

./network.sh createChannel -c $CHANNEL_NAME

echo "Channel '$CHANNEL_NAME' created successfully."
`;
}

function makeDeployChaincode(): string {
  return `#!/bin/bash
set -e

CHANNEL_NAME=\${1:-mychannel}
CC_NAME=\${2:-basic}

echo "Deploying chaincode '$CC_NAME' to channel '$CHANNEL_NAME'..."

cd fabric-samples/test-network

./network.sh deployCC \\
  -c $CHANNEL_NAME \\
  -ccn $CC_NAME \\
  -ccp ../../chaincode/basic \\
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

function makeAppClient(projectName: string): string {
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

    // Initialize the ledger
    console.log('Initializing ledger...');
    await contract.submitTransaction('InitLedger');

    // Get all assets
    console.log('Getting all assets...');
    const result = await contract.evaluateTransaction('GetAllAssets');
    console.log('Assets:', JSON.parse(result.toString()));

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

    // Scripts
    { filePath: "scripts/start-network.sh", content: makeStartNetworkScript() },
    { filePath: "scripts/stop-network.sh", content: makeStopNetworkScript() },
    {
      filePath: "scripts/create-channel.sh",
      content: makeCreateChannelScript(),
    },
    { filePath: "scripts/deploy-chaincode.sh", content: makeDeployChaincode() },

    // Chaincode — BOTH files needed for deployCC to work
    { filePath: "chaincode/basic/index.js", content: makeChaincode() },
    {
      filePath: "chaincode/basic/package.json",
      content: makeChaincodePkgJson(),
    }, // ← FIX 1

    // Network config — was missing entirely
    { filePath: "network/configtx.yaml", content: makeConfigtx() }, // ← FIX 5

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

    // 2. Write every file
    const files = buildFileTree(options);

    for (const { filePath, content } of files) {
      const fullPath = path.join(projectDir, filePath);

      // ensureDir creates parent folders automatically (like mkdir -p)
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, "utf-8");
    }

    // 3. Make shell scripts executable
    const scripts = files
      .filter((f) => f.filePath.endsWith(".sh"))
      .map((f) => path.join(projectDir, f.filePath));

    for (const scriptPath of scripts) {
      await fs.chmod(scriptPath, 0o755);
    }

    spinner.succeed("Project structure created.");

    // 4. Print the final success tree
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
  npm run stop-network       → Stop and clean up

  Edit your smart contract:  chaincode/basic/index.js
  Edit your client app:      app/index.ts
  `);
}
