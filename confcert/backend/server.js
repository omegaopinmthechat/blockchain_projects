import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import path from "path";
import { tmpdir } from "os";
import { ethers } from "ethers";
import crypto from "crypto";

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());

// Use /tmp directory for serverless environment
const uploadDir = process.env.VERCEL ? path.join(tmpdir(), 'uploads') : 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// ============ FAUCET CONFIGURATION ============
let provider, faucetWallet;

// Initialize faucet wallet if credentials are provided
if (process.env.SEPOLIA_RPC_URL && process.env.FAUCET_PRIVATE_KEY) {
  try {
    console.log('Initializing faucet wallet...');
    console.log('RPC URL:', process.env.SEPOLIA_RPC_URL);
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    faucetWallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
    console.log(`✅ Faucet wallet initialized: ${faucetWallet.address}`);
  } catch (error) {
    console.error('❌ Faucet initialization error:', error.message);
    console.warn('Faucet not initialized - check your configuration');
  }
} else {
  console.warn('⚠️ Faucet not configured - SEPOLIA_RPC_URL or FAUCET_PRIVATE_KEY missing');
}

// In-memory storage for rate limiting and challenges
const claims = new Map(); // IP -> timestamp
const challenges = new Map(); // sessionId -> challenge data

// Faucet configuration
const DRIP_AMOUNT = ethers.parseEther('0.05'); // 0.05 Sepolia ETH
const COOLDOWN_HOURS = 24; // 24 hours cooldown
const POW_DIFFICULTY = 4; // Number of leading zeros required

app.get('/', (req, res)=>{
    res.send("Server is ok");
})

// ============ FAUCET ENDPOINTS ============

// Get faucet info
app.get('/api/faucet/info', async (req, res) => {
  try {
    console.log('📊 Faucet info requested');
    
    if (!faucetWallet) {
      console.log('❌ Faucet wallet not initialized');
      return res.status(503).json({ 
        error: 'Faucet not configured',
        configured: false 
      });
    }

    console.log('✅ Faucet wallet exists:', faucetWallet.address);
    console.log('🔍 Fetching balance from provider...');
    
    const balance = await provider.getBalance(faucetWallet.address);
    console.log('💰 Balance fetched:', ethers.formatEther(balance), 'ETH');
    
    const response = { 
      configured: true,
      address: faucetWallet.address,
      balance: ethers.formatEther(balance),
      dripAmount: ethers.formatEther(DRIP_AMOUNT),
      cooldownHours: COOLDOWN_HOURS,
      network: 'Sepolia Testnet'
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Faucet info error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to fetch faucet info', details: error.message });
  }
});

// Generate PoW challenge
app.post('/api/faucet/challenge', (req, res) => {
  try {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const challenge = crypto.randomBytes(32).toString('hex');
    
    challenges.set(sessionId, {
      challenge,
      timestamp: Date.now(),
      difficulty: POW_DIFFICULTY
    });
    
    // Clean up old challenges (older than 15 minutes)
    const now = Date.now();
    for (const [id, data] of challenges.entries()) {
      if (now - data.timestamp > 15 * 60 * 1000) {
        challenges.delete(id);
      }
    }
    
    res.json({ 
      sessionId, 
      challenge, 
      difficulty: POW_DIFFICULTY 
    });
  } catch (error) {
    console.error('Challenge generation error:', error);
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

// Verify PoW and send ETH
app.post('/api/faucet/claim', async (req, res) => {
  const { address, sessionId, nonce } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  try {
    // Check if faucet is configured
    if (!faucetWallet) {
      return res.status(503).json({ error: 'Faucet not configured' });
    }

    // Validate Ethereum address
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    // Check rate limiting by IP
    const lastClaim = claims.get(ip);
    if (lastClaim) {
      const hoursSince = (Date.now() - lastClaim) / (1000 * 60 * 60);
      if (hoursSince < COOLDOWN_HOURS) {
        return res.status(429).json({ 
          error: `Please wait ${Math.ceil(COOLDOWN_HOURS - hoursSince)} hours before claiming again`,
          cooldownRemaining: Math.ceil((COOLDOWN_HOURS - hoursSince) * 60) // minutes
        });
      }
    }
    
    // Verify PoW solution
    const challengeData = challenges.get(sessionId);
    if (!challengeData) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }
    
    // Check if challenge is not too old (10 minutes)
    if (Date.now() - challengeData.timestamp > 10 * 60 * 1000) {
      challenges.delete(sessionId);
      return res.status(400).json({ error: 'Challenge expired, please try again' });
    }
    
    // Verify hash has required leading zeros
    const hash = crypto
      .createHash('sha256')
      .update(challengeData.challenge + nonce)
      .digest('hex');
    
    const requiredPrefix = '0'.repeat(challengeData.difficulty);
    if (!hash.startsWith(requiredPrefix)) {
      return res.status(400).json({ error: 'Invalid proof of work solution' });
    }
    
    // Check faucet balance
    const balance = await provider.getBalance(faucetWallet.address);
    if (balance < DRIP_AMOUNT) {
      return res.status(503).json({ 
        error: 'Faucet is empty, please contact administrator',
        balance: ethers.formatEther(balance)
      });
    }
    
    // Send transaction
    const tx = await faucetWallet.sendTransaction({
      to: address,
      value: DRIP_AMOUNT
    });
    
    // Update rate limiting
    claims.set(ip, Date.now());
    challenges.delete(sessionId);
    
    console.log(`Faucet claim: ${address} - TX: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    res.json({ 
      success: true, 
      txHash: tx.hash,
      amount: ethers.formatEther(DRIP_AMOUNT),
      explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
      blockNumber: receipt.blockNumber
    });
    
  } catch (error) {
    console.error('Claim error:', error);
    
    // Check if it's a known error
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(503).json({ 
        error: 'Faucet wallet has insufficient funds' 
      });
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return res.status(503).json({ 
        error: 'Network error, please try again' 
      });
    }
    
    res.status(500).json({ 
      error: 'Transaction failed', 
      details: error.message 
    });
  }
});

app.post("/upload", upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    const pinataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: "Infinity",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders(),
        },
      }
    );

    fs.unlinkSync(req.file.path); // cleanup

    const cid = pinataResponse.data.IpfsHash;

    res.json({
      success: true,
      cid,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
    });
  } catch (err) {
    console.error("PINATA ERROR:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "IPFS upload failed",
    });
  }
});

app.listen(5500, () => {
  console.log(`Backend running on port ${5500}`);
});

// Export for Vercel serverless
export default app;
