"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code, BookOpen, Rocket, Copy, CheckCircle, PlayCircle } from "lucide-react";

export default function Documentation() {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const videoTutorials = [
    {
      id: "metamask-wallet",
      title: "Creating a MetaMask Wallet",
      embedUrl: "https://www.youtube.com/embed/LPrLHBxqCxk",
      description: "Learn how to create and set up your MetaMask wallet for blockchain transactions"
    },
    {
      id: "deploy-contract",
      title: "Deploy Smart Contract on Sepolia ETH Testnet (Remix)",
      embedUrl: "https://www.youtube.com/embed/PrY0_EqtS7Y",
      description: "Step-by-step guide to deploying your smart contract using MetaMask on Sepolia testnet"
    },
    {
      id: "etherscan",
      title: "How to Operate Etherscan",
      embedUrl: "https://www.youtube.com/embed/0TFqwR65F94",
      description: "Master Etherscan to track transactions and verify smart contracts"
    }
  ];

  const projects = [
    {
      id: "confcert",
      name: "ConfCert - Certificate Management System",
      description: "A blockchain-based certificate issuance and verification system that stores certificate data on IPFS and metadata on blockchain.",
      address: "0x8b94D4dB48ECAec78875e9D58e132EC389Bbe5AD",
      color: "yellow",
      features: [
        "Issue individual certificates with student name and IPFS CID",
        "Bulk certificate issuance for multiple students at once",
        "Certificate verification using unique ID",
        "IPFS integration for storing certificate files",
        "Immutable record keeping on blockchain"
      ],
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract ConfCert {
    uint256 public nextId = 1000;

    struct Certificate {
        uint256 id;
        string studentName;
        string ipfsCID;
        address issuer;
    }

    mapping(uint256 => Certificate) public certificates;

    event CertificateIssued(uint256 id, string studentName, string ipfsCID);

    // Single certificate 
    function issueCertificate(
        string memory _studentName,
        string memory _ipfsCID
    ) public {
        nextId++;

        certificates[nextId] = Certificate(
            nextId,
            _studentName,
            _ipfsCID,
            msg.sender
        );

        emit CertificateIssued(nextId, _studentName, _ipfsCID);
    }

    // BULK CERTIFICATE UPLOAD
    function issueCertificatesBatch(
        string[] memory _studentNames,
        string[] memory _ipfsCIDs
    ) public {
        require(
            _studentNames.length == _ipfsCIDs.length,
            "Input array length mismatch"
        );

        for (uint256 i = 0; i < _studentNames.length; i++) {
            nextId++;

            certificates[nextId] = Certificate(
                nextId,
                _studentNames[i],
                _ipfsCIDs[i],
                msg.sender
            );

            emit CertificateIssued(nextId, _studentNames[i], _ipfsCIDs[i]);
        }
    }

    function getCertificate(uint256 _id)
        public
        view
        returns (string memory, string memory, address)
    {
        require(_id > 0 && _id <= nextId, "Certificate does not exist");

        Certificate memory cert = certificates[_id];
        return (cert.studentName, cert.ipfsCID, cert.issuer);
    }
}`,
      explanation: [
        {
          title: "State Variables",
          content: "nextId starts at 1000 and increments for each certificate. The certificates mapping stores all certificate data indexed by ID."
        },
        {
          title: "Certificate Struct",
          content: "Contains id (unique identifier), studentName (recipient name), ipfsCID (IPFS hash of certificate file), and issuer (wallet that created it)."
        },
        {
          title: "issueCertificate Function",
          content: "Creates a single certificate. Takes student name and IPFS CID as parameters, increments nextId, stores certificate data, and emits an event."
        },
        {
          title: "issueCertificatesBatch Function",
          content: "Allows bulk issuance of certificates. Takes arrays of names and CIDs, validates they have the same length, and creates multiple certificates in one transaction."
        },
        {
          title: "getCertificate Function",
          content: "View function to retrieve certificate details by ID. Returns student name, IPFS CID, and issuer address."
        }
      ]
    },
    {
      id: "voting",
      name: "Voting System - Democratic Voting",
      description: "A transparent and tamper-proof voting system where admin can add candidates and users can vote once.",
      address: "0x1514EFb55d58A80C11b11F0D4b63990E21299f78",
      color: "blue",
      features: [
        "Admin-controlled candidate management",
        "One vote per address enforcement",
        "Public vote count visibility",
        "Transparent results on blockchain",
        "Pre-loaded with sample candidates (Alice and Bob)"
      ],
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    uint public candidatesCount;
    address public admin;

    constructor() {
        admin = msg.sender;

        addCandidate("Alice");
        addCandidate("Bob");
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    function addCandidate(string memory _name) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(
            candidatesCount,
            _name,
            0
        );
    }

    function vote(uint _candidateId) public {
        require(!hasVoted[msg.sender], "Already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
    }

    function getCandidate(uint _id) public view returns (string memory, uint) {
        Candidate memory c = candidates[_id];
        return (c.name, c.voteCount);
    }
}`,
      explanation: [
        {
          title: "Candidate Struct",
          content: "Contains id (unique number), name (candidate name), and voteCount (number of votes received)."
        },
        {
          title: "State Variables",
          content: "candidates mapping stores all candidates by ID. hasVoted mapping tracks which addresses have voted. candidatesCount keeps total number of candidates. admin stores the deployer's address."
        },
        {
          title: "Constructor",
          content: "Sets msg.sender as admin and pre-adds two sample candidates (Alice and Bob) for demonstration."
        },
        {
          title: "onlyAdmin Modifier",
          content: "Restricts certain functions to only be callable by the admin address."
        },
        {
          title: "addCandidate Function",
          content: "Admin-only function to add new candidates. Increments candidatesCount, creates new Candidate struct with vote count starting at 0."
        },
        {
          title: "vote Function",
          content: "Allows any address to vote once for a valid candidate. Checks if address hasn't voted yet, validates candidate ID, marks address as voted, and increments candidate's vote count."
        },
        {
          title: "getCandidate Function",
          content: "View function to retrieve candidate name and current vote count by ID."
        }
      ]
    },
    {
      id: "donate",
      name: "Charity Donation System",
      description: "A transparent donation platform where admin approves charities, users donate, and approved charities can withdraw funds.",
      address: "0x5Ae3a0d0432e6Fb355CD278Aea1914D791d2cB97",
      color: "green",
      features: [
        "Public donation function (anyone can donate)",
        "Admin-controlled charity approval system",
        "Approved charities can withdraw to any address",
        "Track total donations and individual contributions",
        "Transparent fund management on blockchain"
      ],
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract CharityDonation {

    address public admin;

    mapping(address => uint256) public donations;
    mapping(address => bool) public approvedCharities;

    uint256 public totalDonations;

    event DonationReceived(address indexed donor, uint256 amount);
    event CharityAdded(address charity);
    event CharityRemoved(address charity);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyCharity() {
        require(approvedCharities[msg.sender], "Not an approved charity");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Donate ETH
    function donate() external payable {
        require(msg.value > 0, "Donation must be greater than 0");

        donations[msg.sender] += msg.value;
        totalDonations += msg.value;

        emit DonationReceived(msg.sender, msg.value);
    }

    // Admin approves charity wallet
    function addCharity(address _charity) external onlyAdmin {
        require(_charity != address(0), "Invalid address");
        approvedCharities[_charity] = true;
        emit CharityAdded(_charity);
    }

    // Admin removes charity
    function removeCharity(address _charity) external onlyAdmin {
        approvedCharities[_charity] = false;
        emit CharityRemoved(_charity);
    }

    // Charity withdraws funds TO ANY ADDRESS
    function withdraw(address _to, uint256 amount) external onlyCharity {
        require(_to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = payable(_to).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_to, amount);
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`,
      explanation: [
        {
          title: "State Variables",
          content: "admin stores deployer address. donations mapping tracks how much each address donated. approvedCharities mapping tracks which addresses are approved charities. totalDonations tracks cumulative donations."
        },
        {
          title: "Modifiers",
          content: "onlyAdmin restricts functions to admin only. onlyCharity restricts functions to approved charity addresses only."
        },
        {
          title: "donate Function",
          content: "Payable function allowing anyone to send ETH. Validates donation is greater than 0, adds to sender's donation record, increases totalDonations, and emits event."
        },
        {
          title: "addCharity Function",
          content: "Admin-only function to approve a charity address. Validates address is not zero address, sets approvedCharities mapping to true, emits event."
        },
        {
          title: "removeCharity Function",
          content: "Admin-only function to revoke charity approval. Sets approvedCharities mapping to false for the address."
        },
        {
          title: "withdraw Function",
          content: "Charity-only function to withdraw funds to any address. Validates recipient is not zero address, checks contract has sufficient balance, transfers ETH using call method, and emits event."
        },
        {
          title: "contractBalance Function",
          content: "View function returning current ETH balance held by the contract."
        }
      ]
    },
    {
      id: "university",
      name: "University Certificate Hash Verifier",
      description: "A hash-based certificate verification system where university stores certificate hashes and anyone can verify authenticity.",
      address: "0xFA112C9447a28Ba10d00Dcfc1B9381cBFFcF0116",
      color: "indigo",
      features: [
        "Store SHA-256 hash of certificates on blockchain",
        "University-only hash storage",
        "Public verification (anyone can check)",
        "Tamper-proof verification",
        "No file storage - only cryptographic fingerprints"
      ],
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract CertificateHashVerifier {

    address public university;

    // hash => exists
    mapping(bytes32 => bool) private certificateHashes;

    event CertificateHashStored(bytes32 hash);

    constructor() {
        university = msg.sender;
    }

    modifier onlyUniversity() {
        require(msg.sender == university, "Only university allowed");
        _;
    }

    // Store certificate hash
    function storeCertificateHash(bytes32 _hash) external onlyUniversity {
        require(!certificateHashes[_hash], "Hash already exists");
        certificateHashes[_hash] = true;
        emit CertificateHashStored(_hash);
    }

    // Public verification
    function verifyCertificate(bytes32 _hash) external view returns (bool) {
        return certificateHashes[_hash];
    }
}`,
      explanation: [
        {
          title: "State Variables",
          content: "university stores the deployer's address (the university). certificateHashes is a private mapping storing whether a hash exists (bytes32 hash to bool)."
        },
        {
          title: "Constructor",
          content: "Sets msg.sender (deployer) as the university address."
        },
        {
          title: "onlyUniversity Modifier",
          content: "Restricts certain functions to only be callable by the university address."
        },
        {
          title: "storeCertificateHash Function",
          content: "University-only function to store a certificate hash. Takes bytes32 hash as parameter, validates it doesn't already exist, sets mapping to true, emits event."
        },
        {
          title: "verifyCertificate Function",
          content: "Public view function anyone can call. Takes bytes32 hash as parameter, returns true if hash exists in mapping (certificate is authentic), false otherwise."
        },
        {
          title: "How Hashing Works",
          content: "The frontend generates SHA-256 hash from certificate file content using browser's crypto API. Only the hash (32 bytes) is stored on blockchain, not the actual file. To verify, re-hash the file and check if that hash exists."
        }
      ]
    },
    {
      id: "rental",
      name: "Smart Rental Agreement System",
      description: "A decentralized rental agreement platform where landlords create agreements, tenants deposit funds, landlords claim monthly rent, and security deposits are automatically managed.",
      address: "CONTRACT_ADDRESS_HERE",
      color: "purple",
      features: [
        "Create rental agreements with customizable terms",
        "Automatic rent payment scheduling (30-day intervals)",
        "Security deposit management with automatic release",
        "5-day claim window for monthly rent collection",
        "Transparent lease start/end tracking",
        "Immutable agreement records on blockchain"
      ],
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract SmartRentalAgreement {

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

    uint256 public agreementCount;
    mapping(uint256 => Agreement) public agreements;

    uint256 constant RENT_INTERVAL = 30 days;
    uint256 constant CLAIM_WINDOW = 5 days;

    event AgreementCreated(
        uint256 agreementId,
        address landlord,
        address tenant
    );
    event RentDeposited(uint256 agreementId, uint256 amount);
    event RentClaimed(uint256 agreementId, uint256 amount);
    event DepositReleased(uint256 agreementId, uint256 amount);

    constructor() {}

    function createAgreement(
        address _tenant,
        uint256 _monthlyRent,
        uint256 _securityDeposit,
        uint256 _leaseDuration
    ) external {
        require(_tenant != msg.sender, "Tenant cannot be landlord");
        require(_monthlyRent > 0, "Invalid rent");

        agreementCount++;

        agreements[agreementCount] = Agreement({
            landlord: msg.sender,
            tenant: _tenant,
            monthlyRent: _monthlyRent,
            securityDeposit: _securityDeposit,
            leaseStart: block.timestamp,
            leaseEnd: block.timestamp + _leaseDuration,
            lastRentClaimed: block.timestamp,
            depositReleased: false,
            active: true
        });

        emit AgreementCreated(agreementCount, msg.sender, _tenant);
    }

    function depositFunds(uint256 _agreementId) external payable {
        Agreement storage a = agreements[_agreementId];

        require(a.active, "Inactive agreement");
        require(msg.sender == a.tenant, "Only tenant");
        require(
            msg.value == a.monthlyRent + a.securityDeposit,
            "Incorrect amount"
        );

        emit RentDeposited(_agreementId, msg.value);
    }

    function claimMonthlyRent(uint256 _agreementId) external {
        Agreement storage a = agreements[_agreementId];

        require(msg.sender == a.landlord, "Only landlord");
        require(block.timestamp <= a.leaseEnd, "Lease ended");
        require(
            block.timestamp >= a.lastRentClaimed + RENT_INTERVAL,
            "Rent not due"
        );
        require(
            block.timestamp <= a.lastRentClaimed + RENT_INTERVAL + CLAIM_WINDOW,
            "Claim window missed"
        );

        a.lastRentClaimed = block.timestamp;

        (bool sent, ) = a.landlord.call{value: a.monthlyRent}("");
        require(sent, "Rent transfer failed");

        emit RentClaimed(_agreementId, a.monthlyRent);
    }

    function releaseDeposit(uint256 _agreementId) external {
        Agreement storage a = agreements[_agreementId];

        require(msg.sender == a.landlord, "Only landlord");
        require(block.timestamp >= a.leaseEnd, "Lease active");
        require(!a.depositReleased, "Already released");

        a.depositReleased = true;
        a.active = false;

        (bool sent, ) = a.tenant.call{value: a.securityDeposit}("");
        require(sent, "Deposit transfer failed");

        emit DepositReleased(_agreementId, a.securityDeposit);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}`,
      explanation: [
        {
          title: "Agreement Struct",
          content: "Contains all rental agreement details: landlord address, tenant address, monthlyRent (in wei), securityDeposit (in wei), leaseStart timestamp, leaseEnd timestamp, lastRentClaimed timestamp, depositReleased boolean, and active boolean."
        },
        {
          title: "State Variables and Constants",
          content: "agreementCount tracks total number of agreements created. agreements mapping stores all agreements by ID. RENT_INTERVAL is fixed at 30 days. CLAIM_WINDOW gives landlords 5 days to claim rent after it becomes due."
        },
        {
          title: "createAgreement Function",
          content: "Landlord creates rental agreement by specifying tenant address, monthly rent amount, security deposit amount, and lease duration in seconds. Validates tenant is not same as landlord, rent is greater than 0. Increments agreementCount, creates new Agreement struct with current timestamp as leaseStart, calculates leaseEnd, and emits event."
        },
        {
          title: "depositFunds Function",
          content: "Tenant deposits first month's rent plus security deposit in a single transaction. Validates agreement is active, caller is the tenant, and exact amount (monthlyRent + securityDeposit) is sent. Emits RentDeposited event. Funds are held by contract."
        },
        {
          title: "claimMonthlyRent Function",
          content: "Landlord claims monthly rent payment. Validates caller is landlord, lease hasn't ended, at least 30 days have passed since last claim, and claim is within 5-day window. Updates lastRentClaimed timestamp, transfers monthlyRent amount to landlord using call, and emits event. If landlord misses the 5-day window, that month's rent cannot be claimed."
        },
        {
          title: "releaseDeposit Function",
          content: "Landlord releases security deposit back to tenant after lease ends. Validates caller is landlord, lease has ended (current time >= leaseEnd), and deposit hasn't been released yet. Sets depositReleased to true, marks agreement as inactive, transfers securityDeposit to tenant, and emits event."
        },
        {
          title: "Time-Based Logic",
          content: "Contract uses block.timestamp for all time calculations. RENT_INTERVAL (30 days) determines when next rent is due. CLAIM_WINDOW (5 days) gives landlord grace period to claim rent. If landlord doesn't claim within window, they forfeit that month's rent. Tenant benefits from landlord's missed claims."
        },
        {
          title: "Security Features",
          content: "Role-based access control (only landlord or tenant can call specific functions). Prevents double claiming of rent or deposit. Validates exact payment amounts. Uses low-level call for ETH transfers with proper error handling. All funds held securely by contract until claimed or released."
        },
        {
          title: "contractBalance Function",
          content: "View function returning total ETH balance held by the contract. Useful for verifying funds are properly deposited and tracking overall contract state."
        }
      ]
    },
    {
      id: "assignment",
      name: "Assignment Vault - Timestamped Assignment Submission",
      description: "A blockchain-based assignment submission system that creates immutable timestamps for student work, stores files on IPFS, and allows assignment of work to specific recipients.",
      address: "CONTRACT_ADDRESS_HERE",
      color: "teal",
      features: [
        "Submit assignments with IPFS file storage",
        "Assign submissions to specific recipient addresses",
        "Blockchain timestamp proves submission time",
        "Unique submission ID for each assignment",
        "Public verification of any submission",
        "Permanent and tamper-proof record keeping"
      ],
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract AssignmentVault {

    struct Submission {
        address student;
        address assignedTo;   
        string cid;         
        uint256 timestamp;
    }

    uint256 public submissionCount;

    mapping(uint256 => Submission) public submissions;

    event AssignmentStamped(
        uint256 indexed id,
        address indexed student,
        address indexed assignedTo,
        string cid,
        uint256 timestamp
    );

    function submitAssignment(
        address _assignedTo,
        string memory _cid
    ) public {
        require(_assignedTo != address(0), "Invalid recipient");
        require(bytes(_cid).length > 0, "CID required");

        submissionCount++;

        submissions[submissionCount] = Submission(
            msg.sender,
            _assignedTo,
            _cid,
            block.timestamp
        );

        emit AssignmentStamped(
            submissionCount,
            msg.sender,
            _assignedTo,
            _cid,
            block.timestamp
        );
    }

    function getSubmission(uint256 _id)
        public
        view
        returns (
            address student,
            address assignedTo,
            string memory cid,
            uint256 timestamp
        )
    {
        Submission memory s = submissions[_id];
        return (s.student, s.assignedTo, s.cid, s.timestamp);
    }
}`,
      explanation: [
        {
          title: "Submission Struct",
          content: "Contains all assignment submission details: student address (who submitted), assignedTo address (recipient/teacher), cid (IPFS content identifier for the file), and timestamp (when submitted on blockchain)."
        },
        {
          title: "State Variables",
          content: "submissionCount tracks total number of assignments submitted, starting at 0 and incrementing with each new submission. submissions mapping stores all submission data indexed by submission ID."
        },
        {
          title: "AssignmentStamped Event",
          content: "Emitted whenever a new assignment is submitted. Contains indexed parameters for efficient filtering: submission id, student address, and assignedTo address. Also includes CID and timestamp for complete tracking."
        },
        {
          title: "submitAssignment Function",
          content: "Student submits an assignment by providing recipient address and IPFS CID. Validates recipient is not zero address and CID is not empty. Increments submissionCount, creates new Submission struct with msg.sender as student and current block.timestamp, stores in mapping, and emits event. Returns nothing but submission ID can be derived from event logs."
        },
        {
          title: "getSubmission Function",
          content: "Public view function to retrieve complete submission details by ID. Takes submission ID as parameter and returns tuple of (student address, assignedTo address, IPFS CID, timestamp). Anyone can call this function to verify any submission. Returns zero values if submission doesn't exist."
        },
        {
          title: "Timestamp Proof",
          content: "Uses block.timestamp to create immutable proof of submission time. Once recorded on blockchain, timestamp cannot be altered, providing definitive evidence of when assignment was submitted. This prevents disputes about late submissions or tampering with submission times."
        },
        {
          title: "IPFS Integration",
          content: "Contract stores only the IPFS CID (Content Identifier), not the actual file. The file is uploaded to IPFS separately by the frontend, which ensures decentralized storage. CID acts as a cryptographic fingerprint - if file content changes, CID changes. This ensures file integrity and permanent availability."
        },
        {
          title: "Recipient Assignment",
          content: "Each submission is assigned to a specific address (teacher, evaluator, or institution). This creates a clear record of who the work was submitted to. The assignedTo field is immutable after submission, providing accountability and proper assignment routing."
        },
        {
          title: "Use Cases",
          content: "Perfect for academic institutions to track student submissions with tamper-proof timestamps. Useful for freelancers proving work delivery times. Can be used in competitions or contests to verify entry submission times. Provides legal proof of intellectual property creation dates."
        }
      ]
    }
  ];

  const deploymentSteps = [
    {
      step: 1,
      title: "Open Remix IDE",
      content: "Go to https://remix.ethereum.org in your browser. This is the official Solidity IDE."
    },
    {
      step: 2,
      title: "Create New File",
      content: "In the File Explorer panel on left, click the file icon with plus sign. Name your file (e.g., ConfCert.sol, Voting.sol, etc.). The .sol extension is required."
    },
    {
      step: 3,
      title: "Paste Contract Code",
      content: "Copy the Solidity code from this documentation and paste it into your new file in Remix. The code will be automatically syntax highlighted."
    },
    {
      step: 4,
      title: "Compile Contract",
      content: "Click the Solidity Compiler icon (second icon in left sidebar). Select compiler version 0.8.31 or higher. Click the blue Compile button. Wait for successful compilation (green checkmark will appear)."
    },
    {
      step: 5,
      title: "Setup MetaMask",
      content: "Install MetaMask browser extension if not already installed. Create or import wallet. Switch network to Sepolia Testnet. Get free Sepolia ETH from faucet (search 'Sepolia faucet' or use https://sepoliafaucet.com)."
    },
    {
      step: 6,
      title: "Deploy Contract",
      content: "Click Deploy & Run Transactions icon (third icon in left sidebar). In ENVIRONMENT dropdown, select 'Injected Provider - MetaMask'. MetaMask will popup - click Connect. Your Sepolia account should appear. Click orange Deploy button. MetaMask will popup for transaction confirmation. Confirm transaction and wait for deployment."
    },
    {
      step: 7,
      title: "Get Contract Address",
      content: "After deployment, contract will appear under Deployed Contracts section. Click copy icon next to contract name to copy address. This address is what you paste in the frontend .env file."
    },
    {
      step: 8,
      title: "Test Contract",
      content: "In Remix, expand deployed contract to see all functions. Functions in orange are payable. Functions in red change state (require gas). Functions in blue are view functions (free to call). Test each function to ensure contract works correctly."
    }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Project Documentation
              </h1>
              <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-2">
                Complete guide to smart contracts, code explanations, and deployment
              </p>
            </div>
          </div>
        </div>

        {/* Video Tutorials Section */}
        <div className="mb-4 sm:mb-6 lg:mb-12 bg-linear-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Video Tutorials
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">
                Watch step-by-step guides to get started with blockchain development
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            {videoTutorials.map((video, index) => (
              <div key={video.id} className="bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
                <div className="relative w-full" style={{ paddingBottom: '45%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={video.embedUrl}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-200 leading-tight">
                      {video.title}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-purple-400 mb-2">Quick Tips</h3>
            <ul className="space-y-2 text-purple-200 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Watch the MetaMask tutorial first to set up your wallet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Follow the deployment guide to deploy your first smart contract
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Use Etherscan to verify and interact with deployed contracts
              </li>
            </ul>
          </div>
        </div>

        {/* Deployment Guide */}
        <div className="mb-4 sm:mb-6 lg:mb-12 bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-200">
              How to Deploy Smart Contracts on Remix IDE
            </h2>
          </div>

          <div className="space-y-6">
            {deploymentSteps.map((item) => (
              <div key={item.step} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 min-h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-200 mb-2">{item.title}</h3>
                    <p className="text-slate-400">{item.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-yellow-400 mb-2">Important Notes</h3>
            <ul className="space-y-2 text-yellow-200 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                Always test contracts on Sepolia testnet before mainnet deployment
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                Keep your contract address safe after deployment
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                The deployer address becomes admin/university for access control
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                Verify compiler version matches (0.8.31 or compatible)
              </li>
            </ul>
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-12">
          {projects.map((project) => (
            <div key={project.id} className={`bg-linear-to-b from-slate-800 to-slate-900 border-2 border-${project.color}-500/30 rounded-2xl p-4 sm:p-6 lg:p-8`}>
              {/* Project Header */}
              <div className="mb-6">
                <h2 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-${project.color}-400 mb-3`}>
                  {project.name}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base lg:text-lg mb-4">{project.description}</p>
                <div className="inline-block bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
                  <p className="text-sm text-slate-400">Contract Address</p>
                  <p className="text-slate-300 font-mono text-sm">{project.address}</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                  Key Features
                </h3>
                <ul className="space-y-2">
                  {project.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className={`text-${project.color}-400 mt-1`}>•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solidity Code */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                    <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                    Complete Solidity Code
                  </h3>
                  <button
                    onClick={() => copyToClipboard(project.code, project.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all"
                  >
                    {copiedCode === project.id ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-700 rounded-xl p-6 overflow-x-auto touch-pan-x">
                  <pre className="text-sm text-slate-300">
                    <code>{project.code}</code>
                  </pre>
                </div>
              </div>

              {/* Code Explanation */}
              <div>
                <h3 className="text-xl font-bold text-slate-200 mb-4">Code Explanation</h3>
                <div className="space-y-4">
                  {project.explanation.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                      <h4 className={`text-sm sm:text-base lg:text-lg font-bold text-${project.color}-400 mb-2`}>
                        {item.title}
                      </h4>
                      <p className="text-slate-300">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-200 mb-4">Ready to Deploy?</h3>
            <p className="text-slate-400 mb-6">
              Follow the deployment guide above and use the contract codes provided. All contracts are tested and production-ready.
            </p>
            <Link href="/">
              <button className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                Back to Projects
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
