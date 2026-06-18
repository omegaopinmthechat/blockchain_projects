# Common Issues and Prerequisites

This document covers all prerequisites and common issues users might face when using create-fabric-app.

---

## Prerequisites by Platform

### Windows

#### Required:
- **Windows 10/11** (64-bit)
- **WSL2** (Windows Subsystem for Linux 2)
  - Will be installed automatically by the tool
  - **Requires system reboot after installation**
  - After reboot, run the tool again to continue
- **Docker Desktop for Windows**
  - Must be running before starting
  - Must use WSL2 backend (default in recent versions)
- **Node.js v16 or higher**
- **Administrator privileges** (for WSL2 installation)
- **Virtualization enabled in BIOS**

#### Optional but Recommended:
- **Windows Terminal** (better console experience)
- **VS Code** with WSL extension

---

### Linux (Ubuntu/Debian)

#### Required:
- **Ubuntu 20.04+ or Debian 10+**
- **Docker**
  - Will be installed automatically by the tool
  - Requires `sudo` privileges
- **Node.js v16 or higher**
- **curl** (auto-installed)
- **Go** (auto-installed)
- **jq** (auto-installed)
- **sudo access**

#### After Docker Installation:
```bash
# Log out and back in for group changes to take effect
# Or run:
newgrp docker
```

---

### macOS

#### Required:
- **macOS 10.15 (Catalina) or higher**
- **Homebrew**
  - Will be installed automatically by the tool
- **Docker Desktop for Mac**
  - Must be running before starting
  - Must open manually once after installation
- **Node.js v16 or higher**
- **Xcode Command Line Tools**

#### Install Xcode Tools:
```bash
xcode-select --install
```

---

## Disk Space Requirements

| Component | Size | Required |
|-----------|------|----------|
| Docker images | 4-5 GB | Yes |
| Fabric binaries | 1-2 GB | Yes |
| fabric-samples | 1-2 GB | Yes |
| Node modules | 200-500 MB | Yes |
| **Total** | **~7-10 GB** | **Yes** |

**Recommendation:** Have at least 15 GB free space to be safe.

---

## Common Issues and Solutions

### Issue 1: "jq: command not found"

**Error:**
```
/mnt/c/test/my-blockchain-app/fabric-samples/test-network/scripts/configUpdate.sh: line 35: jq: command not found
Failed to parse channel configuration
```

**Cause:** `jq` (JSON processor) is not installed in WSL/Linux

**Solution:**

**Windows (WSL):**
```bash
wsl bash -c "sudo apt-get update && sudo apt-get install -y jq"
```

**Linux:**
```bash
sudo apt-get update && sudo apt-get install -y jq
```

**macOS:**
```bash
brew install jq
```

**Note:** Future versions of create-fabric-app will install jq automatically.

---

### Issue 2: "ledger [mychannel] already exists"

**Error:**
```
Error: proposal failed (err: bad proposal response 500: cannot create ledger from genesis block: ledger [mychannel] already exists with state [ACTIVE])
After 5 attempts, peer0.org1 has failed to join channel 'mychannel'
```

**Cause:** Previous network data still exists in Docker volumes

**Solution:**

**Option 1 - Quick restart:**
```bash
npm run stop-network
npm run start-network
npm run create-channel
```

**Option 2 - Deep cleanup:**
```bash
npm run cleanup
npm run start-network
npm run create-channel
npm run deploy-chaincode
```

**Option 3 - Manual cleanup:**
```bash
cd fabric-samples/test-network
./network.sh down
docker volume prune -f
cd ../..
npm run start-network
```

**Prevention:** Always use `npm run stop-network` before stopping your work.

---

### Issue 3: "Docker is not running"

**Error:**
```
✖ Docker is not running.
  → Please start Docker Desktop (or the Docker daemon) and re-run.
```

**Cause:** Docker Desktop is not started or Docker daemon is not running

**Solution:**

**Windows:**
1. Open Docker Desktop from Start Menu
2. Wait for Docker to fully start (whale icon in system tray stops animating)
3. Verify: `docker ps` should work without errors
4. Run the tool again

**Linux:**
```bash
sudo systemctl start docker
sudo systemctl enable docker  # Auto-start on boot
```

**macOS:**
1. Open Docker Desktop from Applications
2. Wait for "Docker Desktop is running" message
3. Check menu bar for Docker icon
4. Run the tool again

---

### Issue 4: "Insufficient disk space"

**Error:**
```
✖ Insufficient disk space. Required: 10GB, Available: 5.23GB
  → Please free up some space and try again.
```

**Cause:** Not enough free disk space for Fabric installation

