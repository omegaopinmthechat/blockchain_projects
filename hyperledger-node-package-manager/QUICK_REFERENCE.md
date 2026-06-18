# Quick Reference Card

## Essential Commands

### Create Project
```bash
npx create-fabric-app <project-name>
```

### Start Development
```bash
cd <project-name>
npm run start-network      # Start blockchain
npm run create-channel     # Create channel
npm run deploy-chaincode   # Deploy smart contract
npm run client             # Run application
```

### Daily Development
```bash
# Edit: chaincode/basic/index.js
npm run deploy-chaincode   # Redeploy after changes
npm run client             # Test changes
```

### Stop & Cleanup
```bash
npm run stop-network       # Stop network
npm run cleanup            # Deep cleanup + free space
```

### Remove Project
```bash
npx remove-fabric-app <project-name>
npx remove-fabric-app <project-name> --keep-images
npx remove-fabric-app <project-name> --force
```

---

## File Structure

```
your-project/
├── chaincode/basic/index.js    ← Edit your smart contract
├── app/index.ts                ← Edit your client app
├── scripts/                    ← Network management
└── fabric-samples/             ← Auto-generated (don't edit)
```

---

## Smart Contract Functions

Available in `chaincode/basic/index.js`:

- `InitLedger()` - Initialize sample data
- `CreateAsset(id, color, size, owner, value)` - Create asset
- `ReadAsset(id)` - Read asset
- `UpdateAsset(id, color, size, owner, value)` - Update asset
- `DeleteAsset(id)` - Delete asset
- `TransferAsset(id, newOwner)` - Transfer ownership
- `GetAllAssets()` - Get all assets
- `GetAssetHistory(id)` - Get history

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Docker not running | Start Docker Desktop |
| Network exists | `npm run stop-network` then restart |
| Deployment failed | Check syntax, then redeploy |
| Connection refused | Restart network |
| Out of space | `npm run cleanup` |

---

## Docker Commands

```bash
docker ps                    # View running containers
docker ps -a                 # View all containers
docker logs <container>      # View logs
docker images                # View images
docker system df             # Check disk usage
```

---

## Getting Help

📖 [Full User Guide](./USER_GUIDE.md)
📚 [Fabric Docs](https://hyperledger-fabric.readthedocs.io/)
💬 [Discord](https://discord.gg/hyperledger)

---

**Print this card and keep it handy! 📋**
