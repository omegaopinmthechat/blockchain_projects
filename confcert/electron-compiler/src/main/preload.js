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
});