**Solution:**

**Clean up Docker (frees 5-7 GB):**
```bash
# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove unused containers
docker container prune -f

# Nuclear option (removes everything)
docker system prune -a --volumes -f
```

**Windows - Free up WSL space:**
```bash
# In PowerShell (as Administrator)
wsl --shutdown
# Navigate to: %LOCALAPPDATA%\Docker\wsl\data
# Delete or compress ext4.vhdx file
```

**Other options:**
- Delete old projects: `npx remove-fabric-app <old-project>`
- Clear system temp files
- Uninstall unused applications

---

### Issue 5: "chmod: command not found" (Windows)

**Error:**
```
✖ Failed to download install script.
✖ Command failed with exit code 1: chmod "+x" install-fabric.sh
'chmod' is not recognized as an internal or external command
```

**Cause:** Tool tried to run chmod on Windows host instead of inside WSL

**Solution:** This is a bug in older versions.

**Workaround:**
```bash
# Install jq first
wsl bash -c "sudo apt-get update && sudo apt-get install -y jq"

# Then manually fix the script
wsl bash -c "cd /mnt/c/path/to/your/project && chmod +x fabric-samples/test-network/*.sh"
```

**Permanent fix:** Update to latest version of create-fabric-app

---

### Issue 6: "WSL needs reboot"

**Message:**
```
WSL installed. Please REBOOT your machine, then re-run.
```

**Cause:** WSL2 was just installed and requires a system restart

**Solution:**
1. Save all your work
2. Restart Windows completely
3. After reboot, run the command again:
   ```bash
   npx create-fabric-app my-project
   ```
4. Installation will continue from where it left off

---

### Issue 7: "Path with spaces causes errors"

**Error:**
```
/mnt/c/coding: No such file or directory
```

**Cause:** Path like `C:\coding practice\project` has spaces, causing issues in bash scripts

**Solution:**

**Fixed in latest version** - The tool now handles paths with spaces correctly.

**If still having issues:**
```bash
# Use paths without spaces
cd C:\Projects
npx create-fabric-app my-blockchain-app

# Or use quotes
cd "C:\coding practice"
npx create-fabric-app my-blockchain-app
```

---

### Issue 8: "Network already exists"

**Error:**
```
Error: network fabric_test already exists
```

**Cause:** Docker network from previous run still exists

**Solution:**
```bash
npm run stop-network

# Or manually:
docker network rm fabric_test
docker network prune -f
```

---

### Issue 9: "Port already in use"

**Error:**
```
Error: bind: address already in use
```

**Cause:** Another application or old Fabric containers are using required ports (7051, 7054, 9051, etc.)

**Solution:**

**Check what's using the port:**
```bash
# Windows
netstat -ano | findstr :7051

# Linux/Mac
lsof -i :7051
```

**Stop conflicting Fabric containers:**
```bash
docker ps -a
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
```

**If another application is using the port:**
- Stop that application, or
- Modify Fabric configuration (advanced)

---

### Issue 10: "Chaincode deployment failed"

**Error:**
```
Deploying chaincode failed
Error: chaincode install failed
```

**Cause:** Multiple possible causes:
- Syntax error in chaincode
- Network not running
- Missing chaincode dependencies
- Previous deployment didn't clean up

**Solution:**

**Check syntax:**
```bash
# Check chaincode/basic/index.js for errors
# Look for missing commas, brackets, quotes
```

**Ensure network is running:**
```bash
docker ps
# Should see: peer, orderer, ca containers
```

**Clean restart:**
```bash
npm run stop-network
npm run start-network
npm run create-channel
npm run deploy-chaincode
```

**Install chaincode dependencies:**
```bash
cd chaincode/basic
npm install
cd ../..
npm run deploy-chaincode
```

---

### Issue 11: "Connection refused" / "Cannot connect to peer"

**Error:**
```
Error: failed to connect to peer
Error: 14 UNAVAILABLE: connection error
```

**Cause:** Peer containers not running or network misconfigured

**Solution:**

**Check containers:**
```bash
docker ps
```

**Expected containers:**
- peer0.org1.example.com
- peer0.org2.example.com
- orderer.example.com
- ca_org1
- ca_org2

**If containers missing:**
```bash
npm run stop-network
npm run start-network
```

**Check logs:**
```bash
docker logs peer0.org1.example.com
docker logs orderer.example.com
```

---

### Issue 12: "Permission denied" (Linux/Mac)

**Error:**
```
Error: permission denied while trying to connect to Docker daemon
```

**Cause:** Current user not in docker group

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or:
newgrp docker

