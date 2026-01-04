# 🏠 Blockchain Rental Agreement System

## Overview
The Blockchain Rental Agreement is a smart contract-based system that automates rental property management on the Ethereum blockchain. It provides a trustless, transparent platform for landlords and tenants to manage rental agreements, monthly payments, and security deposits.

## How It Works

### 1️⃣ **Agreement Creation (Landlord)**
- **Who**: Property owner/landlord
- **Action**: Creates a new rental agreement
- **Required Information**:
  - Tenant's Ethereum wallet address
  - Monthly rent amount (in ETH)
  - Security deposit amount (in ETH)
  - Lease duration (in days)
- **Result**: A new agreement is created on the blockchain with a unique ID
- **Blockchain Event**: `AgreementCreated` event is emitted

### 2️⃣ **Initial Fund Deposit (Tenant)**
- **Who**: Tenant
- **Action**: Deposits initial funds to activate the agreement
- **Amount**: First month's rent + Security deposit
- **Example**: If rent is 0.1 ETH and deposit is 0.2 ETH, tenant pays 0.3 ETH
- **Result**: Agreement becomes active
- **Blockchain Event**: `RentDeposited` event is emitted

### 3️⃣ **Monthly Rent Collection (Landlord)**
- **Who**: Landlord
- **Action**: Claims monthly rent payment
- **Timing Rules**:
  - ✅ Can claim every 30 days after last claim
  - ⏰ Has a 5-day window to claim
  - ❌ If window is missed, that month's rent cannot be claimed
- **Amount**: Monthly rent amount (set in agreement)
- **Result**: Rent is transferred to landlord's wallet
- **Blockchain Event**: `RentClaimed` event is emitted

### 4️⃣ **Security Deposit Release (Landlord)**
- **Who**: Landlord
- **Action**: Releases security deposit back to tenant
- **When**: After lease end date
- **Amount**: Full security deposit amount
- **Result**: Deposit returned to tenant, agreement marked inactive
- **Blockchain Event**: `DepositReleased` event is emitted

## Smart Contract Features

### Time-Based Automation
```
RENT_INTERVAL = 30 days
CLAIM_WINDOW = 5 days
```

- Rent can only be claimed once per 30-day period
- Landlord has 5 days after the 30-day mark to claim
- If claim window is missed, rent for that period is forfeited

### Security Features
- ✅ Tenant cannot be the same as landlord
- ✅ Only tenant can deposit funds
- ✅ Only landlord can claim rent and release deposit
- ✅ Deposits must match exact amounts
- ✅ Rent can only be claimed during active lease
- ✅ Deposit can only be released once
- ✅ All transactions are on-chain and verifiable

### Agreement States
- **Active**: Lease is ongoing, rent can be claimed
- **Inactive**: Lease ended or deposit released
- **Deposit Released**: Security deposit returned, agreement closed

## Frontend Pages

### 1. Main Dashboard (`/rental`)
- View all your rental agreements (as landlord or tenant)
- See agreement details:
  - Monthly rent amount
  - Security deposit amount
  - Lease start and end dates
  - Days remaining
  - Last rent claim date
- Quick action buttons for each agreement

### 2. Create Agreement (`/rental/create`)
- Landlords create new rental agreements
- Input tenant address, rent, deposit, and duration
- Transaction creates agreement on blockchain

### 3. Deposit Funds (`/rental/deposit/[id]`)
- Tenants deposit initial funds
- Shows breakdown: rent + security deposit
- Activates the agreement

### 4. Claim Rent (`/rental/claim/[id]`)
- Landlords claim monthly rent
- Shows claim timing information
- Displays next available claim date and deadline

### 5. Release Deposit (`/rental/release/[id]`)
- Landlords release security deposit to tenant
- Only available after lease ends
- Closes the agreement permanently

## User Roles

### Landlord (Agreement Creator)
**Can do:**
- ✅ Create new agreements
- ✅ Claim monthly rent (within time windows)
- ✅ Release security deposit (after lease ends)

**Cannot do:**
- ❌ Deposit funds
- ❌ Claim rent outside time window
- ❌ Release deposit before lease ends
- ❌ Release deposit twice

### Tenant (Specified in Agreement)
**Can do:**
- ✅ Deposit initial funds (rent + security deposit)
- ✅ View agreement details

