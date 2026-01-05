"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, FileText, CheckCircle, AlertCircle, Loader2, Download, ExternalLink, Smartphone } from "lucide-react";
import { ASSIGNMENT_ABI } from "../../../../lib/abi6";
import Web3 from "web3";
import { isMobile } from "../../../../lib/metamask";

export default function VerifySubmission() {
  const [submissionId, setSubmissionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState(null);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!submissionId || submissionId <= 0) {
      setError("Please enter a valid submission ID");
      return;
    }

    if (!window.ethereum) {
      setError("MetaMask not found. Please install MetaMask.");
      return;
    }

    setLoading(true);
    setError("");
    setSubmission(null);

    try {
      const web3 = new Web3(window.ethereum);
      
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_6;

      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      const contract = new web3.eth.Contract(ASSIGNMENT_ABI, contractAddress);

      // Call the view function
      const result = await contract.methods.getSubmission(submissionId).call();

      if (result.student === "0x0000000000000000000000000000000000000000") {
        setError("Submission not found. Please check the ID.");
        setLoading(false);
        return;
      }

      setSubmission({
        student: result.student,
        assignedTo: result.assignedTo,
        cid: result.cid,
        timestamp: Number(result.timestamp)
      });
      setLoading(false);
    } catch (err) {
      setError("Failed to verify submission: " + err.message);
      setLoading(false);
    }
  };

  const openIPFS = () => {
    if (submission && submission.cid) {
      window.open(`https://gateway.pinata.cloud/ipfs/${submission.cid}`, "_blank");
    }
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
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Verify Submission
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2">
                Look up assignment submission details by ID
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/30 rounded-2xl p-6 sm:p-8 mb-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-slate-200 font-semibold mb-3">
                Submission ID
              </label>
              <input
                type="number"
                value={submissionId}
                onChange={(e) => {
                  setSubmissionId(e.target.value);
                  setError("");
                  setSubmission(null);
                }}
                placeholder="Enter submission ID (e.g., 1, 2, 3...)"
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                disabled={loading}
                min="1"
              />
            </div>

            <button
              type="submit"
              disabled={!submissionId || loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verify Submission
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold">Error</p>
                <p className="text-slate-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Submission Details */}
        {submission && (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-green-500/30 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <h2 className="text-2xl font-bold text-green-400">Submission Verified</h2>
            </div>

            <div className="space-y-4">
              {/* Submission ID */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Submission ID</p>
                <p className="text-2xl font-bold text-slate-200">{submissionId}</p>
              </div>

              {/* Student Address */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Student Address</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-200 font-mono text-sm sm:text-base break-all">
                    {submission.student}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(submission.student);
                    }}
                    className="ml-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Assigned To */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Assigned To (Recipient)</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-200 font-mono text-sm sm:text-base break-all">
                    {submission.assignedTo}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(submission.assignedTo);
                    }}
                    className="ml-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Timestamp */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Submission Time</p>
                <p className="text-slate-200 text-lg">{formatDate(submission.timestamp)}</p>
                <p className="text-slate-500 text-sm mt-1">
                  Unix Timestamp: {submission.timestamp}
                </p>
              </div>

              {/* IPFS CID */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">IPFS CID</p>
                <p className="text-slate-200 font-mono text-sm break-all mb-3">
                  {submission.cid}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={openIPFS}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on IPFS
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(submission.cid);
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Copy CID
                  </button>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-green-400 font-semibold">Blockchain Verified</p>
                  <p className="text-slate-300 text-sm mt-1">
                    This submission is permanently recorded on the blockchain with an immutable timestamp.
                    The file is stored on IPFS and can be accessed using the CID above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-3">About Verification</h3>
          <div className="space-y-2 text-slate-400 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              Submission ID is assigned automatically when an assignment is submitted
            </p>
            <p className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              All data is stored permanently on the blockchain
            </p>
            <p className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              Timestamp proves when the assignment was submitted
            </p>
            <p className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              IPFS ensures file is accessible and tamper-proof
            </p>
            <p className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              Anyone can verify submissions using just the ID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