# Verify
docker ps
```

---

### Issue 13: "Cannot find module '@grpc/grpc-js'"

**Error:**
```
Error: Cannot find module '@grpc/grpc-js'
```

**Cause:** Dependencies not installed

**Solution:**
```bash
npm install

# If still fails:
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 14: "TypeScript compilation errors"

**Error:**
```
error TS2307: Cannot find module
```

**Cause:** TypeScript dependencies missing or version mismatch

**Solution:**
```bash
npm install --save-dev @types/node typescript ts-node

# If using latest Node.js, you might need:
npm install --save-dev @types/node@latest
```

---

### Issue 15: "Docker Desktop requires WSL2"

**Error (Windows):**
```
Docker Desktop requires Windows Subsystem for Linux 2
```

**Solution:**
1. The tool will install WSL2 automatically
2. Or manually:
   ```powershell
   # Run as Administrator
   wsl --install
   wsl --set-default-version 2
   ```
3. Restart computer
4. Verify: `wsl --status`

---

### Issue 16: "Virtualization not enabled"

**Error:**
```
Please enable the Virtual Machine Platform Windows feature and ensure virtualization is enabled in the BIOS
```

**Cause:** Virtualization disabled in BIOS

**Solution:**
1. Restart computer
2. Enter BIOS setup (usually F2, F10, Del, or Esc during boot)
3. Find "Virtualization Technology" or "Intel VT-x" or "AMD-V"
4. Enable it
5. Save and exit
6. Boot Windows
7. Run: `wsl --install`

---

### Issue 17: "npm run client fails"

**Error:**
```
Error: No crypto materials found
```

**Cause:** Network not started or certificates not generated

**Solution:**
```bash
# Ensure complete setup
npm run start-network
npm run create-channel
npm run deploy-chaincode
npm run client
```

---

### Issue 18: "Disk quota exceeded" (WSL)

**Error:**
```
Error: write ENOSPC: disk quota exceeded
```

**Cause:** WSL virtual disk is full

**Solution:**

**Compact WSL disk:**
```powershell
# In PowerShell as Administrator
wsl --shutdown

# Navigate to
cd $env:LOCALAPPDATA\Docker\wsl\data

# Compact the disk (creates backup automatically)
Optimize-VHD -Path .\ext4.vhdx -Mode Full
```

**Increase WSL disk size:**
Create/edit `%USERPROFILE%\.wslconfig`:
```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
```

Restart: `wsl --shutdown`

---

## Verification Checklist

Before running create-fabric-app, verify:

### All Platforms:
- [ ] Node.js installed: `node --version` (v16+)
- [ ] npm installed: `npm --version`
- [ ] Docker installed: `docker --version`
- [ ] Docker running: `docker ps`
- [ ] 10+ GB free space

### Windows Additional:
- [ ] WSL2 installed: `wsl --status`
- [ ] Docker Desktop running (system tray icon)
- [ ] Virtualization enabled

### Linux Additional:
- [ ] User in docker group: `groups | grep docker`
- [ ] Docker service running: `systemctl status docker`
- [ ] sudo access available

### macOS Additional:
- [ ] Homebrew installed: `brew --version`
- [ ] Docker Desktop running (menu bar icon)
- [ ] Xcode tools: `xcode-select -p`

---

## Getting More Help

If your issue is not listed here:

1. **Check Docker logs:**
   ```bash
   docker logs <container-name>
   ```

2. **Run with debug mode:**
   ```bash
   DEBUG=1 npx create-fabric-app my-project
   ```

3. **Clean everything and start fresh:**
   ```bash
   npm run cleanup
   docker system prune -a --volumes -f
   npx remove-fabric-app my-project --force
   npx create-fabric-app my-project
   ```

4. **Check Hyperledger Fabric docs:**
   - [Prerequisites](https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html)
   - [Troubleshooting](https://hyperledger-fabric.readthedocs.io/en/latest/troubleshooting.html)

5. **Community support:**
   - [Hyperledger Discord](https://discord.gg/hyperledger)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/hyperledger-fabric)
   - [GitHub Issues](https://github.com/hyperledger/fabric/issues)

---

## Prevention Tips

1. **Always stop cleanly:**
   ```bash
   npm run stop-network
   ```

2. **Don't force quit Docker Desktop**

3. **Keep Docker Desktop updated**

4. **Regular cleanup:**
   ```bash
   npm run cleanup
   ```

5. **Monitor disk space:**
   ```bash
   docker system df
   ```

6. **One network at a time** - Stop one project before starting another

7. **Use latest tool version:**
   ```bash
   npx create-fabric-app@latest my-project
   ```

---

**Last Updated:** June 2024
