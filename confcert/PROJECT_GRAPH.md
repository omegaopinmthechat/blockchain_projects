# 🗺️ Project Structure Graph

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFCERT BLOCKCHAIN PROJECT                  │
│                     (Smart Contract Platform)                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌───────────┐    ┌───────────┐    ┌───────────┐
        │  FRONTEND │    │  BACKEND  │    │  DESKTOP  │
        │  (Next.js)│    │ (Node.js) │    │ (Electron)│
        └───────────┘    └───────────┘    └───────────┘
```

---

## 🎯 Component Breakdown

### 1️⃣ **Frontend** (Web Application)
```
frontend/
│
├── 🌐 Next.js App Router
│   ├── /solidity-lab          → Online Solidity IDE
│   ├── /offline-playground    → Desktop App Download Page
│   ├── /confcert              → Certificate Management
│   ├── /assignment            → Assignment Vault
│   ├── /rental                → Rental Agreement
│   ├── /voting                → Voting System
│   ├── /university-certificate → University Certificates
│   ├── /faucet                → Test Token Faucet
│   ├── /donate                → Donation System
│   ├── /feedback              → User Feedback
│   ├── /documentation         → Docs
│   └── /support               → Support Page
│
├── 🔌 API Routes
│   └── /api/releases/latest   → GitHub Release Fetcher (LTS & Latest)
│
├── 📚 Libraries
│   ├── abi.js - abi6.js       → Smart Contract ABIs
│   └── metamask.js            → Web3 Wallet Integration
│
└── 🎨 Components
    ├── AppSidebar             → Navigation
    ├── StarBackground         → Visual Effects
    ├── GlobalWalletSwitcher   → Wallet Connection
    └── UI Components          → Reusable UI Elements
```

**Tech Stack:**
- ⚛️ Next.js 14 (App Router)
- 🎨 Tailwind CSS
- 🔗 Web3.js / Ethers.js
- 🌟 Framer Motion

---

### 2️⃣ **Backend** (API Services)

#### **Main Backend** (`backend/`)
```
backend/
│
├── 📤 File Upload Service
│   └── uploads/               → Temporary file storage
│
├── 🔐 Environment Config
│   └── .env                   → API Keys & Secrets
│
└── 🚀 Express Server
    └── server.js              → REST API Endpoints
```

#### **Compiler Backend** (`backend_compiler/`)
```
backend_compiler/
│
├── 🔨 Solidity Compiler
│   └── compiler.js            → solc wrapper
│
├── ⚡ Contract Executor
│   └── executor.js            → Ganache/Web3 execution
│
└── 🌐 API Server
    └── server.js              → Compile & Deploy endpoints
```

#### **Feedback Backend** (`backend-feedback/`)
```
backend-feedback/
│
├── 💬 Feedback Collection
│   └── server.js              → User feedback API
│
└── 🔐 Environment Config
    └── .env                   → Database credentials
```

**Tech Stack:**
- 🟢 Node.js + Express
- 🔧 solc (Solidity Compiler)
- ⛓️ Ganache (Local Blockchain)
- 🗄️ MongoDB (Feedback storage)

---

### 3️⃣ **Desktop App** (Electron)

```
electron-compiler/
│
├── 🖥️ Main Process
│   ├── main.js                → Window management, auto-updater
│   └── preload.js             → IPC bridge (secure context)
│
├── 🎨 Renderer Process
│   ├── index.html             → UI structure
│   └── renderer.js            → Monaco Editor, UI logic
│
├── ⚙️ Backend Engine
│   ├── compiler.js            → Offline Solidity compiler
│   ├── executor.js            → In-memory EVM (Ganache)
│   └── package.json           → Backend dependencies
│
├── 🎨 Assets
│   └── final_icon.ico/png     → App icons
│
└── 📦 Build Config
    ├── package.json           → electron-builder config
    ├── version.js             → Centralized version (1.1.4)
    └── sync-version.js        → Version sync script
```

**Features:**
- 📝 Monaco Editor (VS Code engine)
- 🎨 VS Code Material Theme icons
- 🔄 Auto-updater (GitHub releases)
- 📂 File manager with folder support
- 🧪 In-memory EVM testing
- 🌓 Dark/Light themes
- 📑 Multi-tab editor

**Tech Stack:**
- ⚡ Electron 28+
- 📝 Monaco Editor
- 🔧 solc (Solidity Compiler)
- ⛓️ Ganache Core (In-memory blockchain)

---

## 🔗 Data Flow Diagrams

### **Web IDE Flow**
```
┌─────────┐      ┌──────────────┐      ┌─────────────┐
│ Browser │─────▶│ Frontend     │─────▶│ Backend     │
│ (User)  │      │ (Solidity    │      │ Compiler    │
└─────────┘      │  Lab)        │      │ Service     │
                 └──────────────┘      └─────────────┘
                        │                      │
                        │                      ▼
                        │              ┌─────────────┐
                        │              │ solc +      │
                        │              │ Ganache     │
                        │              └─────────────┘
                        │                      │
                        │◀─────────────────────┘
                        │   (Compiled ABI + Bytecode)
                        │
                        ▼
                 ┌──────────────┐
                 │ MetaMask     │
                 │ (Deploy to   │
                 │  Testnet)    │
                 └──────────────┘
