"use client"
import { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import { CONF_CERT_ABI } from "../../../../lib/abi.js";
import Link from "next/link";
import { Upload, Wallet, ArrowLeft, Loader2 } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection } from "../../../../lib/metamask";

export default function Issue() {
  const [account, setAccount] = useState("");
  const [studentName, setStudentName] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAndConnect() {
      const result = await checkPendingConnection();
      if (result?.success) {
        setAccount(result.accounts[0]);
      }
    }
    checkAndConnect();
  }, []);

  async function connectWallet() {
    const result = await connectMetaMaskWallet();
    
    if (!result.success) {
      if (result.redirecting) {
        setStatus("Opening MetaMask app...");
        return;
      }
      alert(result.error);
      if (result.installUrl && !isMobile()) {
        window.open(result.installUrl, '_blank');
      }
      return;
    }
    
    setAccount(result.accounts[0]);
  }
  
  async function ensureSepoliaNetwork() {
    const sepoliaChainId = "0xaa36a7"; // Sepolia

    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (currentChainId !== sepoliaChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: sepoliaChainId }],
        });
      } catch (switchError) {
        // Sepolia not added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: sepoliaChainId,
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  }

  async function issueCertificate() {
    if (!account) return alert("Connect MetaMask first");
    if (!studentName.trim()) return alert("Enter student name");
    if (!file) return alert("Select a file");

    await ensureSepoliaNetwork();

    try {
      setLoading(true);
      setStatus("Uploading to IPFS...");

      const formData = new FormData();
      formData.append("certificate", file);

      const uploadRes = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`,
        formData
      );

      const cid = uploadRes.data.cid;

      setStatus("Sending transaction...");

      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        CONF_CERT_ABI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );

      const receipt = await contract.methods
        .issueCertificate(studentName, cid)
        .send({ from: account });

      console.log("Receipt:", receipt);
      
      // Get certificate ID from events
      let certificateId = null;
      
      // Try multiple methods to get the event
      if (receipt.events && receipt.events.CertificateIssued) {
        certificateId = receipt.events.CertificateIssued.returnValues.id;
        console.log("Got ID from receipt.events:", certificateId);
      } 
      
      // Try parsing logs directly
      if (!certificateId && receipt.logs && receipt.logs.length > 0) {
        const web3 = new Web3(window.ethereum);
        receipt.logs.forEach(log => {
          try {
            const decoded = web3.eth.abi.decodeLog(
              [
                { type: 'uint256', name: 'id', indexed: false },
                { type: 'string', name: 'studentName', indexed: false },
                { type: 'string', name: 'ipfsCID', indexed: false }
              ],
              log.data,
              log.topics.slice(1)
            );
            if (decoded.id) {
              certificateId = decoded.id;
              console.log("Got ID from logs:", certificateId);
            }
          } catch (e) {
            // Skip if not the right event
          }
        });
      }
      
      // Fallback: get events from the transaction
      if (!certificateId) {
        const events = await contract.getPastEvents('CertificateIssued', {
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber
        });
        
        if (events.length > 0) {
          const event = events.find(e => e.transactionHash === receipt.transactionHash);
          if (event) {
            certificateId = event.returnValues.id;
            console.log("Got ID from getPastEvents:", certificateId);
          }
        }
      }

      setStatus(
        certificateId 
          ? `Certificate issued successfully! ID: ${certificateId}`
          : "Certificate issued successfully!"
      );
    } catch (err) {
      console.error(err);
      setStatus("Certificate issuance failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-yellow-50 via-yellow-100 to-yellow-200">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link href="/confcert">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-yellow-400 text-yellow-900 hover:bg-yellow-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-linear-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Issue Certificate
          </h1>
          <p className="text-yellow-800 text-lg">
            Upload and issue a certificate on the blockchain
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-linear-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-6">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-900 mb-2">Certificate Details</h3>
            <p className="text-sm text-yellow-800">
              Connect your wallet and fill in the certificate information
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Wallet Connection */}
            {!account ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-16 h-16 bg-linear-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <p className="text-yellow-800 text-center">
                  Connect your MetaMask wallet to continue
                </p>
                <button onClick={connectWallet} className="inline-flex items-center justify-center gap-2 min-h-12 sm:min-h-14 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  Connect MetaMask
                </button>
              </div>
            ) : (
              <div className="p-4 bg-linear-to-r from-yellow-100 to-yellow-200 rounded-xl border-2 border-yellow-300">
                <p className="text-sm text-yellow-700 mb-1 font-semibold">Connected Wallet</p>
                <p className="text-yellow-900 font-mono text-sm break-all">{account}</p>
              </div>
            )}

            {/* Form Fields */}
            {account && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-yellow-900">
                    Student Name
                  </label>
                  <input
                    placeholder="Enter student's full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    disabled={loading}
                    className="flex min-h-11 sm:min-h-12 w-full rounded-xl border-2 border-yellow-200 bg-white px-4 py-2 text-base text-yellow-900 placeholder:text-yellow-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-yellow-900">
                    Certificate File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      disabled={loading}
                      className="flex min-h-11 sm:min-h-12 w-full rounded-xl border-2 border-yellow-200 bg-white px-4 py-2 text-base text-yellow-900 placeholder:text-yellow-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    />
                    {file && (
                      <p className="mt-2 text-sm text-yellow-700 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {file.name}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={issueCertificate}
                  disabled={loading || !studentName || !file}
                  className="inline-flex items-center justify-center gap-2 w-full min-h-12 sm:min-h-14 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      Issue Certificate
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className={`bg-linear-to-b from-white to-yellow-100 border-2 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] ${status.includes("successfully") ? "border-green-500 from-green-50" : status.includes("failed") ? "border-red-500 from-red-50" : "border-yellow-200"}`}>
            <p className={`text-center font-semibold ${status.includes("successfully") ? "text-green-700" : status.includes("failed") ? "text-red-700" : "text-yellow-800"}`}>
              {status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
