"use client"
import { useState, useEffect } from "react";
import Web3 from "web3";
import { CONF_CERT_ABI } from "../../../../lib/abi.js";
import Link from "next/link";
import { Search, ArrowLeft, CheckCircle, User, Shield, ExternalLink, Wallet } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection } from "../../../../lib/metamask";

export default function Verify() {
  const [account, setAccount] = useState("");
  const [certId, setCertId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setError("Opening MetaMask app...");
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

  async function verify() {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }
    
    if (!certId.trim()) {
      setError("Please enter a certificate ID");
      return;
    }

    const certIdNum = parseInt(certId);
    if (isNaN(certIdNum) || certIdNum <= 1000) {
      setError("Certificate ID must be greater than 1000");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        CONF_CERT_ABI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );

      const result = await contract.methods.getCertificate(certId).call();

      setData({
        name: result[0],
        cid: result[1],
        issuer: result[2],
      });
    } catch (err) {
      console.error(err);
      setError("Certificate not found. Please check the ID and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-yellow-50 via-yellow-100 to-yellow-200">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link href="/confcert">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-yellow-400 text-yellow-900 hover:bg-yellow-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-linear-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Verify Certificate
          </h1>
          <p className="text-yellow-800 text-lg">
            Enter a certificate ID to verify its authenticity
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-linear-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-6">
            <h3 className="text-base sm:text-sm sm:text-base lg:text-lg md:text-xl lg:text-2xl font-bold text-yellow-900 mb-2">Certificate Verification</h3>
            <p className="text-sm text-yellow-800">
              Connect your wallet and enter certificate ID to verify
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Wallet Connection */}
            {!account ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-16 h-16 bg-linear-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <p className="text-yellow-800 text-center">
                  Connect your MetaMask wallet to verify certificates
                </p>
                <button onClick={connectWallet} className="inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  Connect MetaMask
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-linear-to-r from-yellow-100 to-yellow-200 rounded-xl border-2 border-yellow-300 mb-4">
                  <p className="text-sm text-yellow-700 mb-1 font-semibold">Connected Wallet</p>
                  <p className="text-yellow-900 font-mono text-sm break-all">{account}</p>
                </div>

                <div className="flex gap-3">
                  <input
                    placeholder="Enter Certificate ID (e.g., 1, 2, 3...)"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && verify()}
                    disabled={loading}
                    className="flex min-h-11 sm:min-h-12 w-full rounded-xl border-2 border-yellow-200 bg-white px-4 py-2 text-base text-yellow-900 placeholder:text-yellow-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  />
                  <button
                    onClick={verify}
                    disabled={loading || !certId}
                    className="inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      "Verifying..."
                    ) : (
                      <>
                        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                        Verify
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Card */}
        {data && (
          <div className="bg-linear-to-b from-green-50 to-yellow-50 border-2 border-green-500 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-sm sm:text-base lg:text-lg md:text-xl lg:text-2xl font-bold text-green-700">Certificate Verified</h3>
                <p className="text-sm text-green-600">
                  This certificate is authentic and recorded on the blockchain
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Student Name */}
              <div className="p-4 bg-white rounded-xl border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  <p className="text-sm font-semibold text-yellow-700">Student Name</p>
                </div>
                <p className="text-xl font-bold text-yellow-900">{data.name}</p>
              </div>

              {/* Issuer */}
              <div className="p-4 bg-white rounded-xl border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  <p className="text-sm font-semibold text-yellow-700">Issued By</p>
                </div>
                <p className="text-sm font-mono text-yellow-900 break-all">{data.issuer}</p>
              </div>

              {/* Certificate Image */}
              {data.cid && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-yellow-700">Certificate Document</p>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${data.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Open in IPFS
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border-4 border-yellow-200 bg-white p-4">
                    <img
                      src={`https://gateway.pinata.cloud/ipfs/${data.cid}`}
                      alt="Certificate"
                      className="w-full h-auto rounded-lg shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://ipfs.io/ipfs/${data.cid}`;
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Certificate ID */}
              <div className="p-4 bg-linear-to-r from-yellow-100 to-yellow-200 rounded-xl border-2 border-yellow-300">
                <p className="text-xs text-yellow-700 mb-1 font-semibold">Certificate ID</p>
                <p className="text-sm sm:text-base lg:text-lg font-mono font-bold text-yellow-900">{certId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
