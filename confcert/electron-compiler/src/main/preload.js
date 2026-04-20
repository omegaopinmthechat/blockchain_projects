const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  playground: {
    health: () => ipcRenderer.invoke("playground:health"),
    compile: (payload) => ipcRenderer.invoke("playground:compile", payload),
    deploy: (payload) => ipcRenderer.invoke("playground:deploy", payload),
    call: (payload) => ipcRenderer.invoke("playground:call", payload),
    reset: (payload) => ipcRenderer.invoke("playground:reset", payload),
    openFile: (payload) => ipcRenderer.invoke("playground:file-open", payload),
    saveFile: (payload) => ipcRenderer.invoke("playground:file-save", payload),
    saveFileAs: (payload) => ipcRenderer.invoke("playground:file-save-as", payload),
  },
  windowControls: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
    isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
    close: () => ipcRenderer.invoke("window:close"),
    onStateChange: (callback) => {
      if (typeof callback !== "function") {
        return () => {};
      }

      const listener = (_event, payload = {}) => {
        callback(payload);
      };

      ipcRenderer.on("window:state", listener);
      return () => ipcRenderer.removeListener("window:state", listener);
    },
  },
});
