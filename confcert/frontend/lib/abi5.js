export const SMARt_AIRBNB_BI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "agreementId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "landlord",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "tenant",
        type: "address",
      },
    ],
    name: "AgreementCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_agreementId",
        type: "uint256",
      },
    ],
    name: "claimMonthlyRent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_tenant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_monthlyRent",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_securityDeposit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_leaseDuration",
        type: "uint256",
      },
    ],
    name: "createAgreement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_agreementId",
        type: "uint256",
      },
    ],
    name: "depositFunds",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "agreementId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "DepositReleased",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_agreementId",
        type: "uint256",
      },
    ],
    name: "releaseDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "agreementId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "RentClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "agreementId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "RentDeposited",
    type: "event",
  },
  {
    inputs: [],
    name: "agreementCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "agreements",
    outputs: [
      {
        internalType: "address",
        name: "landlord",
        type: "address",
      },
      {
        internalType: "address",
        name: "tenant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "monthlyRent",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "securityDeposit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "leaseStart",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "leaseEnd",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastRentClaimed",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "depositReleased",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "contractBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
