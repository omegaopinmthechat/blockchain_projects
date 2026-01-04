"use client";
import { useState } from "react";
import { Key, RefreshCw } from "lucide-react";
import { switchMetaMaskAccount } from "../../../../lib/metamask";

export default function WalletSwitcher({ account, onAccountChange }) {
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

  return (
    <div className="bg-linear-to-r from-teal-100 to-teal-200 border-2 border-teal-300 rounded-2xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-teal-700 font-semibold">Connected Wallet</p>
            <p className="text-teal-900 font-mono text-xs break-all">{account}</p>
          </div>
        </div>
        <button
          onClick={handleSwitch}
          disabled={switching}
          className="inline-flex items-center justify-center gap-2 min-h-9 px-3 py-2 text-xs bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 shrink-0"
          title="Switch MetaMask Account"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
          Switch
        </button>
      </div>
    </div>
  );
}
