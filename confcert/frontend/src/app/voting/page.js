"use client";
import { useEffect, useState } from "react";
import Web3 from "web3";
import axios from "axios";
import { VOTING_ABI } from "../../../lib/abi2";
import Link from "next/link";
import { ArrowLeft, Vote, Trophy, User, Settings } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection } from "../../../lib/metamask";

export default function Voting() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is returning from MetaMask app
    async function checkAndConnect() {
      const result = await checkPendingConnection();
      if (result?.success) {
        // Auto-connect after returning from MetaMask app
        loadBlockchain();
      }
    }
    checkAndConnect();
  }, []);

  async function loadBlockchain() {
    const result = await connectMetaMaskWallet();
    
    if (!result.success) {
      if (result.redirecting) {
        // User is being redirected to MetaMask app
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
        VOTING_ABI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_2
      );
      setContract(instance);

      const count = await instance.methods.candidatesCount().call();
      let list = [];

      for (let i = 1; i <= count; i++) {
        const c = await instance.methods.getCandidate(i).call();
        list.push({ id: i, name: c[0], votes: c[1] });
      }

      setCandidates(list);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to blockchain");
    }
  }

  async function vote(id) {
    if (!contract || !account) {
      alert("Please connect wallet first");
      return;
    }

    try {
      setLoading(true);
      
      await contract.methods.vote(id).send({ from: account });

      // Optional: Record vote to backend
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_2}/vote`, {
          address: account,
          candidateId: id
        });
      } catch (e) {
        console.log("Backend not available:", e);
      }

      alert("Vote Casted Successfully!");
      await loadBlockchain();
    } catch (err) {
      console.error(err);
      alert("Failed to cast vote. You may have already voted.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlockchain();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-blue-50 via-blue-100 to-blue-200">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex justify-between items-start mb-6">
            <Link href="/">
              <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-blue-400 text-blue-900 hover:bg-blue-50 rounded-xl font-semibold transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </button>
            </Link>

            <Link href="/voting/admin">
              <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all duration-300">
                <Settings className="w-4 h-4" />
                Admin Panel
              </button>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-linear-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
            🗳️ Decentralized Voting System
          </h1>
          <p className="text-blue-800 text-lg">
            Cast your vote securely on the blockchain
          </p>
        </div>

        {/* Wallet Info */}
        <div className="bg-linear-to-r from-blue-100 to-blue-200 border-2 border-blue-300 rounded-2xl p-6 mb-4 sm:mb-6 lg:mb-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-semibold">Connected Wallet</p>
              <p className="text-blue-900 font-mono text-sm break-all">
                {account || "Not connected"}
              </p>
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="bg-linear-to-b from-white to-blue-100 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.15)] hover:shadow-[0_20px_40px_-5px_rgba(59,130,246,0.25)] transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-sm sm:text-base lg:text-lg md:text-xl lg:text-2xl font-bold text-blue-900">{c.name}</h2>
                  <p className="text-sm text-blue-600">Candidate #{c.id}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">{c.votes}</p>
                  <p className="text-blue-700">votes</p>
                </div>
              </div>

              <button
                onClick={() => vote(c.id)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed"
              >
                <Vote className="w-4 h-4 sm:w-5 sm:h-5" />
                {loading ? "Processing..." : "Vote"}
              </button>
            </div>
          ))}
        </div>

        {candidates.length === 0 && (
          <div className="text-center py-16">
            <p className="text-blue-700 text-lg">
              Loading candidates or no candidates available...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