**Cannot do:**
- ❌ Claim rent
- ❌ Release deposit
- ❌ Modify agreement terms

## Example Flow

### Scenario: 1-Year Apartment Rental

**Step 1: Agreement Creation**
```
Landlord creates agreement:
- Tenant: 0xABC...
- Monthly Rent: 0.1 ETH
- Security Deposit: 0.2 ETH  
- Duration: 365 days
```

**Step 2: Tenant Activation**
```
Tenant deposits: 0.3 ETH (0.1 + 0.2)
Agreement becomes active
Lease starts: January 1, 2026
Lease ends: December 31, 2026
```

**Step 3: Monthly Rent (12 times)**
```
January 31: Landlord claims 0.1 ETH ✅
February 28: Landlord claims 0.1 ETH ✅
March 30: Landlord claims 0.1 ETH ✅
... (continues monthly)
December 30: Landlord claims 0.1 ETH ✅
```

**Step 4: Lease End**
```
January 1, 2027: Lease ends
Landlord releases 0.2 ETH deposit back to tenant
Agreement closed
```

## Key Advantages

### For Landlords
- 🏦 Automated rent collection
- ⏱️ Predictable payment schedule
- 🔒 Security deposit held in escrow
- 📊 Transparent transaction history
- 🌐 No bank intermediaries

### For Tenants
- 🛡️ Protected security deposit
- 📝 Clear lease terms
- 🔐 Tamper-proof agreement
- 💰 Guaranteed deposit return (if terms met)
- 📱 Easy payment tracking

### For Both
- ⚖️ No disputes over payment dates
- 🌍 Works globally
- 💸 Lower transaction fees than traditional methods
- 🔍 Full transparency
- ⚡ Fast, instant transactions

## Technical Details

### Smart Contract
- **Network**: Ethereum Sepolia Testnet
- **Language**: Solidity ^0.8.31
- **License**: MIT

### Events Emitted
```solidity
AgreementCreated(agreementId, landlord, tenant)
RentDeposited(agreementId, amount)
RentClaimed(agreementId, amount)
DepositReleased(agreementId, amount)
```

### State Variables
```solidity
struct Agreement {
    address landlord;
    address tenant;
    uint256 monthlyRent;
    uint256 securityDeposit;
    uint256 leaseStart;
    uint256 leaseEnd;
    uint256 lastRentClaimed;
    bool depositReleased;
    bool active;
}
```

## Deployment

### Prerequisites
1. MetaMask wallet installed
2. Sepolia ETH for gas fees
3. Contract deployed to Sepolia network

### Environment Variables
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS_5=0xd45ac046ddF3082a25a3c65F60111d0c80d7F47F
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Safety Tips

### For Landlords
- ⚠️ Double-check tenant address before creating agreement
- ⏰ Set reminders to claim rent within the 5-day window
- 📅 Release deposit promptly after lease ends
- 🔐 Keep your private keys secure

### For Tenants
- ✅ Verify agreement details before depositing
- 💰 Ensure you have enough ETH for gas fees
- 📋 Keep records of transaction hashes
- 🤝 Communicate with landlord off-chain about property issues

## Limitations & Considerations

1. **Gas Fees**: All transactions require ETH for gas
2. **Immutable Terms**: Agreement terms cannot be changed once created
3. **No Dispute Resolution**: Smart contract cannot handle subjective disputes
4. **Network Dependency**: Requires Ethereum network availability
5. **Price Volatility**: ETH price fluctuations affect real value
6. **Time Windows**: Strict 30-day + 5-day claim windows
7. **No Property Verification**: Contract doesn't verify physical property exists

## Future Enhancements

- 🔄 Support for rent adjustments
- 🏡 Multiple properties per landlord
- 💳 Integration with stablecoins (USDC, DAI)
- 📊 Analytics dashboard
- 🔔 Email/SMS notifications for claim windows
- ⚖️ Dispute arbitration system
- 📄 IPFS integration for lease documents
- 🌐 Multi-chain support

## Support & Resources

- **Contract Address**: `0xd45ac046ddF3082a25a3c65F60111d0c80d7F47F`
- **Network**: Sepolia Testnet
- **Block Explorer**: [Sepolia Etherscan](https://sepolia.etherscan.io)

---

**Note**: This is a demonstration project on the Sepolia testnet. For production use, conduct thorough security audits and legal review.
