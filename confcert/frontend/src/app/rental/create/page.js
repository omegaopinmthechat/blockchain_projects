"use client";
import { useState, useEffect } from "react";
import Web3 from "web3";
import { SMARt_AIRBNB_BI } from "../../../../lib/abi5";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, User, DollarSign, Calendar, Shield } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection } from "../../../../lib/metamask";
import GlobalWalletSwitcher from "../../../components/GlobalWalletSwitcher";

export default function CreateAgreement() {
  const [account, setAccount] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

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
    const sepoliaChainId = "0xaa36a7";
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    if (currentChainId !== sepoliaChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: sepoliaChainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: sepoliaChainId,
              chainName: "Sepolia Test Network",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
  }

  async function handleCreateAgreement(e) {
    e.preventDefault();
    
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    if (!Web3.utils.isAddress(tenantAddress)) {
      alert("Invalid tenant address");
      return;
    }

    if (tenantAddress.toLowerCase() === account.toLowerCase()) {
      alert("Tenant address cannot be the same as landlord address");
      return;
    }

    await ensureSepoliaNetwork();

    try {
      setLoading(true);
      setStatus("Creating rental agreement...");

      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        SMARt_AIRBNB_BI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_5
      );

      const rentWei = web3.utils.toWei(monthlyRent, 'ether');
      const depositWei = web3.utils.toWei(securityDeposit, 'ether');
      const durationSeconds = parseInt(leaseDuration) * 24 * 60 * 60;

      const receipt = await contract.methods
        .createAgreement(tenantAddress, rentWei, depositWei, durationSeconds)
        .send({ from: account });

      console.log("Agreement created:", receipt);
      
      setStatus("SUCCESS: Rental agreement created successfully!");
      
      // Clear form
      setTenantAddress("");
      setMonthlyRent("");
      setSecurityDeposit("");
      setLeaseDuration("");

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/rental";
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("ERROR: Failed to create agreement: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-teal-50 via-teal-100 to-teal-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-6">
          <Link href="/rental">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-teal-400 text-teal-900 hover:bg-teal-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Agreements
            </button>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-linear-to-r from-teal-600 via-teal-500 to-teal-600 bg-clip-text text-transparent">
            Create Rental Agreement
          </h1>
          <p className="text-teal-800">
            Set up a new blockchain-based rental agreement as a landlord
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-6 shadow-lg">
          {!account ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-teal-400 mx-auto mb-4" />
              <p className="text-teal-800 mb-4">Connect your wallet to create an agreement</p>
              <button
                onClick={connectWallet}
                className="inline-flex items-center justify-center gap-2 min-h-12 px-6 py-3 bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
              >
                Connect MetaMask
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAgreement} className="space-y-6">
              {/* Tenant Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-teal-900 mb-2">
                  <User className="w-4 h-4" />
                  Tenant Wallet Address
                </label>
                <input
                  type="text"
                  value={tenantAddress}
                  onChange={(e) => setTenantAddress(e.target.value)}
                  placeholder="0x..."
                  required
                  disabled={loading}
                  className="w-full min-h-12 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-teal-900 placeholder:text-teal-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
                />
                <p className="text-xs text-teal-600 mt-1">The Ethereum address of the tenant</p>
              </div>

              {/* Monthly Rent */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-teal-900 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Monthly Rent (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="0.1"
                  required
                  disabled={loading}
                  className="w-full min-h-12 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-teal-900 placeholder:text-teal-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
                />
                <p className="text-xs text-teal-600 mt-1">Amount in ETH to be paid monthly</p>
              </div>

              {/* Security Deposit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-teal-900 mb-2">
                  <Shield className="w-4 h-4" />
                  Security Deposit (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="0.2"
                  required
                  disabled={loading}
                  className="w-full min-h-12 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-teal-900 placeholder:text-teal-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
                />
                <p className="text-xs text-teal-600 mt-1">One-time security deposit (refundable)</p>
              </div>

              {/* Lease Duration */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-teal-900 mb-2">
                  <Calendar className="w-4 h-4" />
                  Lease Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={leaseDuration}
                  onChange={(e) => setLeaseDuration(e.target.value)}
                  placeholder="365"
                  required
                  disabled={loading}
                  className="w-full min-h-12 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-teal-900 placeholder:text-teal-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
                />
                <p className="text-xs text-teal-600 mt-1">Total duration of the rental agreement</p>
              </div>

              {/* Connected Wallet Display */}
              {account && (
                <div>
                  <GlobalWalletSwitcher account={account} onAccountChange={(newAccount) => setAccount(newAccount)} compact={true} />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-6 py-3 bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Agreement...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Create Agreement
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Status Display */}
        {status && (
          <div className={`mt-6 p-4 rounded-xl border-2 ${
            status.includes("SUCCESS") 
              ? "bg-green-50 border-green-200 text-green-700" 
              : status.includes("ERROR")
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-teal-50 border-teal-200 text-teal-700"
          }`}>
            <p className="text-center font-semibold">{status}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-semibold mb-2">ℹ️ Important Notes:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• You will be set as the landlord of this agreement</li>
            <li>• The tenant must deposit first month&apos;s rent + security deposit to activate</li>
            <li>• You can claim rent every 30 days within a 5-day window</li>
            <li>• After lease ends, you must release the security deposit back to tenant</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
