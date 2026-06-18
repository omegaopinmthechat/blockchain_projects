# create-fabric-app

Zero-configuration Hyperledger Fabric blockchain project scaffolder.

## 🚀 Quick Start

```bash
npx create-fabric-app my-blockchain-app
cd my-blockchain-app
npm run start-network
npm run create-channel
npm run deploy-chaincode
npm run client
```

**That's it!** You now have a working blockchain network.

📖 **[Read the Complete User Guide](./USER_GUIDE.md)** - Everything you need to know!

---

Creates a complete, production-ready Hyperledger Fabric blockchain application with:
-  Automatic prerequisite installation (Docker, Go, etc.)
-  Hyperledger Fabric network setup
-  Sample smart contract (chaincode)
-  Client application to interact with blockchain
-  Ready-to-use scripts for network management

## Quick Start

```bash
npx create-fabric-app my-blockchain-app
cd my-blockchain-app
npm run start-network
npm run create-channel
npm run deploy-chaincode
npm run client
```

## Requirements

- **Operating System**: Windows (with WSL2), Linux, or macOS
- **Node.js**: v16 or higher
- **Disk Space**: ~10 GB free space
- **Internet**: Required for downloading Docker images

## What Gets Installed?

The tool will automatically install (if not present):

### All Platforms
- Docker (for running blockchain nodes)
- Go programming language
- Hyperledger Fabric binaries and Docker images

### Windows
- WSL2 (Windows Subsystem for Linux)
- Docker inside WSL

### macOS
- Homebrew (if not installed)

### Linux
- curl (if not installed)

## Installation Process

When you run `npx create-fabric-app`, it will:

1. **Detect your operating system**
2. **Check available disk space** (requires ~10 GB)
3. **Ask for confirmation** before downloading
4. **Install prerequisites** (Docker, Go, etc.)
5. **Download Hyperledger Fabric** (~7-8 GB)
6. **Create your project structure**
7. **Install dependencies automatically**

**Total time**: 10-15 minutes (depending on internet speed)

## Usage

### Basic Usage

```bash
npx create-fabric-app my-project
```

### With Custom Fabric Version

```bash
npx create-fabric-app my-project --fabric-version 2.5.0
```

### With Custom CA Version

```bash
npx create-fabric-app my-project --ca-version 1.5.5
```

## Generated Project Structure

```
my-project/
├── chaincode/basic/          # Smart contract (your business logic)
│   ├── index.js              # Contract implementation
│   └── package.json
├── app/                      # Client application
│   └── index.ts              # Blockchain interaction code
├── scripts/                  # Network management
│   ├── start-network.sh
│   ├── create-channel.sh
│   ├── deploy-chaincode.sh
│   └── stop-network.sh
├── network/                  # Configuration files
│   └── configtx.yaml
├── fabric-samples/           # Hyperledger test network (auto-generated)
└── package.json
```

## Commands in Generated Project

| Command | Description |
|---------|-------------|
| `npm run start-network` | Start the blockchain network |
| `npm run create-channel` | Create a communication channel |
| `npm run deploy-chaincode` | Deploy your smart contract |
| `npm run client` | Run the client application |
| `npm run stop-network` | Stop and cleanup |

## Platform-Specific Notes

### Windows
- **WSL2 is required**: The tool will install it if not present
- **Reboot needed**: After WSL2 installation, restart and run again
- **Docker Desktop**: Must be installed and running
- **Paths with spaces**: Fully supported (e.g., `C:\My Projects\`)

### Linux (Ubuntu/Debian)
- Requires `sudo` privileges for package installation
- After Docker installation, log out and back in
- Run: `sudo usermod -aG docker $USER`

### macOS
- Homebrew will be installed if not present
- Docker Desktop must be opened manually after installation

## Troubleshooting

### "Insufficient disk space"
- Free up at least 10 GB of space
- Fabric images alone require ~5 GB

### "Docker is not running"
- Start Docker Desktop
- Wait for it to fully initialize (check system tray icon)
- On Windows: Ensure Docker Desktop is using WSL2 backend

### "WSL needs reboot" (Windows only)
- Restart your computer
- Run the command again after reboot

### "Permission denied" (Linux/Mac)
- Scripts need execution permissions
- The tool handles this automatically

### Installation hangs
- Check your internet connection
- Docker image downloads can take 5-10 minutes
- Be patient during "Installing Hyperledger Fabric" step

## What is Hyperledger Fabric?

Hyperledger Fabric is an enterprise-grade, permissioned blockchain framework featuring:
- **Private channels** for confidential transactions
- **Smart contracts** written in JavaScript, Go, or Java
- **Modular architecture** for flexibility
- **High performance** for enterprise applications

## Examples of What You Can Build

- Supply chain tracking systems
- Asset management platforms
- Healthcare record systems
- Financial settlement networks
- Identity management solutions
- Document verification systems

## Development Workflow

1. **Start**: `npm run start-network`
2. **Create Channel**: `npm run create-channel`
3. **Deploy**: `npm run deploy-chaincode`
4. **Develop**: Edit `chaincode/basic/index.js`
5. **Redeploy**: `npm run deploy-chaincode` (after changes)
6. **Test**: `npm run client`
7. **Stop**: `npm run stop-network` (when done)

## Advanced Configuration

### Custom Channel Name
```bash
npm run create-channel mycustomchannel
```

### Custom Chaincode Name
```bash
npm run deploy-chaincode mychannel mycontract
```

## Security Notes

- **Never commit** credentials to version control
- The `.gitignore` is pre-configured for safety
- `fabric-samples/` contains test certificates (not for production)

## Performance Tips

- **Docker Desktop**: Allocate at least 4 GB RAM
- **Disk I/O**: Use SSD for better performance
- **Network**: First run downloads ~7-8 GB

## Uninstallation

To remove everything:

```bash
# Stop the network
cd my-project
npm run stop-network

# Remove Docker images (optional, frees ~5 GB)
docker rmi $(docker images hyperledger/* -q)

# Delete project
cd ..
rm -rf my-project
```

## Resources

- [Hyperledger Fabric Docs](https://hyperledger-fabric.readthedocs.io/)
- [Chaincode Tutorial](https://hyperledger-fabric.readthedocs.io/en/latest/chaincode.html)
- [Fabric GitHub](https://github.com/hyperledger/fabric)

## Support

- **Issues**: Report on GitHub
- **Questions**: Check Hyperledger Fabric documentation
- **Community**: Join Hyperledger Discord




**Built with ❤️ by Amar for blockchain developers**
