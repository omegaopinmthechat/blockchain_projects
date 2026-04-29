'use client';

import { useState, useEffect } from 'react';
import { Droplets, Loader2, CheckCircle2, XCircle, AlertCircle, Zap, Wallet, Timer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5500';

export default function FaucetPage() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isServiceDown, setIsServiceDown] = useState(false);
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

  const isServiceDownError = (errorText = '') => {
    const text = String(errorText).toLowerCase();
    return (
      text.includes('app is inactive') ||
      text.includes('403 forbidden') ||
      text.includes('server response 403') ||
      text.includes('faucet service is temporarily down') ||
      text.includes('faucet_service_down')
    );
  };

  const fetchFaucetInfo = async () => {
    setFaucetInfoLoading(true);
    setIsServiceDown(false);
    setFaucetError('');
    try {
      const response = await fetch(`${API_URL}/api/faucet/info`);
      const data = await response.json();

      if (!response.ok) {
        const serverErrorText = [data?.error, data?.details, data?.code].filter(Boolean).join(' ');
        if (isServiceDownError(serverErrorText)) {
          setIsServiceDown(true);
          setStatus({ message: '', type: '' });
          setFaucetError('');
          setTxHash('');
          setFaucetInfo({ configured: false, dripAmount: '0.05', cooldownHours: 24 });
          return;
        }

        throw new Error('Backend server not responding');
      }

      setFaucetInfo(data);
      if (!data.configured) {
        setFaucetError('Faucet not configured on server. Please check backend .env file.');
      }
    } catch (error) {
      console.error('Failed to fetch faucet info:', error);
      setIsServiceDown(true);
      setFaucetError('Cannot connect to backend server. Faucet service is unavailable.');
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
    if (isServiceDown) {
      return;
    }

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
        const serverErrorText = [result?.error, result?.details, result?.code].filter(Boolean).join(' ');
        if (isServiceDownError(serverErrorText)) {
          setIsServiceDown(true);
          setStatus({ message: '', type: '' });
          setTxHash('');
          return;
        }

        throw new Error(result.error || 'Claim failed');
      }

    } catch (error) {
      if (isServiceDownError(error?.message) || error.message === 'Failed to get challenge' || error.message === 'Failed to fetch') {
        setIsServiceDown(true);
        setStatus({ message: '', type: '' });
        setTxHash('');
        return;
      }

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
    <div className="min-h-screen relative p-4 sm:p-8">

      {/* Back to Home */}
      <div className="relative z-10 max-w-3xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 rounded-full animate-pulse"></div>
              <Droplets className="relative w-16 h-16 text-blue-400 animate-bounce" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-text-main animate-fade-in">
              Sepolia Faucet
            </h1>
          </div>
          <p className="text-text-muted text-lg font-semibold mt-2">
            Get free testnet ETH for development
          </p>
        </div>

        {/* Faucet Info Card */}
        {faucetInfo?.configured && (
          <div className="bg-bg-input/50 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-border-main shadow-sm hover:shadow-md transition-all duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
              <div className="group hover:scale-105 transition-all duration-300 rounded-xl p-4 bg-bg-card border border-border-main">
                <div className="text-text-muted text-sm mb-2 font-medium">Amount per claim</div>
                <div className="text-text-main text-2xl font-bold flex items-center justify-center gap-2">
                  <Droplets className="w-6 h-6 text-blue-500 group-hover:animate-pulse" />
                  {faucetInfo.dripAmount} ETH
                </div>
              </div>
              <div className="group hover:scale-105 transition-all duration-300 rounded-xl p-4 bg-bg-card border border-border-main">
                <div className="text-text-muted text-sm mb-2 font-medium">Cooldown period</div>
                <div className="text-text-main text-2xl font-bold flex items-center justify-center gap-2">
                  <Timer className="w-6 h-6 text-purple-500 group-hover:animate-spin" />
                  {faucetInfo.cooldownHours}h
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Faucet Card */}
        <div className="bg-bg-card rounded-3xl overflow-hidden border border-border-main shadow-sm transition-all duration-300 relative">
          <div className="relative p-6 sm:p-10">
            {/* Network Badge */}
            {!isServiceDown && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-lg">
                <Zap className="w-4 h-4" />
                Sepolia Testnet
              </div>
            )}

            {isServiceDown && (
              <div className="p-6 rounded-2xl border-2 bg-amber-50 border-amber-300 shadow-lg shadow-amber-100 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-lg">Faucet service is temporarily down</p>
                  <p className="text-amber-800 text-sm mt-1">
                    The faucet is currently unavailable.
                  </p>
                </div>
              </div>
            )}

            {/* Info Box */}
            {!isServiceDown && (
              <div className="bg-bg-input/50 rounded-2xl p-6 mb-8 border border-border-main shadow-sm">
                <h3 className="font-bold text-text-main mb-4 text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  How it works:
                </h3>
                <ul className="space-y-3 text-text-muted">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">Enter your Sepolia wallet address</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">Solve a cryptographic puzzle (Proof-of-Work) to prevent abuse</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">Receive {faucetInfo?.dripAmount || '0.05'} SepoliaETH instantly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">Wait 24 hours before claiming again</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Address Input */}
            {!isServiceDown && (
              <div className="mb-6">
                <label className="block text-text-main font-bold mb-3 text-sm">
                  Wallet Address
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-5 py-4 border border-border-main rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-sm font-mono bg-bg-input text-text-main shadow-sm placeholder-text-muted"
                  />
                  <button
                    onClick={connectMetaMask}
                    className="px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md"
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="hidden sm:inline">Connect</span>
                  </button>
                </div>
              </div>
            )}

            {/* Backend Status Warning */}
            {!isServiceDown && faucetError && (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-bold text-sm">{faucetError}</p>
                  <p className="text-yellow-700 text-xs mt-1">Check FAUCET_SETUP_GUIDE.md for configuration instructions.</p>
                </div>
              </div>
            )}

            {/* Claim Button */}
            {!isServiceDown && (
              <button
                onClick={handleClaim}
                disabled={isLoading || faucetInfoLoading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
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
            )}

            {/* Mining Progress */}
            {!isServiceDown && isMining && (
              <div className="mt-6 p-6 bg-bg-input/50 rounded-2xl border border-border-main shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-main font-bold text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    Mining in progress...
                  </span>
                  <span className="text-blue-500 font-black text-lg">
                    {Math.round(miningProgress)}%
                  </span>
                </div>
                <div className="w-full h-4 bg-bg-card border border-border-main rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${miningProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-text-muted text-sm font-semibold">
                  {miningAttempts.toLocaleString()} attempts computed
                </div>
              </div>
            )}

            {/* Status Messages */}
            {!isServiceDown && status.message && !isMining && (
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
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6 border-t-2 border-gray-700 hover:from-gray-900 hover:to-gray-800 transition-all duration-300">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="font-medium">Test ETH has no real value</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        {!isServiceDown && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 hover:border-blue-400/50 group">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-blue-400 group-hover:animate-bounce" />
                Need a wallet?
              </h3>
              <p className="text-blue-200/80 text-sm mb-3 leading-relaxed">
                Install MetaMask to get started with Ethereum
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all duration-300 hover:scale-105"
                >
                  Download MetaMask →
                </a>
                <Link
                  href="/documentation"
                  className="text-blue-300 hover:text-blue-200 text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all duration-300 hover:scale-105"
                >
                  Step-by-step tutorial on how to create a metamask wallet →
                </Link>
              </div>
            </div>
          </div>
        )}
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
