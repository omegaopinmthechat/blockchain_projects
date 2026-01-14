'use client';

import { useState, useEffect } from 'react';
import { Droplets, Loader2, CheckCircle2, XCircle, AlertCircle, Zap, Wallet, Timer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5500';

export default function FaucetPage() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [miningAttempts, setMiningAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [faucetInfo, setFaucetInfo] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [faucetInfoLoading, setFaucetInfoLoading] = useState(true);
  const [faucetError, setFaucetError] = useState('');

  useEffect(() => {
    fetchFaucetInfo();
  }, []);

  const fetchFaucetInfo = async () => {
    setFaucetInfoLoading(true);
    setFaucetError('');
    try {
      const response = await fetch(`${API_URL}/api/faucet/info`);
      if (!response.ok) {
        throw new Error('Backend server not responding');
      }
      const data = await response.json();
      setFaucetInfo(data);
      if (!data.configured) {
        setFaucetError('Faucet not configured on server. Please check backend .env file.');
      }
    } catch (error) {
      console.error('Failed to fetch faucet info:', error);
      setFaucetError('Cannot connect to backend server. Make sure backend is running on port 5500.');
      // Set default info so button can still work for testing
      setFaucetInfo({ 
        configured: false, 
        dripAmount: '0.05', 
        cooldownHours: 24 
      });
    } finally {
      setFaucetInfoLoading(false);
    }
  };

  const sha256 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const solvePoW = async (challenge, difficulty) => {
    const target = '0'.repeat(difficulty);
    let nonce = 0;
    let attempts = 0;
    const maxAttempts = 10000000;

    return new Promise((resolve, reject) => {
      const worker = async () => {
        for (let i = 0; i < 5000; i++) {
          const hash = await sha256(challenge + nonce);
          attempts++;

          if (attempts % 25000 === 0) {
            const progress = Math.min((attempts / maxAttempts) * 100, 95);
            setMiningProgress(progress);
            setMiningAttempts(attempts);
          }

          if (hash.startsWith(target)) {
            resolve(nonce);
            return;
          }

          nonce++;

          if (nonce > maxAttempts) {
            reject(new Error('Max attempts reached'));
            return;
          }
        }

        setTimeout(worker, 0);
      };

      worker();
    });
  };

  const handleClaim = async () => {
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setStatus({ message: 'Please enter a valid Ethereum address', type: 'error' });
      return;
    }

    setIsLoading(true);
    setTxHash('');
    setStatus({ message: 'Requesting challenge from server...', type: 'info' });

    try {
      // Step 1: Get challenge
      const challengeRes = await fetch(`${API_URL}/api/faucet/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!challengeRes.ok) {
        throw new Error('Failed to get challenge');
      }

      const { sessionId, challenge, difficulty } = await challengeRes.json();

      setStatus({ message: `Solving cryptographic puzzle (difficulty: ${difficulty})...`, type: 'info' });
      setIsMining(true);
      setMiningProgress(0);
      setMiningAttempts(0);

      // Step 2: Solve PoW
      const nonce = await solvePoW(challenge, difficulty);

      setMiningProgress(100);
      setStatus({ message: 'Solution found! Submitting claim...', type: 'info' });

      // Step 3: Submit claim
      const claimRes = await fetch(`${API_URL}/api/faucet/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, sessionId, nonce })
      });

      const result = await claimRes.json();

      if (claimRes.ok) {
        setTxHash(result.txHash);
        setStatus({
          message: `Success! ${result.amount} SepoliaETH sent to your wallet.`,
          type: 'success'
        });
        fetchFaucetInfo(); // Refresh balance
      } else {
        throw new Error(result.error || 'Claim failed');
      }

    } catch (error) {
      setStatus({
        message: error.message || 'An error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setIsMining(false);
      setMiningProgress(0);
      setMiningAttempts(0);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(accounts[0]);
        setStatus({ message: 'Wallet connected', type: 'success' });
      } catch (error) {
        setStatus({ message: 'Failed to connect wallet', type: 'error' });
      }
    } else {
      setStatus({ message: 'Please install MetaMask', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-8">
      {/* Back to Home */}
      <div className="max-w-3xl mx-auto mb-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 rounded-full animate-pulse"></div>
              <Droplets className="relative w-16 h-16 text-blue-400 animate-bounce" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-fade-in">
              Sepolia Faucet
            </h1>
          </div>
          <p className="text-blue-200/80 text-lg font-medium">
            Get free testnet ETH for development
          </p>
        </div>

        {/* Faucet Info Card */}
        {faucetInfo?.configured && (
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-blue-500/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 rounded-xl p-4">
                <div className="text-blue-300/70 text-sm mb-2 font-medium">Amount per claim</div>
                <div className="text-white text-2xl font-bold flex items-center justify-center gap-2">
                  <Droplets className="w-6 h-6 text-blue-400 group-hover:animate-pulse" />
                  {faucetInfo.dripAmount} ETH
                </div>
              </div>
              <div className="group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 rounded-xl p-4">
                <div className="text-blue-300/70 text-sm mb-2 font-medium">Cooldown period</div>
                <div className="text-white text-2xl font-bold flex items-center justify-center gap-2">
                  <Timer className="w-6 h-6 text-purple-400 group-hover:animate-spin" />
                  {faucetInfo.cooldownHours}h
                </div>
              </div>
              <div className="group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 rounded-xl p-4">
                <div className="text-blue-300/70 text-sm mb-2 font-medium">Faucet balance</div>
                <div className="text-white text-2xl font-bold">
                  {parseFloat(faucetInfo.balance).toFixed(4)} ETH
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Faucet Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-blue-100 hover:shadow-3xl transition-all duration-300 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 rounded-3xl"></div>
          <div className="relative p-8 sm:p-10">
            {/* Network Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-lg">
              <Zap className="w-4 h-4" />
              Sepolia Testnet
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-8 border-2 border-blue-200/50 shadow-inner">
              <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                How it works:
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">Enter your Sepolia wallet address</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">Solve a cryptographic puzzle (Proof-of-Work) to prevent abuse</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">Receive {faucetInfo?.dripAmount || '0.05'} SepoliaETH instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">Wait 24 hours before claiming again</span>
                </li>
              </ul>
            </div>

            {/* Address Input */}
            <div className="mb-6">
              <label className="block text-gray-800 font-bold mb-3 text-sm">
                Wallet Address
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 outline-none transition-all duration-300 text-sm font-mono bg-white shadow-inner hover:shadow-md focus:shadow-lg"
                />
                <button
                  onClick={connectMetaMask}
                  className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Wallet className="w-5 h-5" />
                  <span className="hidden sm:inline">Connect</span>
                </button>
              </div>
            </div>

            {/* Backend Status Warning */}
            {faucetError && (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-bold text-sm">{faucetError}</p>
                  <p className="text-yellow-700 text-xs mt-1">Check FAUCET_SETUP_GUIDE.md for configuration instructions.</p>
                </div>
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={handleClaim}
              disabled={isLoading || faucetInfoLoading}
              className="w-full py-5 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              {faucetInfoLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Connecting to backend...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Droplets className="w-6 h-6" />
                  Claim SepoliaETH
                </>
              )}
            </button>

            {/* Mining Progress */}
            {isMining && (
              <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-2xl border-2 border-blue-300/50 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-800 font-bold text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Mining in progress...
                  </span>
                  <span className="text-blue-700 font-black text-lg">
                    {Math.round(miningProgress)}%
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-3 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${miningProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-gray-700 text-sm font-semibold">
                  {miningAttempts.toLocaleString()} attempts computed
                </div>
              </div>
            )}

            {/* Status Messages */}
            {status.message && !isMining && (
              <div
                className={`mt-6 p-5 rounded-2xl flex items-start gap-3 border-2 ${
                  status.type === 'success'
                    ? 'bg-green-50 border-green-300 shadow-lg shadow-green-100'
                    : status.type === 'error'
                    ? 'bg-red-50 border-red-300 shadow-lg shadow-red-100'
                    : 'bg-blue-50 border-blue-300 shadow-lg shadow-blue-100'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : status.type === 'error' ? (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-bold ${
                      status.type === 'success'
                        ? 'text-green-800'
                        : status.type === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}
                  >
                    {status.message}
                  </p>
                  {txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-flex items-center gap-1 underline font-semibold"
                    >
                      View on Etherscan →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-t-2 border-blue-100 hover:from-blue-50 hover:to-cyan-50 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="font-medium">Test ETH has no real value</span>
              </div>
              <a
                href="https://sepolia.etherscan.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition-colors duration-300 hover:scale-105 inline-flex items-center gap-1"
              >
                Sepolia Explorer →
              </a>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 hover:border-blue-400/50 group">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5 text-blue-400 group-hover:animate-bounce" />
              Need a wallet?
            </h3>
            <p className="text-blue-200/80 text-sm mb-3 leading-relaxed">
              Install MetaMask to get started with Ethereum
            </p>
            <a
              href="https://metamask.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all duration-300 hover:scale-105"
            >
              Download MetaMask →
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}
