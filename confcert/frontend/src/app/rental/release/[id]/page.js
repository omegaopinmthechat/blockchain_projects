"use client";
import { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import { SMARt_AIRBNB_BI } from "../../../../../lib/abi5";
import Link from "next/link";
import { ArrowLeft, Shield, Loader2, CheckCircle } from "lucide-react";
import { connectMetaMaskWallet, checkPendingConnection } from "../../../../../lib/metamask";
import { useParams } from "next/navigation";
import WalletSwitcher from "../../components/WalletSwitcher";

export default function ReleaseDeposit() {
  const params = useParams();
  const agreementId = params.id;
  
  const [account, setAccount] = useState("");
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [status, setStatus] = useState("");

  const loadAgreementDetails = useCallback(async (accountAddress) => {
    try {
      setLoadingData(true);
      const web3 = new Web3(window.ethereum);
      setAccount(accountAddress);

      const contract = new web3.eth.Contract(
        SMARt_AIRBNB_BI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_5
      );

      const agreementData = await contract.methods.agreements(agreementId).call();
      setAgreement(agreementData);
    } catch (err) {
      console.error("Error loading agreement:", err);
      setStatus("Failed to load agreement details");
    } finally {
      setLoadingData(false);
    }
  }, [agreementId]);

  useEffect(() => {
    async function init() {
      const result = await checkPendingConnection();
      if (result?.success) {
        await loadAgreementDetails(result.accounts[0]);
      } else {
        setLoadingData(false);
      }
    }
    init();
  }, [loadAgreementDetails]);

  async function handleConnect() {
    const result = await connectMetaMaskWallet();
    if (result.success) {
      await loadAgreementDetails(result.accounts[0]);
    } else {
      setStatus("Failed to connect wallet: " + result.error);
    }
  }

  async function handleReleaseDeposit() {
    if (!account || !agreement) return;

    try {
      setLoading(true);
      setStatus("Releasing security deposit...");

      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        SMARt_AIRBNB_BI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_5
      );

      const receipt = await contract.methods
        .releaseDeposit(agreementId)
        .send({ from: account });

      console.log("Deposit released:", receipt);
      setStatus("SUCCESS: Security deposit released successfully! Agreement is now closed.");
      
      setTimeout(() => {
        window.location.href = "/rental";
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("ERROR: Release failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp) {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-teal-50 via-teal-100 to-teal-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-6">
          <Link href="/rental">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-teal-400 text-teal-900 hover:bg-teal-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Agreements
            </button>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-linear-to-r from-teal-600 via-teal-500 to-teal-600 bg-clip-text text-transparent">
            Release Security Deposit
          </h1>
          <p className="text-teal-800">Agreement #{agreementId}</p>
        </div>

        {account && <WalletSwitcher account={account} onAccountChange={loadAgreementDetails} />}

        {loadingData ? (
          <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-12 text-center shadow-lg">
            <Loader2 className="w-12 h-12 text-teal-500 mx-auto mb-4 animate-spin" />
            <p className="text-teal-700 text-lg">Loading agreement details...</p>
          </div>
        ) : !account ? (
          <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-teal-900 mb-2">Connect Your Wallet</h2>
            <p className="text-teal-700 mb-6">Please connect MetaMask to release deposit</p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-6 py-3 bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Shield className="w-5 h-5" />
              Connect MetaMask
            </button>
          </div>
        ) : agreement ? (
          <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-6 shadow-lg">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <span className="text-sm text-teal-700">Security Deposit Amount</span>
                </div>
                <span className="text-2xl font-bold text-teal-900">{Web3.utils.fromWei(agreement.securityDeposit, 'ether')} ETH</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">Lease Information</span>
                </div>
                <p className="text-xs text-green-700">
                  <strong>Lease Start:</strong> {formatDate(agreement.leaseStart)}
                </p>
                <p className="text-xs text-green-700">
                  <strong>Lease End:</strong> {formatDate(agreement.leaseEnd)}
                </p>
                <p className="text-xs text-green-700">
                  <strong>Tenant Address:</strong> <span className="font-mono">{agreement.tenant}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  This will transfer the security deposit back to the tenant and close the agreement permanently.
                </p>
              </div>
            </div>

            <button
              onClick={handleReleaseDeposit}
              disabled={loading || !account}
              className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-6 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Release Deposit to Tenant
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-8 text-center shadow-lg">
            <p className="text-teal-700 text-lg">No agreement found</p>
          </div>
        )}

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

        <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-900 font-semibold mb-2">Important:</p>
          <ul className="text-xs text-yellow-800 space-y-1">
            <li>• This action is irreversible and will close the agreement</li>
            <li>• Can only be done after the lease has ended</li>
            <li>• The deposit will be sent directly to the tenant&apos;s wallet</li>
            <li>• Make sure you have collected all necessary fees before releasing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
