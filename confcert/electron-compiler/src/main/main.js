const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");

const EXPLORER_IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
]);

const TEXT_FILE_EXTENSIONS = new Set([
  ".sol",
  ".txt",
  ".md",
  ".json",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".yml",
  ".yaml",
]);

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

function isTextFilePath(filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  return TEXT_FILE_EXTENSIONS.has(ext);
}

async function listExplorerItems(rootDir) {
  const rootPath = path.resolve(rootDir);
  const maxDepth = 5;
  const maxItems = 1200;
  const items = [];

  async function walk(currentDir, depth) {
    if (depth > maxDepth || items.length >= maxItems) {
      return;
    }

    let dirEntries = [];
    try {
      dirEntries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch (_) {
      return;
    }

    dirEntries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of dirEntries) {
      if (items.length >= maxItems) {
        break;
      }

      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootPath, fullPath).split(path.sep).join("/");

      if (entry.isDirectory()) {
        if (EXPLORER_IGNORED_DIRS.has(entry.name.toLowerCase())) {
          continue;
        }

        items.push({
          type: "directory",
          name: entry.name,
          path: fullPath,
          relativePath,
          depth,
        });

        await walk(fullPath, depth + 1);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      items.push({
        type: "file",
        name: entry.name,
        path: fullPath,
        relativePath,
        depth,
        openable: isTextFilePath(fullPath),
      });
    }
  }

  await walk(rootPath, 0);
  return items;
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

  ipcMain.handle("playground:folder-open", async (_event, payload = {}) => {
    return runSafely(async () => {
      const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow;
      const options = {
        title: "Open Folder",
        properties: ["openDirectory"],
      };

      if (typeof payload.defaultPath === "string" && payload.defaultPath.trim()) {
        options.defaultPath = payload.defaultPath;
      }

      const result = await dialog.showOpenDialog(targetWindow, options);
      if (result.canceled || !result.filePaths.length) {
        return { success: true, canceled: true };
      }

      return {
        success: true,
        canceled: false,
        dirPath: result.filePaths[0],
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

  ipcMain.handle("playground:file-read", async (_event, payload = {}) => {
    return runSafely(async () => {
      const rawPath = typeof payload.filePath === "string" ? payload.filePath.trim() : "";
      if (!rawPath) {
        return { success: false, error: "Missing filePath for read." };
      }

      const targetPath = path.resolve(rawPath);
      const stats = await fs.promises.stat(targetPath);

      if (!stats.isFile()) {
        return { success: false, error: "Path is not a file." };
      }

      if (!isTextFilePath(targetPath)) {
        return { success: false, error: "File type is not supported in editor." };
      }

      const content = await fs.promises.readFile(targetPath, "utf8");
      return {
        success: true,
        filePath: targetPath,
        directoryPath: path.dirname(targetPath),
        content,
      };
    });
  });

  ipcMain.handle("playground:file-list", async (_event, payload = {}) => {
    return runSafely(async () => {
      const rawDir = typeof payload.dirPath === "string" ? payload.dirPath.trim() : "";
      if (!rawDir) {
        return { success: false, error: "Missing dirPath for file list." };
      }

      const dirPath = path.resolve(rawDir);
      const stats = await fs.promises.stat(dirPath);

      if (!stats.isDirectory()) {
        return { success: false, error: "dirPath is not a directory." };
      }

      const items = await listExplorerItems(dirPath);
      return {
        success: true,
        dirPath,
        items,
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

function setupAutoUpdater() {
  // Updates are only available for packaged builds with a valid publish config.
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = false;

  autoUpdater.on("error", (error) => {
    console.error("[updater] error:", serializeError(error));
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[updater] update available: ${info?.version || "unknown"}`);

    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message: "New version available. Download?",
        buttons: ["Yes", "No"],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate().catch((error) => {
            console.error("[updater] download failed:", serializeError(error));
          });
        }
      })
      .catch((error) => {
        console.error("[updater] prompt failed:", serializeError(error));
      });
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[updater] no updates available");
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Install Update",
        message: "Update downloaded. Restart now?",
        buttons: ["Restart", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      })
      .catch((error) => {
        console.error("[updater] restart prompt failed:", serializeError(error));
      });
  });

  autoUpdater.checkForUpdates().catch((error) => {
    console.error("[updater] check failed:", serializeError(error));
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
    icon: path.join(__dirname, "../../assets/final_icon.ico"),
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
  setupAutoUpdater();

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
