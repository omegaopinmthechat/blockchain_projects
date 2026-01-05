"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Upload, Search, ArrowLeft, CheckCircle, Inbox, User, Smartphone, AlertCircle } from "lucide-react";
import { connectMetaMaskWallet, switchMetaMaskAccount, getCurrentAccount, checkPendingConnection, isMobile } from "../../../lib/metamask";

export default function AssignmentVault() {
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAccount = async () => {
      // Check for pending connection (returning from MetaMask app)
      const pending = await checkPendingConnection();
      if (pending && pending.success) {
        setAccount(pending.accounts[0]);
        return;
      }

      // Load current account
      const currentAccount = await getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
      }

      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setAccount("");
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
    } else {
      setError(result.error);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Assignment Vault
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2">
                  Timestamped assignment submissions on blockchain with IPFS storage
                </p>
              </div>
            </div>

            {/* Account Display */}
            <div className="w-full lg:w-auto">
              {account ? (
                <div className="bg-slate-800 border-2 border-teal-500/30 rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <User className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Connected</p>
                      <p className="text-xs sm:text-sm font-mono text-slate-200 truncate">{formatAddress(account)}</p>
                    </div>
                    <button
                      onClick={switchAccount}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-all shrink-0"
                      title="Switch Account"
                    >
                      Switch
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="w-full lg:w-auto px-4 py-2.5 sm:py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all text-sm sm:text-base"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl p-6">
            <h2 className="text-lg font-bold text-teal-400 mb-3">How It Works</h2>
            <div className="space-y-2 text-slate-300">
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                Submit assignments with file upload to IPFS
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                Specify recipient address (teacher/evaluator)
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                Blockchain timestamp proves submission time
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                Verify any submission using submission ID
              </p>
            </div>
          </div>

          {/* Mobile Notice */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold">Connection Error</p>
                <p className="text-slate-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Submit Assignment */}
          <Link href="/assignment/submit">
            <div className="group bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-teal-500/30 hover:border-teal-400 rounded-2xl p-8 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-200 mb-3">
                Submit Assignment
              </h2>
              <p className="text-slate-400 mb-4">
                Upload your assignment file to IPFS and create a blockchain timestamp record with recipient address.
              </p>
              <div className="flex items-center gap-2 text-teal-400 font-semibold">
                Upload Now
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* My Inbox */}
          <Link href="/assignment/inbox">
            <div className="group bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 hover:border-purple-400 rounded-2xl p-8 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Inbox className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-200 mb-3">
                My Inbox
              </h2>
              <p className="text-slate-400 mb-4">
                View all assignments that have been submitted to your wallet address.
              </p>
              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                View Inbox
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Verify Submission */}
          <Link href="/assignment/verify">
            <div className="group bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-8 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-200 mb-3">
                Verify Submission
              </h2>
              <p className="text-slate-400 mb-4">
                Look up any submission by ID to view student, recipient, timestamp, and access the IPFS file.
              </p>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                Verify Now
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">IPFS Storage</h3>
            <p className="text-slate-400 text-sm">
              Files stored on decentralized IPFS network, ensuring permanent availability
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Timestamped</h3>
            <p className="text-slate-400 text-sm">
              Blockchain timestamp proves exact submission time, immutable and verifiable
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Easy Upload</h3>
            <p className="text-slate-400 text-sm">
              Simple interface to upload assignments and specify recipient address
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Public Verification</h3>
            <p className="text-slate-400 text-sm">
              Anyone can verify submissions using the submission ID
            </p>
          </div>
        </div>

        {/* Contract Info */}
        <div className="mt-12 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-200 mb-4">Contract Information</h2>
          <div className="bg-slate-950 border border-slate-700 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-2">Contract Address</p>
            <p className="text-slate-300 font-mono text-sm break-all">
              {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_6 || "Not configured"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
