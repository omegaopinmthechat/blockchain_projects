# Assignment Vault - Blockchain Assignment Submission System

## Overview
Assignment Vault is a decentralized assignment submission system that creates immutable blockchain timestamps for student work. Files are stored on IPFS, and submissions are assigned to specific recipient addresses (teachers/evaluators).

## Smart Contract Address
**Sepolia Testnet:** `0x3948992e4F2379E01D2E8e53DBD71517148E2425`

## Features
- ✅ Submit assignments with IPFS file storage
- ✅ Assign submissions to specific recipient addresses
- ✅ Blockchain timestamp proves submission time
- ✅ Unique submission ID for each assignment
- ✅ Public verification of any submission
- ✅ Permanent and tamper-proof record keeping

## How It Works

### For Students (Submitting Assignments)
1. Navigate to `/assignment/submit`
2. Enter the recipient's Ethereum address (teacher/evaluator)
3. Select your assignment file to upload
4. Click "Submit Assignment"
5. File is uploaded to IPFS (decentralized storage)
6. Blockchain transaction creates immutable timestamp record
7. Receive unique submission ID for verification

### For Teachers/Verifiers
1. Navigate to `/assignment/verify`
2. Enter submission ID
3. View complete submission details:
   - Student address
   - Recipient address
   - Submission timestamp
   - IPFS CID with direct file access

## Smart Contract Functions

### `submitAssignment(address _assignedTo, string memory _cid)`
- Creates a new assignment submission
- Parameters:
  - `_assignedTo`: Ethereum address of the recipient
  - `_cid`: IPFS Content Identifier of the uploaded file
- Records: student address, recipient, IPFS CID, and block timestamp
- Emits: `AssignmentStamped` event
- Returns: Submission ID (via event logs)

### `getSubmission(uint256 _id)`
- Retrieves submission details by ID
- Parameters:
  - `_id`: Submission ID to look up
- Returns:
  - `student`: Address of the submitter
  - `assignedTo`: Address of the recipient
  - `cid`: IPFS Content Identifier
  - `timestamp`: Unix timestamp of submission

## Contract Structure

```solidity
struct Submission {
    address student;      // Who submitted
    address assignedTo;   // Who receives it
    string cid;          // IPFS file hash
    uint256 timestamp;   // When submitted
}
```

## Use Cases
- **Academic Institutions**: Track student submissions with tamper-proof timestamps
- **Freelancers**: Prove work delivery times to clients
- **Competitions/Contests**: Verify entry submission times
- **Legal Proof**: Establish intellectual property creation dates

## Frontend Pages

### Main Hub (`/assignment`)
- Overview of Assignment Vault features
- Quick access to submit and verify functions
- Contract information display

### Submit Page (`/assignment/submit`)
- Recipient address input field
- File upload interface
- IPFS upload progress
- Blockchain submission status
- Success message with submission ID

### Verify Page (`/assignment/verify`)
- Submission ID search field
- Complete submission details display
- IPFS file access buttons
- Copy functions for addresses and CID

## Configuration

### Environment Variables
Add to `.env` file:
```
NEXT_PUBLIC_CONTRACT_ADDRESS_6=0x3948992e4F2379E01D2E8e53DBD71517148E2425
```

### Backend Integration
Uses existing IPFS backend at: `https://conf-cert-backend.vercel.app/upload`

## Deployment Instructions

1. **Deploy Contract**
   - Open Remix IDE (remix.ethereum.org)
   - Create new file: `assignment.sol`
   - Paste contract code from `/confcert/assignment.sol`
   - Compile with Solidity 0.8.31+
   - Connect MetaMask to Sepolia testnet
   - Deploy contract
   - Copy contract address

2. **Update Frontend**
   - Add contract address to `.env`:
     ```
     NEXT_PUBLIC_CONTRACT_ADDRESS_6=YOUR_CONTRACT_ADDRESS
     ```
   - Restart development server

3. **Test System**
   - Submit test assignment
   - Verify submission using ID
   - Check IPFS file accessibility

## Security Features
- Address validation prevents zero address submissions
- CID validation ensures non-empty file references
- Immutable timestamps prevent backdating
- Public verification maintains transparency
- IPFS ensures tamper-proof file storage

## Technical Stack
- **Smart Contract**: Solidity 0.8.31
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Storage**: IPFS (InterPlanetary File System)
- **Frontend**: Next.js 15, React, Tailwind CSS
- **Web3**: MetaMask integration via window.ethereum

## Events

### `AssignmentStamped`
```solidity
event AssignmentStamped(
    uint256 indexed id,
    address indexed student,
    address indexed assignedTo,
    string cid,
    uint256 timestamp
);
```
Emitted when new assignment is submitted. All parameters indexed for efficient filtering.

## Gas Optimization
- String storage only for IPFS CID (necessary)
- Simple struct minimizes storage costs
- View function (getSubmission) has no gas cost
- Single transaction for complete submission

## Future Enhancements
- Bulk submission support
- Submission editing/updates
- Grade/feedback storage
- Assignment categories/courses
- Student submission history
- Teacher dashboard
- Notification system
- Mobile app integration

## License
MIT License

## Support
For issues or questions, refer to the documentation page at `/documentation`
