"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox, FileText, User, Calendar, ExternalLink, Loader2, AlertCircle, Smartphone } from "lucide-react";
import { ASSIGNMENT_ABI } from "../../../../lib/abi6";
import Web3 from "web3";
import { connectMetaMaskWallet, switchMetaMaskAccount, getCurrentAccount, checkPendingConnection, isMobile } from "../../../../lib/metamask";

export default function AssignmentInbox() {
  const [account, setAccount] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAccount = async () => {
      // Check for pending connection (returning from MetaMask app)
      const pending = await checkPendingConnection();
      if (pending && pending.success) {
        setAccount(pending.accounts[0]);
        loadAssignments(pending.accounts[0]);
        return;
      }

      // Load current account
      const currentAccount = await getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
        loadAssignments(currentAccount);
      }

      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            loadAssignments(accounts[0]);
          } else {
            setAccount("");
            setAssignments([]);
          }
        });
      }
    };

    loadAccount();
  }, []);

  const connectWallet = async () => {
    setError("");
    const result = await connectMetaMaskWallet();
    
    if (result.success) {
      setAccount(result.accounts[0]);
      loadAssignments(result.accounts[0]);
    } else if (!result.redirecting) {
      setError(result.error);
      if (result.installUrl) {
        setTimeout(() => {
          window.open(result.installUrl, "_blank");
        }, 2000);
      }
    }
  };

  const switchAccount = async () => {
    setError("");
    const result = await switchMetaMaskAccount();
    
    if (result.success && result.accounts.length > 0) {
      setAccount(result.accounts[0]);
      loadAssignments(result.accounts[0]);
    } else {
      setError(result.error);
    }
  };

  const loadAssignments = async (walletAddress) => {
    setLoading(true);
    setError("");

    try {
      const web3 = new Web3(window.ethereum);
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_6;

      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      const contract = new web3.eth.Contract(ASSIGNMENT_ABI, contractAddress);

      // Get total submission count
      const totalSubmissions = await contract.methods.submissionCount().call();

      const receivedAssignments = [];

      // Loop through all submissions and filter by assignedTo
      for (let i = 1; i <= Number(totalSubmissions); i++) {
        try {
          const submission = await contract.methods.getSubmission(i).call();
          
          // Check if this submission is assigned to the current wallet
          if (submission.assignedTo.toLowerCase() === walletAddress.toLowerCase()) {
            receivedAssignments.push({
              id: i,
              student: submission.student,
              cid: submission.cid,
              timestamp: Number(submission.timestamp),
            });
          }
        } catch (err) {
          console.error(`Error loading submission ${i}:`, err);
        }
      }

      // Sort by timestamp (newest first)
      receivedAssignments.sort((a, b) => b.timestamp - a.timestamp);

      setAssignments(receivedAssignments);
      setLoading(false);
    } catch (err) {
      setError("Failed to load assignments: " + err.message);
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openIPFS = (cid) => {
    window.open(`https://gateway.pinata.cloud/ipfs/${cid}`, "_blank");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/assignment">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Assignment Vault
            </button>
          </Link>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shrink-0">
                <Inbox className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                  My Inbox
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2">
                  Assignments submitted to your wallet address
                </p>
              </div>
            </div>

            {/* Account Display */}
            {account && (
              <div className="w-full lg:w-auto bg-slate-800 border-2 border-purple-500/30 rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <User className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Connected</p>
                    <p className="text-xs sm:text-sm font-mono text-slate-200 truncate">
                      {formatAddress(account)}
                    </p>
                  </div>
                  <button
                    onClick={switchAccount}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-all shrink-0"
                    title="Switch Account"
                  >
                    Switch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {!account ? (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-12 text-center">
            <Inbox className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-200 mb-3">
              Connect Your Wallet
            </h2>
            <p className="text-slate-400 mb-6">
              Connect your wallet to view assignments submitted to your address
            </p>
            <button
              onClick={connectWallet}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all"
            >
              Connect Wallet
            </button>
          </div>
        ) : loading ? (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-12 text-center">
            <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-slate-200 mb-3">
              Loading Assignments...
            </h2>
            <p className="text-slate-400">
              Please wait while we fetch your submissions
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-semibold">Error</p>
              <p className="text-slate-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-12 text-center">
            <Inbox className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-200 mb-3">
              No Assignments Yet
            </h2>
            <p className="text-slate-400">
              No assignments have been submitted to your address yet
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-200">
                {assignments.length} Assignment
                {assignments.length !== 1 ? "s" : ""} Received
              </h2>
              <button
                onClick={() => loadAssignments(account)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-all text-sm"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-xl p-6 hover:border-purple-400 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-200">
                            Submission #{assignment.id}
                          </h3>
                          <p className="text-sm text-slate-400">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(assignment.timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-400">From:</span>
                          <span className="text-sm text-slate-300 font-mono">
                            {formatAddress(assignment.student)}
                          </span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(assignment.student)
                            }
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs transition-all"
                          >
                            Copy
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-400">
                            IPFS CID:
                          </span>
                          <span className="text-sm text-slate-300 font-mono truncate">
                            {assignment.cid}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => openIPFS(assignment.cid)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open File
                        </button>
                        <Link href={`/assignment/verify?id=${assignment.id}`}>
                          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-all text-sm">
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-3">
            About Your Inbox
          </h3>
          <div className="space-y-2 text-slate-400 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              This page shows all assignments submitted TO your wallet address
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Students specify your address when submitting their work
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              All submissions are timestamped and stored permanently on
              blockchain
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Click &quot;Open File&quot; to view the assignment on IPFS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
