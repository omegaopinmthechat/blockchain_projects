"use client";
import { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import { SMARt_AIRBNB_BI } from "../../../lib/abi5";
import Link from "next/link";
import { ArrowLeft, Home, FileText, Key, Clock, DollarSign, Shield, RefreshCw } from "lucide-react";
import { connectMetaMaskWallet, isMobile, checkPendingConnection, switchMetaMaskAccount } from "../../../lib/metamask";

export default function RentalAgreement() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));
  const [switchingAccount, setSwitchingAccount] = useState(false);

  const loadAgreements = useCallback(async (contractInstance, userAccount) => {
    try {
      const count = await contractInstance.methods.agreementCount().call();
      let list = [];

      for (let i = 1; i <= count; i++) {
        const agreement = await contractInstance.methods.agreements(i).call();
        
        // Only show agreements where user is landlord or tenant
        if (agreement.landlord.toLowerCase() === userAccount.toLowerCase() ||
            agreement.tenant.toLowerCase() === userAccount.toLowerCase()) {
          list.push({
            id: i,
            ...agreement
          });
        }
      }

      setAgreements(list);
    } catch (err) {
      console.error("Error loading agreements:", err);
    }
  }, []);

  const loadBlockchain = useCallback(async (accountAddress = null) => {
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
      const accounts = accountAddress ? [accountAddress] : await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const instance = new web3.eth.Contract(
        SMARt_AIRBNB_BI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_5
      );
      setContract(instance);

      // Load all agreements
      await loadAgreements(instance, accounts[0]);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to blockchain");
    }
  }, [loadAgreements]);

  useEffect(() => {
    async function checkAndConnect() {
      const result = await checkPendingConnection();
      if (result?.success) {
        loadBlockchain(result.accounts[0]);
      }
    }
    checkAndConnect();

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000);

    return () => clearInterval(interval);
  }, [loadBlockchain]);

  async function handleSwitchAccount() {
    try {
      setSwitchingAccount(true);
      const result = await switchMetaMaskAccount();
      
      if (result.success && result.accounts && result.accounts.length > 0) {
        await loadBlockchain(result.accounts[0]);
      } else {
        alert("Failed to switch account: " + result.error);
      }
    } catch (error) {
      alert("Error switching account: " + error.message);
    } finally {
      setSwitchingAccount(false);
    }
  }

  function formatDate(timestamp) {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  }

  function formatEther(wei) {
    return Web3.utils.fromWei(wei.toString(), 'ether');
  }

  function getDaysRemaining(leaseEnd) {
    const remaining = Number(leaseEnd) - currentTime;
    return Math.max(0, Math.floor(remaining / 86400));
  }

  function canClaimRent(agreement) {
    const rentInterval = 30 * 24 * 60 * 60; // 30 days
    const claimWindow = 5 * 24 * 60 * 60; // 5 days
    
    const nextClaimTime = Number(agreement.lastRentClaimed) + rentInterval;
    const claimDeadline = nextClaimTime + claimWindow;
    
    return currentTime >= nextClaimTime && currentTime <= claimDeadline && currentTime <= Number(agreement.leaseEnd);
  }

  function canReleaseDeposit(agreement) {
    return currentTime >= Number(agreement.leaseEnd) && !agreement.depositReleased;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-teal-50 via-teal-100 to-teal-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex justify-between items-start mb-6">
            <Link href="/">
              <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-teal-400 text-teal-900 hover:bg-teal-50 rounded-xl font-semibold transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </button>
            </Link>

            <Link href="/rental/create">
              <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all duration-300">
                <FileText className="w-4 h-4" />
                Create Agreement
              </button>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-linear-to-r from-teal-600 via-teal-500 to-teal-600 bg-clip-text text-transparent">
            Blockchain Rental Agreement
          </h1>
          <p className="text-teal-800 text-lg">
            Smart contract-based rental agreements with automated rent collection
          </p>
        </div>

        {/* Wallet Info */}
        {!account ? (
          <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-teal-900 mb-2">Connect Your Wallet</h2>
            <p className="text-teal-700 mb-6">Connect MetaMask to view and manage your rental agreements</p>
            <button
              onClick={() => loadBlockchain()}
              className="inline-flex items-center justify-center gap-2 min-h-11 sm:min-h-12 px-6 py-3 bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Key className="w-5 h-5" />
              Connect MetaMask
            </button>
          </div>
        ) : (
          <>
            <div className="bg-linear-to-r from-teal-100 to-teal-200 border-2 border-teal-300 rounded-2xl p-6 mb-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-teal-700 font-semibold">Connected Wallet</p>
                    <p className="text-teal-900 font-mono text-sm break-all">{account}</p>
                  </div>
                </div>
                <button
                  onClick={handleSwitchAccount}
                  disabled={switchingAccount}
                  className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                  title="Switch MetaMask Account"
                >
                  <RefreshCw className={`w-4 h-4 ${switchingAccount ? 'animate-spin' : ''}`} />
                  Switch Account
                </button>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-6 mb-8 shadow-lg">
              <h2 className="text-xl font-bold text-teal-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-teal-900">Create Agreement</p>
                      <p className="text-sm text-teal-700">Landlord creates agreement with tenant address, rent, deposit, and lease duration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-teal-900">Deposit Funds</p>
                      <p className="text-sm text-teal-700">Tenant deposits first month&apos;s rent + security deposit to activate agreement</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-teal-900">Monthly Rent</p>
                      <p className="text-sm text-teal-700">Landlord claims rent every 30 days within 5-day claim window</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                      <p className="font-semibold text-teal-900">Lease End</p>
                      <p className="text-sm text-teal-700">After lease ends, landlord releases security deposit back to tenant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agreements List */}
            <h2 className="text-2xl font-bold text-teal-900 mb-4">Your Agreements</h2>
            
            {agreements.length === 0 ? (
              <div className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-12 text-center shadow-lg">
                <Home className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                <p className="text-teal-700 text-lg">No rental agreements found</p>
                <p className="text-teal-600 text-sm mt-2">Create a new agreement to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {agreements.map((agreement) => {
                  const isLandlord = agreement.landlord.toLowerCase() === account.toLowerCase();
                  const daysRemaining = getDaysRemaining(agreement.leaseEnd);
                  
                  return (
                    <div
                      key={agreement.id}
                      className="bg-linear-to-b from-white to-teal-100 border-2 border-teal-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-teal-900 flex items-center gap-2">
                            <Home className="w-6 h-6" />
                            Agreement #{agreement.id}
                          </h3>
                          <p className="text-sm text-teal-600">
                            You are the <span className="font-semibold">{isLandlord ? 'Landlord' : 'Tenant'}</span>
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          agreement.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {agreement.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-teal-600" />
                            <div>
                              <p className="text-xs text-teal-600">Monthly Rent</p>
                              <p className="font-semibold text-teal-900">{formatEther(agreement.monthlyRent)} ETH</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-teal-600" />
                            <div>
                              <p className="text-xs text-teal-600">Security Deposit</p>
                              <p className="font-semibold text-teal-900">{formatEther(agreement.securityDeposit)} ETH</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-teal-600" />
                            <div>
                              <p className="text-xs text-teal-600">Lease Period</p>
                              <p className="font-semibold text-teal-900">
                                {formatDate(agreement.leaseStart)} - {formatDate(agreement.leaseEnd)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-teal-600" />
                            <div>
                              <p className="text-xs text-teal-600">Days Remaining</p>
                              <p className="font-semibold text-teal-900">{daysRemaining} days</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-teal-200 pt-4">
                        <p className="text-xs text-teal-600 mb-1">
                          {isLandlord ? 'Tenant Address' : 'Landlord Address'}
                        </p>
                        <p className="font-mono text-sm text-teal-900 break-all">
                          {isLandlord ? agreement.tenant : agreement.landlord}
                        </p>
                        <p className="text-xs text-teal-600 mt-2">
                          Last Rent Claimed: {formatDate(agreement.lastRentClaimed)}
                        </p>
                        {isLandlord && agreement.active && (
                          <div className="mt-2 text-xs">
                            {(() => {
                              const rentInterval = 30 * 24 * 60 * 60;
                              const claimWindow = 5 * 24 * 60 * 60;
                              const nextClaimTime = Number(agreement.lastRentClaimed) + rentInterval;
                              const claimDeadline = nextClaimTime + claimWindow;
                              
                              if (currentTime < nextClaimTime) {
                                const daysUntil = Math.ceil((nextClaimTime - currentTime) / 86400);
                                return (
                                  <p className="text-amber-600 font-semibold">
                                    Next rent claim available in {daysUntil} days ({formatDate(nextClaimTime)})
                                  </p>
                                );
                              } else if (currentTime >= nextClaimTime && currentTime <= claimDeadline) {
                                return (
                                  <p className="text-green-600 font-semibold">
                                    Rent claim window is NOW OPEN until {formatDate(claimDeadline)}
                                  </p>
                                );
                              } else if (currentTime > claimDeadline && currentTime <= Number(agreement.leaseEnd)) {
                                return (
                                  <p className="text-red-600 font-semibold">
                                    Claim window closed. Next window: {formatDate(nextClaimTime + rentInterval)}
                                  </p>
                                );
                              }
                            })()}
                          </div>
                        )}
                        {!isLandlord && agreement.active && (
                          <div className="mt-2 text-xs">
                            <p className="text-green-600 font-semibold">
                              Your deposit has been received. No further payment needed - rent is automatically handled when landlord claims.
                            </p>
                          </div>
                        )}
                        {!isLandlord && !agreement.active && (
                          <div className="mt-2 text-xs">
                            <p className="text-amber-600 font-semibold">
                              Please deposit funds to activate this rental agreement
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-3">
                        {!isLandlord && !agreement.active && (
                          <Link href={`/rental/deposit/${agreement.id}`} className="flex-1">
                            <button className="w-full min-h-10 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300">
                              Deposit Funds
                            </button>
                          </Link>
                        )}
                        {isLandlord && canClaimRent(agreement) && (
                          <Link href={`/rental/claim/${agreement.id}`} className="flex-1">
                            <button className="w-full min-h-10 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all duration-300">
                              Claim Rent
                            </button>
                          </Link>
                        )}
                        {isLandlord && canReleaseDeposit(agreement) && (
                          <Link href={`/rental/release/${agreement.id}`} className="flex-1">
                            <button className="w-full min-h-10 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-300">
                              Release Deposit
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
