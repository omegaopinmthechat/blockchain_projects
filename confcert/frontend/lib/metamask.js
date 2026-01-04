// MetaMask mobile detection and deep linking utility

export function isMobile() {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function openMetaMaskDeepLink() {
  const dappUrl = `${window.location.host}${window.location.pathname}${window.location.search}`;
  const metamaskDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
  
  // Open MetaMask app with current page URL
  window.location.href = metamaskDeepLink;
}

export async function connectMetaMaskWallet() {
  // Check if on mobile
  if (isMobile()) {
    // Check if MetaMask is already injected (user opened via MetaMask browser)
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        return { success: true, accounts };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Not in MetaMask browser - need to open app
      // Store a flag to retry connection when user returns
      sessionStorage.setItem('metamask_connect_pending', 'true');
      openMetaMaskDeepLink();
      return { 
        success: false, 
        error: "Opening MetaMask app. Please approve the connection and return here.",
        redirecting: true 
      };
    }
  } else {
    // Desktop behavior
    if (!window.ethereum) {
      return { 
        success: false, 
        error: "Please install MetaMask browser extension!",
        installUrl: "https://metamask.io/download/"
      };
    }
    
    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      return { success: true, accounts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Auto-connect when user returns from MetaMask app
export async function checkPendingConnection() {
  if (typeof window === 'undefined') return null;
  
  const isPending = sessionStorage.getItem('metamask_connect_pending');
  
  if (isPending === 'true' && window.ethereum) {
    sessionStorage.removeItem('metamask_connect_pending');
    
    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      return { success: true, accounts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return null;
}
