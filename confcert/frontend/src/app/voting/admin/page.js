"use client";
import { useState, useEffect } from "react";
import Web3 from "web3";
import { VOTING_ABI } from "../../../../lib/abi2";
import Link from "next/link";
import { ArrowLeft, Plus, Shield, Trophy } from "lucide-react";

export default function VotingAdmin() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [blockchainCandidates, setBlockchainCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadBlockchain() {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        const instance = new web3.eth.Contract(
          VOTING_ABI,
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_2
        );
        setContract(instance);

        // Check if user is admin
        const adminAddress = await instance.methods.admin().call();
        setIsAdmin(adminAddress.toLowerCase() === accounts[0].toLowerCase());

        // Load blockchain candidates
        const count = await instance.methods.candidatesCount().call();
        let list = [];
        for (let i = 1; i <= count; i++) {
          const c = await instance.methods.getCandidate(i).call();
          list.push({ id: i, name: c[0], votes: c[1] });
        }
        setBlockchainCandidates(list);
      } catch (err) {
        console.error(err);
        alert("Failed to connect to blockchain");
      }
    } else {
      alert("Please install MetaMask!");
    }
  }

  async function addCandidate() {
    if (!contract || !account) {
      alert("Please connect wallet first");
      return;
    }

    if (!isAdmin) {
      alert("Only admin can add candidates");
      return;
    }

    if (!candidateName.trim()) {
      alert("Please enter a candidate name");
      return;
    }

    try {
      setLoading(true);
      await contract.methods.addCandidate(candidateName).send({ from: account });
      alert("Candidate added successfully!");
      setCandidateName("");
      await loadBlockchain();
    } catch (err) {
      console.error(err);
      alert("Failed to add candidate");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlockchain();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-purple-50 via-purple-100 to-purple-200">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/voting">
            <button className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 text-sm border-2 border-purple-400 text-purple-900 hover:bg-purple-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Voting
            </button>
          </Link>

          <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-purple-600 via-purple-500 to-purple-600 bg-clip-text text-transparent">
            🔐 Admin Panel
          </h1>
          <p className="text-purple-800 text-lg">
            Add candidates directly to the blockchain
          </p>
        </div>

        {/* Admin Status */}
        <div className={`border-2 rounded-2xl p-6 mb-8 shadow-lg ${
          isAdmin 
            ? "bg-linear-to-r from-green-100 to-green-200 border-green-300" 
            : "bg-linear-to-r from-red-100 to-red-200 border-red-300"
        }`}>
          <div className="flex items-center gap-3">
            <Shield className={`w-8 h-8 ${isAdmin ? "text-green-600" : "text-red-600"}`} />
            <div>
              <p className="text-sm font-semibold">Admin Status</p>
              <p className="font-mono text-sm break-all">
                {isAdmin ? "You are the admin" : "You are not the admin"}
              </p>
              <p className="text-xs mt-1 opacity-75">Connected: {account}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Add New Candidate */}
          <div className="bg-linear-to-b from-white to-purple-100 border-2 border-purple-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Add New Candidate
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-800 mb-2">
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter candidate name"
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && addCandidate()}
                />
              </div>

              <button
                onClick={addCandidate}
                disabled={loading || !isAdmin || !candidateName.trim()}
                className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 py-3 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                {loading ? "Adding..." : "Add Candidate"}
              </button>

              <p className="text-xs text-purple-700">
                Note: Only the admin wallet can add candidates. Candidates are added directly to blockchain.
              </p>
            </div>
          </div>

          {/* Blockchain Candidates */}
          <div className="bg-linear-to-b from-white to-purple-100 border-2 border-purple-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              All Candidates ({blockchainCandidates.length})
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {blockchainCandidates.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-purple-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-900">{c.name}</p>
                      <p className="text-xs text-purple-600">Candidate #{c.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{c.votes}</p>
                      <p className="text-xs text-purple-500">votes</p>
                    </div>
                  </div>
                </div>
              ))}

              {blockchainCandidates.length === 0 && (
                <p className="text-purple-700 text-center py-8">
                  No candidates on blockchain yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
