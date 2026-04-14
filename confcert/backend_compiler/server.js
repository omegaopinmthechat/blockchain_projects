const express = require("express");
const cors = require("cors");
const { compileSolidity } = require("./compiler");
const { deployContract, callFunction } = require("./executor");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─────────────────────────────────────────────
// POST /compile
// Body: { code: string, contractName?: string }
// Returns: { success, contractName, abi, bytecode, contracts, warnings, errors }
// ─────────────────────────────────────────────
app.post("/compile", (req, res) => {
  const { code, contractName } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ success: false, error: "Missing 'code' in body." });
  }

  const result = compileSolidity(code, contractName);
  return res.json(result);
});

// ─────────────────────────────────────────────
// POST /deploy
// Body: { code: string, contractName?: string, constructorArgs?: any[] }
// Compiles + deploys in one shot.
// Returns: { success, contractAddress, deployer, balance, abi, contractName, warnings }
// ─────────────────────────────────────────────
app.post("/deploy", async (req, res) => {
  const { code, contractName, constructorArgs = [] } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ success: false, error: "Missing 'code' in body." });
  }

  if (!Array.isArray(constructorArgs)) {
    return res
      .status(400)
      .json({ success: false, error: "constructorArgs must be an array." });
  }

  // Step 1: Compile
  const compiled = compileSolidity(code, contractName);
  if (!compiled.success) {
    return res.json({
      success: false,
      errors: compiled.errors,
      warnings: compiled.warnings,
      contracts: compiled.contracts || [],
    });
  }

  // Step 2: Deploy to in-memory EVM
  const deployed = await deployContract(compiled.bytecode, compiled.abi, constructorArgs);

  if (!deployed.success) {
    return res.json({ success: false, error: deployed.error, warnings: compiled.warnings });
  }

  // Store session in memory (simple map keyed by contractAddress)
  // NOTE: Not production-safe - sessions are lost on restart
  activeSessions.set(deployed.contractAddress, {
    web3: deployed.web3,
    contract: deployed.contract,
    provider: deployed.provider,
    deployer: deployed.deployer,
    accounts: deployed.accounts || [],
    abi: compiled.abi,
  });

  return res.json({
    success: true,
    contractAddress: deployed.contractAddress,
    contractName: compiled.contractName,
    deployer: deployed.deployer,
    balance: deployed.balance,
    accounts: deployed.accounts || [],
    abi: compiled.abi,
    contracts: compiled.contracts || [],
    warnings: compiled.warnings,
  });
});

// ─────────────────────────────────────────────
// POST /call
// Body: {
//   contractAddress: string,
//   functionName: string,
//   args?: any[],
//   sender?: string,
//   value?: string   (wei, for payable functions)
// }
// Returns: { success, result, gasUsed, txHash, type }
// ─────────────────────────────────────────────
app.post("/call", async (req, res) => {
  const { contractAddress, functionName, args = [], sender, value = "0" } = req.body;

  if (!contractAddress || !functionName) {
    return res
      .status(400)
      .json({ success: false, error: "Missing contractAddress or functionName." });
  }

  if (!Array.isArray(args)) {
    return res.status(400).json({ success: false, error: "args must be an array." });
  }

  const session = activeSessions.get(contractAddress);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: "Contract session not found. Please deploy first.",
    });
  }

  const from = sender && typeof sender === "string" ? sender : session.deployer;
  const result = await callFunction(session, functionName, args, from, value);
  return res.json(result);
});

// ─────────────────────────────────────────────
// POST /reset
// Body: { contractAddress: string }
// Destroys the in-memory session (frees ganache provider)
// ─────────────────────────────────────────────
app.post("/reset", async (req, res) => {
  const { contractAddress } = req.body;

  if (contractAddress && activeSessions.has(contractAddress)) {
    const session = activeSessions.get(contractAddress);
    try {
      await session.provider.disconnect();
    } catch (_) {}
    activeSessions.delete(contractAddress);
    return res.json({ success: true, message: "Session cleared." });
  }

  return res.json({ success: false, error: "Session not found." });
});

// ─────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", sessions: activeSessions.size });
});

// In-memory session store: contractAddress -> { web3, contract, provider, deployer, abi }
const activeSessions = new Map();

const PORT = process.env.PORT || 5501;
app.listen(PORT, () => {
  console.log(`\n🧪 Solidity Playground Backend running at http://localhost:${PORT}`);
  console.log(`   POST /compile  - compile solidity code`);
  console.log(`   POST /deploy   - compile + deploy to in-memory EVM`);
  console.log(`   POST /call     - call a function on deployed contract`);
  console.log(`   POST /reset    - clear a contract session`);
  console.log(`   GET  /health   - server status\n`);
});
