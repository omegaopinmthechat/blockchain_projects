# Hyperledger Fabric Quick Start Guide

> **Create, deploy, and manage blockchain applications in minutes**

## What You Can Do

With `create-fabric-app`, you can:

- **Create** a complete blockchain network with one command  
- **Deploy** smart contracts (business logic on blockchain)  
- **Build** decentralized applications  
- **Manage** your blockchain network easily  
- **Learn** blockchain development hands-on  

**No complex setup. No configuration files. Just start building.**

---

## Prerequisites

Before you start, make sure you have:

- **Windows 10/11** (with WSL2), **macOS**, or **Linux**
- **Node.js** v16 or higher → [Download](https://nodejs.org/)
- **Docker Desktop** → [Download](https://www.docker.com/products/docker-desktop)
- **10 GB** free disk space
- **Internet connection** (for first-time setup)

---

## Quick Start (5 Steps)

### Step 1: Create Your Blockchain Project

```bash
npx create-fabric-app my-blockchain-app
```

**What happens:**
- Checks your system requirements
- Asks for confirmation (shows download size: ~7-8 GB)
- Installs Docker, Go (if needed)
- Downloads Hyperledger Fabric
- Creates your project structure
- Installs all dependencies

**Time:** 10-15 minutes (first time only)

---

### Step 2: Start Your Blockchain Network

```bash
cd my-blockchain-app
npm run start-network
```

**What happens:**
- Starts blockchain nodes (peers & orderers)
- Sets up certificate authorities
- Creates a private blockchain network

**Output:** `Network is up! Peers and orderer are running.`

---

### Step 3: Create a Communication Channel

```bash
npm run create-channel
```

**What it does:** Creates a private "room" where transactions happen

**Output:** `Channel 'mychannel' created successfully.`

---

### Step 4: Deploy Your Smart Contract

```bash
npm run deploy-chaincode
```

**What it does:** Deploys your business logic (smart contract) to the blockchain

**Output:** `Chaincode deployed successfully.`

---

### Step 5: Run Your Application

```bash
npm run client
```

**What it does:**
- Connects to your blockchain
- Creates sample assets
- Retrieves data from blockchain

**Output:** Shows assets stored on the blockchain

---

## All Available Commands

### Network Management

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `npm run start-network` | Starts the blockchain network | Beginning of development session |
| `npm run stop-network` | Stops the network | End of development session |
| `npm run create-channel` | Creates communication channel | After starting network (first time) |
| `npm run deploy-chaincode` | Deploys your smart contract | After modifying smart contract code |
| `npm run client` | Runs your blockchain app | To test your application |
| `npm run cleanup` | Deep cleanup (removes Docker resources) | To free up disk space (~5-7 GB) |

### Project Management

| Command | What It Does |
|---------|-------------|
| `npx create-fabric-app <name>` | Create a new blockchain project |
| `npx remove-fabric-app <name>` | Remove a project completely |
| `npx remove-fabric-app <name> --keep-images` | Remove project but keep Docker images |
| `npx remove-fabric-app <name> --force` | Remove without confirmation |

---

## 📁 Your Project Structure

```
my-blockchain-app/
│
├── 📂 chaincode/basic/          ← YOUR SMART CONTRACT (Edit this!)
│   ├── index.js                 ← Business logic code
│   └── package.json
│
├── 📂 app/                      ← YOUR APPLICATION (Edit this!)
│   └── index.ts                 ← Client code to interact with blockchain
│
├── 📂 scripts/                  ← Network management scripts
│   ├── start-network.sh
│   ├── stop-network.sh
│   ├── create-channel.sh
│   ├── deploy-chaincode.sh
│   └── cleanup.sh
│
├── 📂 network/                  ← Configuration files
│   └── configtx.yaml
│
└── 📂 fabric-samples/           ← Hyperledger test network (auto-generated)
```

---

## 💡 What You Can Build

### Real-World Use Cases

1. **Supply Chain Tracking**
   - Track products from manufacturer to customer
   - Verify authenticity and origin

2. **Asset Management**
   - Digital ownership records
   - Transfer assets securely

3. **Healthcare Records**
   - Secure patient data sharing
   - Immutable medical history

4. **Financial Systems**
   - Payment settlements
   - Trade finance

5. **Document Verification**
   - Certificates and credentials
   - Proof of authenticity

6. **Voting Systems**
   - Transparent elections
   - Tamper-proof voting

---

## 🛠️ How to Customize Your Project

### 1. Modify the Smart Contract

**File:** `chaincode/basic/index.js`

**Available Functions:**
- `InitLedger()` - Initialize with sample data
- `CreateAsset()` - Create new asset
- `ReadAsset()` - Read asset by ID
- `UpdateAsset()` - Update existing asset
- `DeleteAsset()` - Delete an asset
- `TransferAsset()` - Transfer ownership
- `GetAllAssets()` - Get all assets
- `GetAssetHistory()` - Get complete history

**After editing:**
```bash
npm run deploy-chaincode
```

---

### 2. Build Your Client Application

**File:** `app/index.ts`

**What you can do:**
- Query blockchain data
- Submit transactions
- Create custom workflows
- Build REST APIs
- Create web interfaces

**Test your changes:**
```bash
npm run client
```

---

## 🎯 Common Workflows

### Development Workflow

```bash
# Day 1: Setup
npx create-fabric-app my-project
cd my-project
npm run start-network
npm run create-channel
npm run deploy-chaincode

# Develop
# Edit chaincode/basic/index.js
npm run deploy-chaincode  # Redeploy after changes
npm run client            # Test your changes

# End of day
npm run stop-network
```

---

### Testing New Features

```bash
# Start fresh
npm run stop-network
npm run start-network
npm run create-channel
npm run deploy-chaincode
npm run client
```

---

### Complete Cleanup (Free Disk Space)

```bash
# Inside your project
npm run cleanup

# Or from outside
npx remove-fabric-app my-project
```

---

## 🔧 Troubleshooting

### Problem: "Docker is not running"

**Solution:**
1. Open Docker Desktop
2. Wait for Docker to fully start (check system tray)
3. Try again

---

### Problem: "Network already exists"

**Solution:**
```bash
npm run stop-network
npm run start-network
```

---

### Problem: "Chaincode deployment failed"

**Possible causes:**
- Syntax error in `chaincode/basic/index.js`
- Network not running
- Previous deployment still active

**Solution:**
```bash
# Check your code for errors
# Then:
npm run stop-network
npm run start-network
npm run create-channel
npm run deploy-chaincode
```

---

### Problem: "Insufficient disk space"

**Solution:**
```bash
# Free up space by removing Docker images
npm run cleanup
# Answer 'y' when asked to remove images (~5-7 GB freed)
```

---

### Problem: "Connection refused" or "Cannot connect to peer"

**Solution:**
```bash
# Check if Docker containers are running
docker ps

# If not, restart network
npm run stop-network
npm run start-network
```

---

### Problem: "Path with spaces causes errors"

**Solution:**
- Project should work with spaces in paths
- If issues persist, try moving to a path without spaces
- Report issue on GitHub

---

## 📊 Understanding Blockchain Concepts

### What is a Smart Contract?

Think of it as a **vending machine**:
- You insert money (input)
- Press a button (function call)
- Get your item (output)
- Everything is automatic and transparent

In blockchain:
- Write rules in code
- Deploy to blockchain
- Rules execute automatically
- Nobody can cheat or change results

---

### What is a Ledger?

A **permanent record book** where:
- Every transaction is recorded
- Nothing can be erased
- Everyone agrees on what's written
- History is always available

---

### What is a Channel?

A **private chat room** where:
- Only invited members can see messages
- Transactions stay confidential
- Multiple channels can exist
- Each has its own ledger

---

### What is a Peer?

A **computer in the network** that:
- Stores a copy of the ledger
- Validates transactions
- Executes smart contracts
- Maintains network security

---

### What is an Orderer?

A **traffic controller** that:
- Orders transactions correctly
- Creates blocks
- Distributes to peers
- Ensures everyone agrees

---

## 💪 Power User Tips

### Custom Channel Names

```bash
npm run create-channel my-custom-channel
npm run deploy-chaincode my-custom-channel my-contract
```

---

### View Docker Containers

```bash
docker ps
```

---

### View Logs

```bash
# Peer logs
docker logs peer0.org1.example.com

# Orderer logs
docker logs orderer.example.com
```

---

### Check Disk Usage

```bash
# Docker images size
docker images

# Container sizes
docker ps -s
```

---

### Manual Docker Cleanup

```bash
# Remove all containers
docker rm -f $(docker ps -a -q)

# Remove all images
docker rmi -f $(docker images -q)

# Remove all volumes
docker volume prune -f

# Remove all networks
docker network prune -f
```

---

## 🎓 Learning Path

### Beginner (Week 1)

1. ✅ Create your first project
2. ✅ Run all commands successfully
3. ✅ Read and understand `chaincode/basic/index.js`
4. ✅ Modify asset properties
5. ✅ Test your changes

### Intermediate (Week 2-3)

1. ✅ Add new functions to smart contract
2. ✅ Create custom asset types
3. ✅ Build a simple REST API
4. ✅ Add validation logic
5. ✅ Handle errors properly

### Advanced (Week 4+)

1. ✅ Multiple organizations setup
2. ✅ Private data collections
3. ✅ Endorsement policies
4. ✅ Chaincode in Go or Java
5. ✅ Production deployment

---

## 📚 Resources

### Official Documentation
- [Hyperledger Fabric Docs](https://hyperledger-fabric.readthedocs.io/)
- [Smart Contract Guide](https://hyperledger-fabric.readthedocs.io/en/latest/chaincode.html)
- [Application Development](https://hyperledger-fabric.readthedocs.io/en/latest/write_first_app.html)

### Community
- [Hyperledger Discord](https://discord.gg/hyperledger)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/hyperledger-fabric)
- [GitHub Discussions](https://github.com/hyperledger/fabric/discussions)

### Tutorials
- [Fabric Samples](https://github.com/hyperledger/fabric-samples)
- [Commercial Paper Tutorial](https://hyperledger-fabric.readthedocs.io/en/latest/tutorial/commercial_paper.html)
- [Fabric Videos](https://www.youtube.com/c/Hyperledger)

---

## ❓ FAQ

**Q: How much does it cost?**  
A: It's completely free and open-source.

**Q: Can I use this in production?**  
A: The tool is for development. For production, you need additional security and infrastructure setup.

**Q: What programming languages can I use?**  
A: Smart contracts: JavaScript, TypeScript, Go, Java. Client apps: Any language with Fabric SDK.

**Q: How many organizations can I have?**  
A: The default setup has 2 organizations. You can configure more.

**Q: Can I deploy to cloud?**  
A: Yes, but you'll need to configure cloud infrastructure separately.

**Q: Is my data secure?**  
A: Yes, blockchain provides cryptographic security. But remember: this is a test network. Production needs additional security measures.

**Q: Can I run multiple projects?**  
A: Yes, but stop one network before starting another (they use the same ports).

**Q: How do I update Fabric version?**  
A: Create a new project with `--fabric-version` flag:
```bash
npx create-fabric-app my-app --fabric-version 2.5.0
```

---

## 🆘 Getting Help

### If something doesn't work:

1. **Check Docker**: `docker ps`
2. **Check logs**: Look at terminal output
3. **Clean restart**: 
   ```bash
   npm run stop-network
   npm run start-network
   ```
4. **Deep cleanup**:
   ```bash
   npm run cleanup
   ```
5. **Start fresh**:
   ```bash
   npx remove-fabric-app my-project --force
   npx create-fabric-app my-project
   ```

---

## 🎉 Success Stories

After completing this guide, you'll be able to:

✅ Understand blockchain fundamentals  
✅ Create and deploy smart contracts  
✅ Build decentralized applications  
✅ Manage blockchain networks  
✅ Debug and troubleshoot issues  
✅ Start your blockchain career  

---

## 🚀 Next Steps

1. **Create your first project** (5 minutes)
2. **Follow the quick start** (30 minutes)
3. **Modify the smart contract** (1 hour)
4. **Build your own application** (Your journey begins!)

---

## 📝 Command Cheat Sheet

```bash
# CREATE
npx create-fabric-app <project-name>

# NAVIGATE
cd <project-name>

# START
npm run start-network
npm run create-channel
npm run deploy-chaincode

# DEVELOP
npm run client                    # Test
# (edit code)
npm run deploy-chaincode          # Redeploy

# STOP
npm run stop-network

# CLEANUP
npm run cleanup                   # Inside project
npx remove-fabric-app <name>      # Outside project

# HELP
docker ps                         # View containers
docker logs <container-name>      # View logs
```

---

## 🌟 You're Ready!

Now you have everything you need to start building blockchain applications.

**Your first command:**
```bash
npx create-fabric-app my-first-blockchain
```

**Happy Blockchain Development! 🚀**

---

*Made with ❤️ for developers who want to build the future*
