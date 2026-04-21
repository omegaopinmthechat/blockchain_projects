// Version configuration for Solidity Playground
// Update this file to change the version across the entire application

const APP_VERSION = "1.1.3";

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  // Node.js / CommonJS (for main process and package.json scripts)
  module.exports = { APP_VERSION };
}

// Browser global (for renderer process)
if (typeof window !== "undefined") {
  window.APP_VERSION = APP_VERSION;
}
