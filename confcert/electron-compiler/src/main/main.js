const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let runtimeModules = null;
const activeSessions = new Map();

function resolveRuntimeFile(fileName) {
  const candidates = [];

  // In packaged apps, prefer extraResources/backend because it carries runtime deps.
  if (app.isPackaged) {
    candidates.push(path.join(process.resourcesPath, "backend", fileName));
  }

  candidates.push(
    path.join(__dirname, "../../backend", fileName),
    path.join(app.getAppPath(), "backend", fileName)
  );

  if (!app.isPackaged) {
    candidates.push(path.join(process.resourcesPath, "backend", fileName));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Runtime module ${fileName} not found.`);
}

function getRuntimeModules() {
  if (runtimeModules) {
    return runtimeModules;
  }

  const compilerPath = resolveRuntimeFile("compiler.js");
  const executorPath = resolveRuntimeFile("executor.js");

  const compiler = require(compilerPath);
  const executor = require(executorPath);

  if (typeof compiler.compileSolidity !== "function") {
    throw new Error("compileSolidity export missing from compiler.js");
  }

  if (
    typeof executor.deployContract !== "function" ||
    typeof executor.callFunction !== "function"
  ) {
    throw new Error("deployContract/callFunction exports missing from executor.js");
  }

  runtimeModules = {
    compileSolidity: compiler.compileSolidity,
    deployContract: executor.deployContract,
    callFunction: executor.callFunction,
  };

  return runtimeModules;
}

function serializeError(error) {
  if (!error) {
    return "Unknown error";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function ensureSolExtension(filePath) {
  if (!filePath) {
    return filePath;
  }

  return path.extname(filePath).toLowerCase() === ".sol"
    ? filePath
    : `${filePath}.sol`;
}

async function disconnectSession(session) {
  if (!session || !session.provider) {
    return;
  }

  try {
    await session.provider.disconnect();
  } catch (_) {
    // Best effort cleanup.
  }
}

async function clearAllSessions() {
  const sessions = Array.from(activeSessions.values());
  for (const session of sessions) {
    await disconnectSession(session);
  }
  activeSessions.clear();
}

async function runSafely(handler) {
  try {
    return await handler();
  } catch (error) {
    return { success: false, error: serializeError(error) };
  }
}

function getSenderWindow(event) {
  return BrowserWindow.fromWebContents(event.sender) || mainWindow;
}

function sendWindowState(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return;
  }

  targetWindow.webContents.send("window:state", {
    isMaximized: targetWindow.isMaximized(),
  });
}

function registerIPCHandlers() {
  ipcMain.handle("playground:health", async () => {
    return runSafely(async () => {
      getRuntimeModules();
      return {
        status: "ok",
        mode: "offline",
        sessions: activeSessions.size,
      };
    });
  });

  ipcMain.handle("playground:compile", async (_event, payload = {}) => {
    return runSafely(async () => {
      const { code, contractName } = payload;

      if (!code || typeof code !== "string") {
        return { success: false, error: "Missing 'code' in body." };
      }

      const { compileSolidity } = getRuntimeModules();
      return compileSolidity(code, contractName);
    });
  });

  ipcMain.handle("playground:deploy", async (_event, payload = {}) => {
    return runSafely(async () => {
      const { code, contractName, constructorArgs = [] } = payload;

      if (!code || typeof code !== "string") {
        return { success: false, error: "Missing 'code' in body." };
      }

      if (!Array.isArray(constructorArgs)) {
        return { success: false, error: "constructorArgs must be an array." };
      }

      const { compileSolidity, deployContract } = getRuntimeModules();
      const compiled = compileSolidity(code, contractName);

      if (!compiled.success) {
        return {
          success: false,
          errors: compiled.errors,
          warnings: compiled.warnings,
          contracts: compiled.contracts || [],
        };
      }

      const deployed = await deployContract(
        compiled.bytecode,
        compiled.abi,
        constructorArgs
      );

      if (!deployed.success) {
        return {
          success: false,
          error: deployed.error,
          warnings: compiled.warnings,
        };
      }

      if (activeSessions.has(deployed.contractAddress)) {
        await disconnectSession(activeSessions.get(deployed.contractAddress));
      }

      activeSessions.set(deployed.contractAddress, {
        web3: deployed.web3,
        contract: deployed.contract,
        provider: deployed.provider,
        deployer: deployed.deployer,
        accounts: deployed.accounts || [],
        abi: compiled.abi,
      });

      return {
        success: true,
        contractAddress: deployed.contractAddress,
        contractName: compiled.contractName,
        deployer: deployed.deployer,
        balance: deployed.balance,
        accounts: deployed.accounts || [],
        abi: compiled.abi,
        contracts: compiled.contracts || [],
        warnings: compiled.warnings,
      };
    });
  });

  ipcMain.handle("playground:call", async (_event, payload = {}) => {
    return runSafely(async () => {
      const {
        contractAddress,
        functionName,
        args = [],
        sender,
        value = "0",
      } = payload;

      if (!contractAddress || !functionName) {
        return {
          success: false,
          error: "Missing contractAddress or functionName.",
        };
      }

      if (!Array.isArray(args)) {
        return { success: false, error: "args must be an array." };
      }

      const session = activeSessions.get(contractAddress);
      if (!session) {
        return {
          success: false,
          error: "Contract session not found. Please deploy first.",
        };
      }

      const from = sender && typeof sender === "string" ? sender : session.deployer;
      const { callFunction } = getRuntimeModules();
      return callFunction(session, functionName, args, from, value);
    });
  });

  ipcMain.handle("playground:reset", async (_event, payload = {}) => {
    return runSafely(async () => {
      const contractAddress = payload.contractAddress;

      if (contractAddress && activeSessions.has(contractAddress)) {
        const session = activeSessions.get(contractAddress);
        await disconnectSession(session);
        activeSessions.delete(contractAddress);
        return { success: true, message: "Session cleared." };
      }

      if (contractAddress) {
        return { success: false, error: "Session not found." };
      }

      await clearAllSessions();
      return { success: true, message: "All sessions cleared." };
    });
  });

  ipcMain.handle("playground:file-open", async (_event, payload = {}) => {
    return runSafely(async () => {
      const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow;
      const options = {
        title: "Open Solidity File",
        properties: ["openFile"],
        filters: [
          { name: "Solidity Files", extensions: ["sol"] },
          { name: "All Files", extensions: ["*"] },
        ],
      };

      if (typeof payload.defaultPath === "string" && payload.defaultPath.trim()) {
        options.defaultPath = payload.defaultPath;
      }

      const result = await dialog.showOpenDialog(targetWindow, options);
      if (result.canceled || !result.filePaths.length) {
        return { success: true, canceled: true };
      }

      const filePath = result.filePaths[0];
      const content = await fs.promises.readFile(filePath, "utf8");
      return {
        success: true,
        canceled: false,
        filePath,
        content,
      };
    });
  });

  ipcMain.handle("playground:file-save", async (_event, payload = {}) => {
    return runSafely(async () => {
      if (typeof payload.filePath !== "string" || !payload.filePath.trim()) {
        return { success: false, error: "Missing filePath for save." };
      }

      const targetPath = ensureSolExtension(payload.filePath.trim());
      const content = typeof payload.content === "string" ? payload.content : "";

      await fs.promises.writeFile(targetPath, content, "utf8");
      return {
        success: true,
        filePath: targetPath,
      };
    });
  });

  ipcMain.handle("playground:file-save-as", async (_event, payload = {}) => {
    return runSafely(async () => {
      const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow;
      const content = typeof payload.content === "string" ? payload.content : "";
      const options = {
        title: "Save Solidity File",
        buttonLabel: "Save .sol",
        filters: [
          { name: "Solidity Files", extensions: ["sol"] },
          { name: "All Files", extensions: ["*"] },
        ],
      };

      if (typeof payload.filePath === "string" && payload.filePath.trim()) {
        options.defaultPath = ensureSolExtension(payload.filePath.trim());
      }

      const result = await dialog.showSaveDialog(targetWindow, options);
      if (result.canceled || !result.filePath) {
        return { success: true, canceled: true };
      }

      const targetPath = ensureSolExtension(result.filePath);
      await fs.promises.writeFile(targetPath, content, "utf8");

      return {
        success: true,
        canceled: false,
        filePath: targetPath,
      };
    });
  });

  ipcMain.handle("window:minimize", async (event) => {
    return runSafely(async () => {
      const targetWindow = getSenderWindow(event);
      if (targetWindow) {
        targetWindow.minimize();
      }
      return { success: true };
    });
  });

  ipcMain.handle("window:toggle-maximize", async (event) => {
    return runSafely(async () => {
      const targetWindow = getSenderWindow(event);
      if (!targetWindow) {
        return { success: false, error: "Window not found." };
      }

      if (targetWindow.isMaximized()) {
        targetWindow.unmaximize();
      } else {
        targetWindow.maximize();
      }

      return {
        success: true,
        isMaximized: targetWindow.isMaximized(),
      };
    });
  });

  ipcMain.handle("window:is-maximized", async (event) => {
    return runSafely(async () => {
      const targetWindow = getSenderWindow(event);
      return {
        success: true,
        isMaximized: Boolean(targetWindow && targetWindow.isMaximized()),
      };
    });
  });

  ipcMain.handle("window:close", async (event) => {
    return runSafely(async () => {
      const targetWindow = getSenderWindow(event);
      if (targetWindow) {
        targetWindow.close();
      }
      return { success: true };
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 560,
    backgroundColor: "#0f1117",
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      devTools: false,
    },
    icon: path.join(__dirname, "../../assets/final_icon.png"),
    title: "Solidity Playground",
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  mainWindow.webContents.on("did-finish-load", () => {
    sendWindowState(mainWindow);
  });

  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault();
    mainWindow.setTitle("Solidity Playground");
  });

  mainWindow.on("maximize", () => {
    sendWindowState(mainWindow);
  });

  mainWindow.on("unmaximize", () => {
    sendWindowState(mainWindow);
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    const key = (input.key || "").toUpperCase();
    const isF12 = key === "F12";
    const isCtrlShiftI = input.control && input.shift && key === "I";
    const isCtrlShiftJ = input.control && input.shift && key === "J";
    const isCmdAltI = input.meta && input.alt && key === "I";
    if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCmdAltI) {
      event.preventDefault();
    }
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  app.setName("Solidity Playground");
  registerIPCHandlers();
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  await clearAllSessions();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await clearAllSessions();
});