```

### **Desktop App Flow**
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Electron    │─────▶│ Renderer     │─────▶│ Main        │
│ Window      │      │ (Monaco      │      │ Process     │
│ (User)      │      │  Editor)     │      │ (IPC)       │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            │                      ▼
                            │              ┌─────────────┐
                            │              │ Backend     │
                            │              │ Engine      │
                            │              │ (In-memory) │
                            │              └─────────────┘
                            │                      │
                            │◀─────────────────────┘
                            │   (Compile + Deploy Results)
                            │
                            ▼
                     ┌──────────────┐
                     │ File System  │
                     │ (Save/Load)  │
                     └──────────────┘
```

### **Auto-Update Flow**
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Electron    │─────▶│ Auto-Updater │─────▶│ GitHub      │
│ App Startup │      │ (Check)      │      │ Releases    │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            │◀─────────────────────┘
                            │   (latest.yml + .exe)
                            │
                            ▼
                     ┌──────────────┐
                     │ User Consent │
                     │ Dialog       │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Download +   │
                     │ Install      │
                     └──────────────┘
```

---

## 📦 Smart Contracts

```
Root Directory/
│
├── ConfCert.sol           → Certificate Management
├── assignment.sol         → Assignment Vault
├── rentalagree.sol        → Rental Agreements
├── voting.sol             → Voting System
├── donate.sol             → Donation Platform
├── cert.sol               → Generic Certificates
├── landReg.sol            → Land Registry
└── nft.sol                → NFT Implementation
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCTION                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Vercel     │      │   Vercel     │      │   GitHub     │
│  (Frontend)  │      │  (Backend)   │      │  (Releases)  │
│              │      │              │      │              │
│ • Next.js    │      │ • Serverless │      │ • Desktop    │
│ • Static     │      │ • Functions  │      │   Installer  │
│ • Edge       │      │ • API Routes │      │ • Auto-update│
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Blockchain     │
                    │   (Sepolia/      │
                    │    Mainnet)      │
                    └──────────────────┘
```

---

## 🔑 Key Features by Component

### **Frontend**
- ✅ Multi-page Next.js application
- ✅ Web3 wallet integration (MetaMask)
- ✅ Online Solidity IDE
- ✅ Smart contract interaction UI
- ✅ GitHub release API integration
- ✅ LTS version management

### **Backend**
- ✅ Solidity compilation service
- ✅ Contract deployment to Ganache
- ✅ File upload handling
- ✅ Feedback collection API
- ✅ RESTful API endpoints

### **Desktop App**
- ✅ Offline Solidity development
- ✅ Monaco Editor integration
- ✅ File manager with folder support
- ✅ In-memory EVM testing
- ✅ Auto-updater with user consent
- ✅ Multi-tab editor
- ✅ Dark/Light themes
- ✅ VS Code Material Theme icons

---

## 📊 Version Management

```
Current Version: 1.1.4

Version History:
├── v1.0.0 → Initial release (deprecated)
├── v1.1.0 → LTS (Long Term Support) - Stable
├── v1.1.1 → Bug fixes
├── v1.1.2 → UI improvements
├── v1.1.3 → File manager redesign
└── v1.1.4 → Auto-updater + New filename format
             (Solidity-Playground-Installer-1.1.4.exe)
```

---

## 🛠️ Development Workflow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Local     │─────▶│   GitHub    │─────▶│   Vercel    │
│ Development │      │ Repository  │      │   Deploy    │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   GitHub    │
                     │   Actions   │
                     │   (CI/CD)   │
                     └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Release   │
                     │   (Desktop) │
                     └─────────────┘
```

---

## 📝 Notes

- **Frontend**: Hosted on Vercel with automatic deployments
- **Backend**: Serverless functions on Vercel
- **Desktop**: Distributed via GitHub Releases
- **Smart Contracts**: Deployed on Ethereum testnets (Sepolia)
- **Version Control**: Git with GitHub
- **Package Manager**: npm
- **Build Tool**: electron-builder (Desktop)

---

**Generated**: 2024
**Project**: ConfCert Blockchain Platform
**Maintainer**: omegaopinmthechat
