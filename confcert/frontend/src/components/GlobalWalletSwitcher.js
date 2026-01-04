"use client";
import { useState } from "react";
import { Key, RefreshCw } from "lucide-react";
import { switchMetaMaskAccount } from "../../lib/metamask";

export default function GlobalWalletSwitcher({ account, onAccountChange, compact = false }) {
  const [switching, setSwitching] = useState(false);

  async function handleSwitch() {
    try {
      setSwitching(true);
      const result = await switchMetaMaskAccount();
      
      if (result.success && result.accounts && result.accounts.length > 0) {
        if (onAccountChange) {
          await onAccountChange(result.accounts[0]);
        }
      } else {
        alert("Failed to switch account: " + result.error);
      }
    } catch (error) {
      alert("Error switching account: " + error.message);
    } finally {
      setSwitching(false);
    }
  }

  if (compact) {
    return (
      <div className="bg-linear-to-r from-blue-100 to-purple-100 border-2 border-blue-300 rounded-xl p-3 mb-4 shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shrink-0">
              <Key className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-blue-700 font-semibold">Wallet</p>
              <p className="text-blue-900 font-mono text-xs break-all truncate">{account}</p>
            </div>
          </div>
          <button
            onClick={handleSwitch}
            disabled={switching}
            className="inline-flex items-center justify-center gap-1.5 min-h-8 px-2.5 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 shrink-0"
            title="Switch MetaMask Account"
          >
            <RefreshCw className={`w-3 h-3 ${switching ? 'animate-spin' : ''}`} />
            Switch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-r from-blue-100 to-purple-100 border-2 border-blue-300 rounded-2xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shrink-0">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-blue-700 font-semibold">Connected Wallet</p>
            <p className="text-blue-900 font-mono text-xs break-all">{account}</p>
          </div>
        </div>
        <button
          onClick={handleSwitch}
          disabled={switching}
          className="inline-flex items-center justify-center gap-2 min-h-9 px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 shrink-0"
          title="Switch MetaMask Account"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
          Switch Account
        </button>
      </div>
    </div>
  );
}
