"use client";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { DONATE_ABI } from "../../../../lib/abi3";
import Link from "next/link";
import { ArrowLeft, UserCheck, Plus, Trash2, Send, Wallet, Shield } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection } from "../../../../lib/metamask";
import GlobalWalletSwitcher from "../../../components/GlobalWalletSwitcher";

export default function DonateAdmin() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [charityAddress, setCharityAddress] = useState("");
  const [removeAddress, setRemoveAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [contractBalance, setContractBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [checkAddress, setCheckAddress] = useState("");
  const [isApproved, setIsApproved] = useState(null);

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

      const adminAddress = await instance.methods.admin().call();
      const balance = await instance.methods.contractBalance().call();
      
      setIsAdmin(adminAddress.toLowerCase() === accounts[0].toLowerCase());
      setContractBalance(web3.utils.fromWei(balance, "ether"));
    } catch (err) {
      console.error(err);
      alert("Failed to connect to blockchain");
    }
  }

  async function addCharity() {
    if (!contract || !account) {
      alert("Please connect wallet first");
      return;
    }

    if (!charityAddress || !Web3.utils.isAddress(charityAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    try {
      setLoading(true);
      await contract.methods.addCharity(charityAddress).send({ from: account });
      alert("Charity added successfully!");
      setCharityAddress("");
      await loadBlockchain();
    } catch (err) {
      console.error(err);
      alert("Failed to add charity. Make sure you are the admin.");
    } finally {
      setLoading(false);
    }
  }

  async function removeCharity() {
    if (!contract || !account) {
      alert("Please connect wallet first");
      return;
    }

    if (!removeAddress || !Web3.utils.isAddress(removeAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    try {
      setLoading(true);
      await contract.methods.removeCharity(removeAddress).send({ from: account });
      alert("Charity removed successfully!");
      setRemoveAddress("");
      await loadBlockchain();
    } catch (err) {
      console.error(err);
      alert("Failed to remove charity. Make sure you are the admin.");
    } finally {
      setLoading(false);
    }
  }

  async function withdraw() {
    if (!contract || !account) {
      alert("Please connect wallet first");
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!withdrawTo || !Web3.utils.isAddress(withdrawTo)) {
      alert("Please enter a valid charity address");
      return;
    }

    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      const amountInWei = web3.utils.toWei(withdrawAmount, "ether");

      // New contract: withdraw(address _to, uint256 amount) - onlyCharity modifier
      await contract.methods.withdraw(withdrawTo, amountInWei).send({ from: account });
      alert("Funds withdrawn successfully!");
      setWithdrawAmount("");
      setWithdrawTo("");
      await loadBlockchain();
    } catch (err) {
      console.error(err);
      alert("Failed to withdraw. Ensure you are an approved charity.");
    } finally {
      setLoading(false);
    }
  }

  async function checkCharityStatus() {
    if (!contract) return;
    
    if (!checkAddress || !Web3.utils.isAddress(checkAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    try {
      const approved = await contract.methods.approvedCharities(checkAddress).call();
      setIsApproved(approved);
    } catch (err) {
      console.error(err);
      alert("Failed to check charity status");
    }
  }

  useEffect(() => {
    loadBlockchain();
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-red-50 via-red-100 to-red-200 flex items-center justify-center">
        <div className="bg-white border-2 border-red-300 rounded-2xl p-12 text-center max-w-md shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 min-h-10 text-red-600" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-900 mb-4">Access Denied</h2>
          <p className="text-red-700 mb-6">
            Only the contract admin can access this panel.
          </p>
          <p className="text-sm text-red-600 font-mono mb-6 break-all">
            Your address: {account || "Not connected"}
          </p>
          <Link href="/donate">
            <button className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Donations
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-emerald-50 via-emerald-100 to-emerald-200">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link href="/donate">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-emerald-400 text-emerald-900 hover:bg-emerald-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Donations
            </button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-emerald-800 text-lg">Manage charities and withdrawals</p>
            </div>
          </div>

          {account && (
            <div className="inline-block">
              <GlobalWalletSwitcher account={account} onAccountChange={loadBlockchain} compact={true} />
            </div>
          )}
        </div>

        {/* Contract Balance */}
        <div className="bg-linear-to-b from-white to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 mb-4 sm:mb-6 lg:mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 min-h-12 sm:min-h-14 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-semibold">Contract Balance</p>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-900">{contractBalance} ETH</p>
            </div>
          </div>
        </div>

        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Add Charity */}
          <div className="bg-linear-to-b from-white to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 min-h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">Add Charity</h3>
            </div>

            <p className="text-sm text-emerald-700 mb-4">
              Add a new approved charity address to receive donations
            </p>

            <input
              type="text"
              value={charityAddress}
              onChange={(e) => setCharityAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 mb-4 font-mono text-sm"
            />

            <button
              onClick={addCharity}
              disabled={loading || !charityAddress}
              className="w-full inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-4 py-3 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Adding..." : "Add Charity"}
            </button>
          </div>

          {/* Remove Charity */}
          <div className="bg-linear-to-b from-white to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 min-h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">Remove Charity</h3>
            </div>

            <p className="text-sm text-emerald-700 mb-4">
              Remove a charity from the approved list
            </p>

            <input
              type="text"
              value={removeAddress}
              onChange={(e) => setRemoveAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 mb-4 font-mono text-sm"
            />

            <button
              onClick={removeCharity}
              disabled={loading || !removeAddress}
              className="w-full inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-4 py-3 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? "Removing..." : "Remove Charity"}
            </button>
          </div>
        </div>

        {/* Withdraw Funds */}
        <div className="bg-linear-to-b from-white to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 min-h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">Withdraw Funds (Charity Only)</h3>
          </div>

          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only approved charities can withdraw funds. If you are a charity, 
              you can send funds to any address.
            </p>
          </div>

          <p className="text-sm text-emerald-700 mb-6">
            Transfer funds from the contract to any address
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.1"
                className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                Recipient Address (Can be any address)
              </label>
              <input
                type="text"
                value={withdrawTo}
                onChange={(e) => setWithdrawTo(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
            </div>
          </div>

          <button
            onClick={withdraw}
            disabled={loading || !withdrawAmount || !withdrawTo}
            className="w-full inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-4 py-3 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? "Processing..." : "Withdraw Funds"}
          </button>
        </div>

        {/* Check Charity Status */}
        <div className="bg-linear-to-b from-white to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 min-h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">Check Charity Status</h3>
          </div>

          <p className="text-sm text-emerald-700 mb-4">
            Verify if an address is an approved charity
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-4 py-3 border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-sm"
            />
            <button
              onClick={checkCharityStatus}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all"
            >
              Check
            </button>
          </div>

          {isApproved !== null && (
            <div
              className={`p-4 rounded-xl border-2 ${
                isApproved
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <p className={`font-semibold ${isApproved ? "text-green-900" : "text-red-900"}`}>
                {isApproved
                  ? "This address is an approved charity"
                  : "This address is NOT an approved charity"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
