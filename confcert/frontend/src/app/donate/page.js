"use client";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { DONATE_ABI } from "../../../lib/abi3";
import Link from "next/link";
import { ArrowLeft, Heart, DollarSign, Users, TrendingUp, Settings } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection } from "../../../lib/metamask";

export default function Donate() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [totalDonations, setTotalDonations] = useState("0");
  const [contractBalance, setContractBalance] = useState("0");
  const [myDonations, setMyDonations] = useState("0");
  const [loading, setLoading] = useState(false);

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
        DONATE_ABI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_3
      );
      setContract(instance);

      // Load donation stats
      const total = await instance.methods.totalDonations().call();
      const balance = await instance.methods.contractBalance().call();
      const myAmount = await instance.methods.donations(accounts[0]).call();

      setTotalDonations(web3.utils.fromWei(total, "ether"));
      setContractBalance(web3.utils.fromWei(balance, "ether"));
      setMyDonations(web3.utils.fromWei(myAmount, "ether"));
    } catch (err) {
      console.error(err);
      alert("Failed to connect to blockchain");
    }
  }

  async function donate() {
    if (!contract || !account) {
      alert("Please connect wallet first");
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert("Please enter a valid donation amount");
      return;
    }

    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const amountInWei = web3.utils.toWei(donationAmount, "ether");

      await contract.methods.donate().send({
        from: account,
        value: amountInWei,
      });

      alert("Thank you for your donation!");
      setDonationAmount("");
      await loadBlockchain();
    } catch (err) {
      console.error(err);
      alert("Donation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlockchain();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-green-50 via-green-100 to-green-200">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex justify-between items-start mb-6">
            <Link href="/">
              <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-green-400 text-green-900 hover:bg-green-50 rounded-xl font-semibold transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </button>
            </Link>

            <Link href="/donate/admin">
              <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-300">
                <Settings className="w-4 h-4" />
                Admin Panel
              </button>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-linear-to-r from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent">
            Charity Donation Platform
          </h1>
          <p className="text-green-800 text-lg">
            Make a difference with blockchain-powered donations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-linear-to-b from-white to-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-semibold">Total Raised</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-900">{totalDonations} ETH</p>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-b from-white to-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-semibold">Available Funds</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-900">{contractBalance} ETH</p>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-b from-white to-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-semibold">Your Donations</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-900">{myDonations} ETH</p>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-linear-to-b from-white to-green-100 border-2 border-green-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-green-400 to-green-600 rounded-full mb-4">
                <Heart className="w-10 min-h-10 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-900 mb-2">
                Make a Donation
              </h2>
              <p className="text-green-700">
                Your contribution helps make a difference
              </p>
            </div>

            {/* Wallet Info */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-700 font-semibold mb-1">Connected Wallet</p>
              <p className="text-green-900 font-mono text-sm break-all">
                {account || "Not connected"}
              </p>
            </div>

            {/* Donation Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  Donation Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount in ETH"
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:outline-none focus:border-green-500 text-lg"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {["0.01", "0.05", "0.1", "0.5"].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDonationAmount(amount)}
                    className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-900 rounded-lg font-semibold transition-all"
                  >
                    {amount} ETH
                  </button>
                ))}
              </div>

              <button
                onClick={donate}
                disabled={loading || !donationAmount}
                className="w-full inline-flex items-center justify-center gap-2 min-h-12 sm:min-h-14 px-6 py-4 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed text-lg"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {loading ? "Processing..." : "Donate Now"}
              </button>

              <p className="text-xs text-green-700 text-center">
                Note: All donations are recorded on the blockchain and are transparent
              </p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-linear-to-b from-white to-green-100 border-2 border-green-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-green-900 mb-3">How It Works</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">▸</span>
                Connect your MetaMask wallet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">▸</span>
                Enter donation amount in ETH
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">▸</span>
                Confirm transaction in MetaMask
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">▸</span>
                Funds are securely stored on blockchain
              </li>
            </ul>
          </div>

          <div className="bg-linear-to-b from-white to-green-100 border-2 border-green-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-green-900 mb-3">Why Blockchain?</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                100% transparent - all donations visible
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                Secure and immutable records
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                Direct donations - no intermediaries
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                Smart contract controlled distribution
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
