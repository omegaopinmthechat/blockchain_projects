"use client";
import { useState, useEffect } from "react";
import Web3 from "web3";
import { CERTIFICATE_HASH_ABI } from "../../../../lib/abi4";
import Link from "next/link";
import { ArrowLeft, Upload, Shield, CheckCircle } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection } from "../../../../lib/metamask";

export default function StoreCertificate() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isUniversity, setIsUniversity] = useState(false);
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkAndConnect() {
      const result = await checkPendingConnection();
      if (result?.success) {
        loadBlockchain();
      }
    }
    checkAndConnect();
  }, []);

  async function loadBlockchain() {
    const result = await connectMetaMaskWallet();
    
    if (!result.success) {
      if (result.redirecting) {
        return;
      }
      alert(result.error);
      if (result.installUrl && !isMobile()) {
        window.open(result.installUrl, '_blank');
      }
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const instance = new web3.eth.Contract(
        CERTIFICATE_HASH_ABI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_4
      );
      setContract(instance);

      const universityAddress = await instance.methods.university().call();
      setIsUniversity(universityAddress.toLowerCase() === accounts[0].toLowerCase());
    } catch (err) {
      console.error(err);
      alert("Failed to connect to blockchain");
    }
  }

  async function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setSuccess(false);

    // Generate SHA-256 hash of file
    const arrayBuffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    setFileHash(hashHex);
  }

  async function storeHash() {
    if (!contract || !account) {
      alert("Please connect wallet first");
      return;
    }

    if (!file || !fileHash) {
      alert("Please select a certificate file");
      return;
    }

    try {
      setLoading(true);
      await contract.methods.storeCertificateHash(fileHash).send({ from: account });
      setSuccess(true);
      alert("Certificate hash stored successfully on blockchain!");
    } catch (err) {
      console.error(err);
      if (err.message.includes("Hash already exists")) {
        alert("This certificate hash already exists on blockchain!");
      } else if (err.message.includes("Only university allowed")) {
        alert("Only the university can store certificate hashes!");
      } else {
        alert("Failed to store certificate hash. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlockchain();
  }, []);

  if (!isUniversity) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-red-50 via-red-100 to-red-200 flex items-center justify-center">
        <div className="bg-white border-2 border-red-300 rounded-2xl p-12 text-center max-w-md shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 min-h-10 text-red-600" />
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-red-900 mb-4">Access Denied</h2>
          <p className="text-red-700 mb-6">
            Only the university wallet can store certificate hashes.
          </p>
          <p className="text-sm text-red-600 font-mono mb-6 break-all">
            Your address: {account || "Not connected"}
          </p>
          <Link href="/university-certificate">
            <button className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-indigo-50 via-indigo-100 to-indigo-200">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link href="/university-certificate">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-indigo-400 text-indigo-900 hover:bg-indigo-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                Store Certificate Hash
              </h1>
              <p className="text-indigo-800 text-lg">University Only</p>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 inline-block">
            <p className="text-sm text-indigo-700 font-semibold mb-1">University Wallet</p>
            <p className="text-indigo-900 font-mono text-sm break-all">{account}</p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-linear-to-b from-white to-indigo-100 border-2 border-indigo-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-full mb-4">
              <Upload className="w-10 min-h-10 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-indigo-900 mb-2">
              Upload Certificate
            </h2>
            <p className="text-indigo-700">
              Select certificate file to generate and store its hash
            </p>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-indigo-800 mb-3">
              Certificate File (PDF, Image, etc.)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
            />
          </div>

          {/* File Info */}
          {file && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-indigo-700 font-semibold mb-2">Selected File:</p>
              <p className="text-indigo-900 font-medium mb-3">{file.name}</p>
              <p className="text-sm text-indigo-700 font-semibold mb-2">Generated Hash:</p>
              <p className="text-indigo-900 font-mono text-xs break-all">{fileHash}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-green-900 font-semibold">Success!</p>
                <p className="text-green-700 text-sm">Certificate hash stored on blockchain</p>
              </div>
            </div>
          )}

          {/* Store Button */}
          <button
            onClick={storeHash}
            disabled={loading || !file}
            className="w-full inline-flex items-center justify-center gap-2 min-h-12 sm:min-h-14 px-6 py-4 bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed text-lg"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            {loading ? "Storing on Blockchain..." : "Store Certificate Hash"}
          </button>

          <p className="text-xs text-indigo-700 text-center mt-4">
            Note: This action will store the certificate hash permanently on blockchain
          </p>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-linear-to-b from-white to-indigo-100 border-2 border-indigo-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-indigo-900 mb-3">Important Notes</h3>
          <ul className="space-y-2 text-indigo-800 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              The system generates SHA-256 hash from the uploaded file
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              Only the hash is stored on blockchain, not the actual file
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              Once stored, the hash cannot be removed or modified
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              Each certificate can only be stored once (duplicates rejected)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
