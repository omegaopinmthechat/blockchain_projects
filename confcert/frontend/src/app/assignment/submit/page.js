"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Send, CheckCircle, AlertCircle, Loader2, FileText, Smartphone } from "lucide-react";
import { ASSIGNMENT_ABI } from "../../../../lib/abi6";
import Web3 from "web3";
import { isMobile } from "../../../../lib/metamask";

export default function SubmitAssignment() {
  const [file, setFile] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState(null);
  const [ipfsCid, setIpfsCid] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setStatus("");
      setSubmissionId(null);
    }
  };

  const handleAddressChange = (e) => {
    setRecipientAddress(e.target.value);
    setError("");
  };

  const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const uploadToIPFS = async () => {
    if (!file) {
      setError("Please select a file");
      return null;
    }

    setUploading(true);
    setStatus("Uploading to IPFS...");

    try {
      const formData = new FormData();
      formData.append("certificate", file);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${backendUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("IPFS upload failed");
      }

      const data = await response.json();
      setIpfsCid(data.cid);
      setStatus(`File uploaded to IPFS: ${data.cid}`);
      setUploading(false);
      return data.cid;
    } catch (err) {
      setError("Failed to upload file to IPFS: " + err.message);
      setUploading(false);
      return null;
    }
  };

  const submitToBlockchain = async (cid) => {
    if (!window.ethereum) {
      setError("MetaMask not found. Please install MetaMask.");
      return;
    }

    if (!validateAddress(recipientAddress)) {
      setError("Invalid recipient address. Please enter a valid Ethereum address.");
      return;
    }

    setSubmitting(true);
    setStatus("Waiting for blockchain confirmation...");

    try {
      const web3 = new Web3(window.ethereum);
      
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_6;

      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      const contract = new web3.eth.Contract(ASSIGNMENT_ABI, contractAddress);

      // Call the contract method
      const receipt = await contract.methods
        .submitAssignment(recipientAddress, cid)
        .send({ from: accounts[0] });

      // Parse submission ID from logs
      if (receipt.events && receipt.events.AssignmentStamped) {
        const id = receipt.events.AssignmentStamped.returnValues.id;
        setSubmissionId(Number(id));
      }
      
      setStatus("Assignment submitted successfully!");
      setSubmitting(false);
    } catch (err) {
      setError("Blockchain submission failed: " + err.message);
      setSubmitting(false);
    }
  };

  const encodeSubmitAssignment = (assignedTo, cid) => {
    // Function selector for submitAssignment(address,string)
    const functionSelector = "0x9a12d69a";

    // Encode address (remove 0x and pad to 32 bytes)
    const addressParam = assignedTo.slice(2).padStart(64, "0");

    // Encode string offset (0x40 = 64 bytes, where string data starts)
    const stringOffset = "0000000000000000000000000000000000000000000000000000000000000040";

    // Encode string length
    const stringLength = cid.length.toString(16).padStart(64, "0");

    // Encode string data (convert to hex and pad to multiple of 32 bytes)
    let stringData = "";
    for (let i = 0; i < cid.length; i++) {
      stringData += cid.charCodeAt(i).toString(16).padStart(2, "0");
    }
    // Pad to multiple of 32 bytes
    const paddingLength = 64 - (stringData.length % 64);
    if (paddingLength < 64) {
      stringData += "0".repeat(paddingLength);
    }

    return functionSelector + addressParam + stringOffset + stringLength + stringData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!recipientAddress) {
      setError("Please enter recipient address");
      return;
    }

    if (!validateAddress(recipientAddress)) {
      setError("Invalid recipient address format");
      return;
    }

    setError("");
    setSubmissionId(null);

    // Step 1: Upload to IPFS
    const cid = await uploadToIPFS();
    if (!cid) return;

    // Step 2: Submit to blockchain
    await submitToBlockchain(cid);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/assignment">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Assignment Vault
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Submit Assignment
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2">
                Upload your assignment and create blockchain timestamp
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-teal-500/30 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Address Input */}
            <div>
              <label className="block text-slate-200 font-semibold mb-3">
                Recipient Address (Teacher/Evaluator)
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={handleAddressChange}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-mono text-sm"
                disabled={uploading || submitting}
              />
              <p className="text-slate-400 text-sm mt-2">
                Enter the Ethereum address of the person who will receive this assignment
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-slate-200 font-semibold mb-3">
                Assignment File
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading || submitting}
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-3 w-full px-6 py-8 bg-slate-900 border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-xl cursor-pointer transition-all group"
                >
                  <FileText className="w-8 h-8 text-slate-500 group-hover:text-teal-400 transition-colors" />
                  <div className="text-center">
                    <p className="text-slate-300 font-semibold">
                      {file ? file.name : "Click to select file"}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      PDF, DOC, ZIP, or any file type
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !recipientAddress || uploading || submitting}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading || submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading ? "Uploading to IPFS..." : "Submitting to Blockchain..."}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Assignment
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {status && !error && (
            <div className="mt-6 bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-teal-400 font-semibold">Success</p>
                <p className="text-slate-300 text-sm mt-1">{status}</p>
                {ipfsCid && (
                  <p className="text-slate-400 text-xs mt-2 font-mono break-all">
                    IPFS CID: {ipfsCid}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold">Error</p>
                <p className="text-slate-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Card with Submission ID */}
          {submissionId && (
            <div className="mt-6 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-2 border-teal-500 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-teal-400" />
                <h3 className="text-xl font-bold text-teal-400">Submission Complete!</h3>
              </div>
              <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 mb-4">
                <p className="text-slate-400 text-sm mb-2">Submission ID</p>
                <p className="text-2xl font-bold text-slate-200">{submissionId}</p>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  Assignment uploaded to IPFS
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  Blockchain timestamp recorded
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  Assigned to: {recipientAddress}
                </p>
              </div>
              <Link href="/assignment/verify">
                <button className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-all">
                  Verify Your Submission
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-3">How It Works</h3>
          <div className="space-y-3 text-slate-400 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-teal-400 font-bold">1.</span>
              Enter the recipient&apos;s Ethereum address (teacher/evaluator)
            </p>
            <p className="flex items-start gap-2">
              <span className="text-teal-400 font-bold">2.</span>
              Select your assignment file to upload
            </p>
            <p className="flex items-start gap-2">
              <span className="text-teal-400 font-bold">3.</span>
              File is uploaded to IPFS for permanent storage
            </p>
            <p className="flex items-start gap-2">
              <span className="text-teal-400 font-bold">4.</span>
              Submission recorded on blockchain with timestamp
            </p>
            <p className="flex items-start gap-2">
              <span className="text-teal-400 font-bold">5.</span>
              Receive unique submission ID for verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
