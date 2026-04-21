"use strict";

const FEEDBACK_URL = "https://smartcontractsbyamar.vercel.app/feedback";
const UI_PREFS_STORAGE_KEY = "solidityPlaygroundUIPrefsV1";
const VERSION = window.APP_VERSION || "1.1.2"; // Fallback if version.js fails to load
const DEFAULT_UI_FONT_SIZE = 18;
const DEFAULT_SIDEBAR_FONT_SIZE = 12;
const DEFAULT_TERMINAL_FONT_SIZE = 12;
const MIN_UI_FONT_SIZE = 10;
const MAX_UI_FONT_SIZE = 20;
const DEFAULT_TERMINAL_HEIGHT = 220;
const MIN_TERMINAL_HEIGHT = 90;
const MAX_TERMINAL_HEIGHT = 520;
const TERMINAL_HEIGHT_STEP = 24;
const SIDEBAR_PANELS = ["explorer", "compile", "settings"];

const EDITOR_FONT_OPTIONS = {
  consolas: "Consolas, 'Courier New', monospace",
  cascadia: "'Cascadia Code', Consolas, 'Courier New', monospace",
  jetbrains: "'JetBrains Mono', Consolas, 'Courier New', monospace",
  fira: "'Fira Code', Consolas, 'Courier New', monospace",
  courier: "'Courier New', monospace",
};

const EDITOR_FONT_LABELS = {
  consolas: "Consolas",
  cascadia: "Cascadia Code",
  jetbrains: "JetBrains Mono",
  fira: "Fira Code",
  courier: "Courier New",
};

const DEFAULT_UI_PREFS = {
  theme: "dark",
  editorFontSize: 13,
  editorFontKey: "consolas",
  sidebarFontSize: DEFAULT_SIDEBAR_FONT_SIZE,
  terminalFontSize: DEFAULT_TERMINAL_FONT_SIZE,
  terminalHeight: DEFAULT_TERMINAL_HEIGHT,
  terminalHidden: false,
  terminalLastOpenHeight: DEFAULT_TERMINAL_HEIGHT,
  sidebarHidden: false,
  activeSidebarPanel: "explorer",
};

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  runtimeMode: "offline",
  code: "",
  currentFilePath: "",
  tabs: [],
  activeTabId: "",
  nextUntitledTabNumber: 1,
  explorerRootPath: "",
  explorerItems: [],
  abi: [],
  compiledContracts: [],
  selectedContract: "",
  compilerMeta: null,
  deployment: null,
  selectedSender: "",
  accounts: [],
  selectedFnSig: "",
  fnArgValues: {},
  callValueWei: "0",
  constructorArgValues: {},
  busy: { compile: false, deploy: false, call: false, reset: false },
  editor: null,
  plainEditor: null,
  monaco: null,
  ui: {
    theme: DEFAULT_UI_PREFS.theme,
    editorFontSize: DEFAULT_UI_PREFS.editorFontSize,
    editorFontKey: DEFAULT_UI_PREFS.editorFontKey,
    sidebarFontSize: DEFAULT_UI_PREFS.sidebarFontSize,
    terminalFontSize: DEFAULT_UI_PREFS.terminalFontSize,
    terminalHeight: DEFAULT_UI_PREFS.terminalHeight,
    terminalHidden: DEFAULT_UI_PREFS.terminalHidden,
    terminalLastOpenHeight: DEFAULT_UI_PREFS.terminalLastOpenHeight,
    sidebarHidden: DEFAULT_UI_PREFS.sidebarHidden,
    activeSidebarPanel: DEFAULT_UI_PREFS.activeSidebarPanel,
  },
};

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = {
  counter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract CounterLab {
    uint256 public count;

    constructor(uint256 initialCount) {
        count = initialCount;
    }

    function increment() public {
        count += 1;
    }

    function setCount(uint256 nextCount) public {
        count = nextCount;
    }

    function readCount() public view returns (uint256) {
        return count;
    }
}`,

  greeter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract GreeterLab {
    string private greeting;

    constructor(string memory initialGreeting) {
        greeting = initialGreeting;
    }

    function setGreeting(string memory nextGreeting) public {
        greeting = nextGreeting;
    }

    function getGreeting() public view returns (string memory) {
        return greeting;
    }
}`,

  vault: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract SimpleVaultLab {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        require(msg.value > 0, "Value must be greater than zero");
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amountWei) external {
        require(amountWei > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= amountWei, "Insufficient balance");
        balances[msg.sender] -= amountWei;
        (bool ok, ) = payable(msg.sender).call{value: amountWei}("");
        require(ok, "Transfer failed");
    }

    function myBalance() external view returns (uint256) {
        return balances[msg.sender];
    }
}`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toFunctionSignature(fn) {
  return `${fn.name}(${(fn.inputs || []).map((i) => i.type).join(",")})`;
}
function isReadOnly(fn) {
  return fn.stateMutability === "view" || fn.stateMutability === "pure";
}
function defaultValueForType(type) {
  if (!type) return "";
  if (type.includes("[")) return "[]";
  if (type === "bool") return "false";
  if (type.startsWith("uint") || type.startsWith("int")) return "0";
  if (type === "address") return "0x0000000000000000000000000000000000000000";
  if (type.startsWith("bytes")) return "0x";
  if (type === "tuple") return "{}";
  return "";
}
function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 10) + "…" + addr.slice(-8);
}

function getFileLabel(filePath) {
  if (!filePath) {
    return "Untitled.sol";
  }

  const parts = String(filePath).split(/[\\/]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "Untitled.sol";
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampTerminalHeight(value, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(MAX_TERMINAL_HEIGHT, Math.max(0, Math.round(Number(value))));
}

function normalizeTheme(value) {
  return value === "light" ? "light" : "dark";
}

function normalizeFontKey(value) {
  if (Object.prototype.hasOwnProperty.call(EDITOR_FONT_OPTIONS, value)) {
    return value;
  }
  return DEFAULT_UI_PREFS.editorFontKey;
}

function normalizeSidebarPanel(value) {
  if (value === "tester") {
    return "compile";
  }
  return SIDEBAR_PANELS.includes(value) ? value : DEFAULT_UI_PREFS.activeSidebarPanel;
}

function normalizePathForComparison(filePath) {
  return String(filePath || "").replace(/\\/g, "/").toLowerCase();
}

function getParentDirectoryPath(filePath) {
  const raw = String(filePath || "");
  const slashIndex = Math.max(raw.lastIndexOf("/"), raw.lastIndexOf("\\"));

  if (slashIndex < 0) {
    return "";
  }

  if (slashIndex === 2 && /^[A-Za-z]:[\\/]/.test(raw)) {
    return raw.slice(0, 3);
  }

  return raw.slice(0, slashIndex);
}

function getUpLevelDirectoryPath(dirPath) {
  const normalized = String(dirPath || "").replace(/[\\/]+$/, "");
  if (!normalized) {
    return "";
  }

  const parent = getParentDirectoryPath(normalized);
  if (!parent) {
    return "";
  }

  if (normalizePathForComparison(parent) === normalizePathForComparison(normalized)) {
    return "";
  }

  return parent;
}

function getFontDisplayName(fontKey) {
  return EDITOR_FONT_LABELS[fontKey] || fontKey;
}

function setTheme(theme) {
  const nextTheme = normalizeTheme(theme);
  if (nextTheme === state.ui.theme) {
    return;
  }

  state.ui.theme = nextTheme;
  applyUiPreferences();
}

function setEditorFontKey(fontKey) {
  const nextKey = normalizeFontKey(fontKey);
  if (nextKey === state.ui.editorFontKey) {
    return;
  }

  state.ui.editorFontKey = nextKey;
  applyUiPreferences();
  showToast(`Editor font: ${getFontDisplayName(nextKey)}`);
}

function getEditorFontFamily() {
  return EDITOR_FONT_OPTIONS[state.ui.editorFontKey] || EDITOR_FONT_OPTIONS[DEFAULT_UI_PREFS.editorFontKey];
}

function getMonacoThemeName(theme) {
  return theme === "light" ? "sol-tokyonight-light" : "sol-vscode-dark";
}

function loadUiPreferences() {
  let parsed = {};

  try {
    parsed = JSON.parse(localStorage.getItem(UI_PREFS_STORAGE_KEY) || "{}");
  } catch (_) {
    parsed = {};
  }

  state.ui.theme = normalizeTheme(parsed.theme);
  state.ui.editorFontSize = clampNumber(Number(parsed.editorFontSize), 11, 24, DEFAULT_UI_PREFS.editorFontSize);
  state.ui.editorFontKey = normalizeFontKey(parsed.editorFontKey);
  state.ui.sidebarFontSize = clampNumber(Number(parsed.sidebarFontSize), MIN_UI_FONT_SIZE, MAX_UI_FONT_SIZE, DEFAULT_SIDEBAR_FONT_SIZE);
  state.ui.terminalFontSize = clampNumber(Number(parsed.terminalFontSize), MIN_UI_FONT_SIZE, MAX_UI_FONT_SIZE, DEFAULT_TERMINAL_FONT_SIZE);
  state.ui.terminalHeight = clampTerminalHeight(Number(parsed.terminalHeight), DEFAULT_UI_PREFS.terminalHeight);
  state.ui.terminalHidden = Boolean(parsed.terminalHidden);
  state.ui.terminalLastOpenHeight = clampTerminalHeight(
    Number(parsed.terminalLastOpenHeight),
    DEFAULT_UI_PREFS.terminalLastOpenHeight
  );
  state.ui.sidebarHidden = Boolean(parsed.sidebarHidden);
  state.ui.activeSidebarPanel = normalizeSidebarPanel(parsed.activeSidebarPanel);

  if (state.ui.terminalHeight >= MIN_TERMINAL_HEIGHT) {
    state.ui.terminalLastOpenHeight = state.ui.terminalHeight;
  }
}

function saveUiPreferences() {
  try {
    localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(state.ui));
  } catch (_) {
    // Ignore localStorage write failures.
  }
}

function syncAppearanceInputs() {
  const themeSelect = document.getElementById("theme-select");
  const fontFamilySelect = document.getElementById("font-family-select");
  const editorFontSizeRange = document.getElementById("editor-font-size-range");
  const editorFontSizeValue = document.getElementById("editor-font-size-value");

  if (themeSelect) {
    themeSelect.value = state.ui.theme;
  }

  if (fontFamilySelect) {
    fontFamilySelect.value = state.ui.editorFontKey;
  }

  if (editorFontSizeRange) {
    editorFontSizeRange.value = String(state.ui.editorFontSize);
  }

  if (editorFontSizeValue) {
    editorFontSizeValue.textContent = `${state.ui.editorFontSize}px`;
  }
}

function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) || null;
}

function createTabEntry({ filePath = "", content = "" } = {}) {
  const safePath = typeof filePath === "string" ? filePath : "";
  const untitledIndex = state.nextUntitledTabNumber;

  if (!safePath) {
    state.nextUntitledTabNumber += 1;
  }

  return {
    id: `tab_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    filePath: safePath,
    title: safePath
      ? getFileLabel(safePath)
      : (untitledIndex === 1 ? "Untitled.sol" : `Untitled-${untitledIndex}.sol`),
    content: typeof content === "string" ? content : "",
  };
}

function initializeEditorTabs(initialContent) {
  state.tabs = [];
  state.activeTabId = "";
  state.nextUntitledTabNumber = 1;

  const firstTab = createTabEntry({ content: initialContent || "" });
  state.tabs.push(firstTab);
  state.activeTabId = firstTab.id;
  state.code = firstTab.content;
  state.currentFilePath = "";
}

function syncActiveTabContentFromEditor() {
  const activeTab = getActiveTab();
  if (!activeTab) {
    return;
  }

  const value = state.editor
    ? state.editor.getValue()
    : (state.plainEditor ? state.plainEditor.value : state.code || "");

  activeTab.content = value;
  state.code = value;
  state.currentFilePath = activeTab.filePath || "";
}

function renderTabBar() {
  const tabBar = document.getElementById("tab-bar");
  if (!tabBar) {
    return;
  }

  tabBar.innerHTML = "";

  state.tabs.forEach((tab) => {
    const tabEl = document.createElement("div");
    tabEl.className = `editor-tab${tab.id === state.activeTabId ? " active" : ""}`;
    tabEl.dataset.tabId = tab.id;
    tabEl.title = tab.filePath || tab.title;

    const nameEl = document.createElement("span");
    nameEl.className = "tab-file-name";
    nameEl.textContent = tab.title;

    const closeEl = document.createElement("span");
    closeEl.className = "tab-close-btn";
    closeEl.setAttribute("aria-label", "Close tab");
    closeEl.textContent = "x";

    tabEl.appendChild(nameEl);
    tabEl.appendChild(closeEl);
    tabBar.appendChild(tabEl);
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "tab-add-btn";
  addButton.setAttribute("aria-label", "New File");
  addButton.title = "New File (Ctrl+N)";
  addButton.textContent = "+";
  tabBar.appendChild(addButton);
}

function activateTab(tabId, options = {}) {
  const nextTab = state.tabs.find((tab) => tab.id === tabId);
  if (!nextTab) {
    return;
  }

  if (options.syncCurrent !== false) {
    syncActiveTabContentFromEditor();
  }

  state.activeTabId = nextTab.id;
  state.currentFilePath = nextTab.filePath || "";
  state.code = nextTab.content || "";

  setEditorValue(nextTab.content || "");
  updateCurrentFileLabel();
  renderExplorerTree();
}

function findOpenTabByFilePath(filePath) {
  const key = normalizePathForComparison(filePath);
  if (!key) {
    return null;
  }

  return state.tabs.find(
    (tab) => tab.filePath && normalizePathForComparison(tab.filePath) === key
  ) || null;
}

function openDocumentInTab(filePath, content) {
  syncActiveTabContentFromEditor();

  let tab = findOpenTabByFilePath(filePath);
  if (tab) {
    tab.filePath = filePath;
    tab.title = getFileLabel(filePath);
    tab.content = typeof content === "string" ? content : "";
    activateTab(tab.id, { syncCurrent: false });
    return tab;
  }

  tab = createTabEntry({ filePath, content });
  state.tabs.push(tab);
  activateTab(tab.id, { syncCurrent: false });
  return tab;
}

function createNewFileTab() {
  syncActiveTabContentFromEditor();

  const tab = createTabEntry({ content: "" });
  state.tabs.push(tab);
  activateTab(tab.id, { syncCurrent: false });

  showToast(`Created ${tab.title}`);
  addLog("info", `Created ${tab.title}`);
  return tab;
}

function closeTabById(tabId) {
  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0) {
    return;
  }

  syncActiveTabContentFromEditor();

  const closingActiveTab = state.activeTabId === tabId;
  state.tabs.splice(index, 1);

  if (!state.tabs.length) {
    const replacementTab = createTabEntry({ content: "" });
    state.tabs.push(replacementTab);
    state.activeTabId = replacementTab.id;
    state.currentFilePath = "";
    state.code = "";
    setEditorValue("");
    updateCurrentFileLabel();
    renderExplorerTree();
    return;
  }

  if (closingActiveTab) {
    const fallbackTab = state.tabs[Math.max(0, index - 1)] || state.tabs[0];
    activateTab(fallbackTab.id, { syncCurrent: false });
    return;
  }

  renderTabBar();
}

function initTabBar() {
  const tabBar = document.getElementById("tab-bar");
  if (!tabBar) {
    return;
  }

  tabBar.addEventListener("click", (event) => {
    const addButton = event.target.closest(".tab-add-btn");
    if (addButton) {
      createNewFileTab();
      return;
    }

    const tabEl = event.target.closest(".editor-tab");
    if (!tabEl) {
      return;
    }

    const tabId = tabEl.dataset.tabId;
    if (!tabId) {
      return;
    }

    const closeBtn = event.target.closest(".tab-close-btn");
    if (closeBtn) {
      event.stopPropagation();
      closeTabById(tabId);
      return;
    }

    if (tabId !== state.activeTabId) {
      activateTab(tabId);
    }
  });
}

function renderExplorerTree() {
  const rootLabel = document.getElementById("explorer-root");
  const tree = document.getElementById("file-tree");

  if (rootLabel) {
    if (state.explorerRootPath) {
      rootLabel.textContent = `Folder: ${state.explorerRootPath}`;
      rootLabel.title = state.explorerRootPath;
    } else {
      rootLabel.textContent = "Folder: Not loaded";
      rootLabel.title = "No folder loaded";
    }
  }

  if (!tree) {
    return;
  }

  tree.innerHTML = "";

  if (!state.explorerRootPath) {
    const empty = document.createElement("div");
    empty.className = "file-tree-empty";
    empty.textContent = "Open Folder to load project files.";
    tree.appendChild(empty);
    return;
  }

  if (!state.explorerItems.length) {
    const empty = document.createElement("div");
    empty.className = "file-tree-empty";
    empty.textContent = "No files found in this folder.";
    tree.appendChild(empty);
    return;
  }

  const activePathKey = normalizePathForComparison(state.currentFilePath);
  const upLevelPath = getUpLevelDirectoryPath(state.explorerRootPath);

  if (upLevelPath) {
    const upRow = document.createElement("div");
    upRow.className = "file-tree-item directory up-level";
    upRow.dataset.dirPath = upLevelPath;
    upRow.title = upLevelPath;

    const upLabel = document.createElement("span");
    upLabel.className = "file-tree-item-label";
    upLabel.textContent = "..";

    upRow.appendChild(upLabel);
    tree.appendChild(upRow);
  }

  state.explorerItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = `file-tree-item ${item.type}`;
    row.style.paddingLeft = `${8 + (Number(item.depth) || 0) * 14}px`;

    const label = document.createElement("span");
    label.className = "file-tree-item-label";
    label.textContent = item.type === "directory"
      ? `> ${item.name}`
      : item.name;

    row.appendChild(label);

    if (item.type === "file") {
      const openable = item.openable !== false;
      row.dataset.filePath = item.path;
      row.dataset.openable = openable ? "true" : "false";
      row.classList.toggle("readonly", !openable);
      row.title = openable ? item.path : `${item.path} (Preview unsupported)`;

      if (normalizePathForComparison(item.path) === activePathKey) {
        row.classList.add("active");
      }
    } else if (item.type === "directory") {
      row.dataset.dirPath = item.path;
      row.title = item.path;
    }

    tree.appendChild(row);
  });
}

async function openDirectoryInExplorer(dirPath) {
  const targetDir = typeof dirPath === "string" ? dirPath.trim() : "";
  if (!targetDir) {
    return;
  }

  state.explorerRootPath = targetDir;
  await refreshExplorerTree();
}

async function refreshExplorerTree() {
  if (!state.explorerRootPath) {
    state.explorerItems = [];
    renderExplorerTree();
    return;
  }

  const tree = document.getElementById("file-tree");
  if (tree) {
    tree.innerHTML = '<div class="file-tree-empty">Loading files…</div>';
  }

  if (!window.electronAPI?.playground?.listFiles) {
    state.explorerItems = [];
    renderExplorerTree();
    addLog("error", "Sidebar file manager is unavailable in this build.");
    return;
  }

  try {
    const result = await window.electronAPI.playground.listFiles({
      dirPath: state.explorerRootPath,
    });

    if (!result || result.success === false) {
      state.explorerItems = [];
      renderExplorerTree();
      addLog("error", result?.error || "Failed to load file manager entries.");
      return;
    }

    state.explorerItems = Array.isArray(result.items) ? result.items : [];
    renderExplorerTree();
  } catch (err) {
    state.explorerItems = [];
    renderExplorerTree();
    addLog("error", `File manager refresh failed: ${err.message}`);
  }
}

async function syncExplorerRootFromFilePath(filePath) {
  const parentDir = getParentDirectoryPath(filePath);
  if (!parentDir) {
    return;
  }

  if (state.explorerRootPath) {
    const rootKey = normalizePathForComparison(state.explorerRootPath).replace(/\/+$/, "");
    const fileKey = normalizePathForComparison(filePath);

    if (fileKey === rootKey || fileKey.startsWith(`${rootKey}/`)) {
      renderExplorerTree();
      return;
    }
  }

  const nextKey = normalizePathForComparison(parentDir);
  const currentKey = normalizePathForComparison(state.explorerRootPath);
  state.explorerRootPath = parentDir;

  if (nextKey !== currentKey) {
    await refreshExplorerTree();
  } else {
    renderExplorerTree();
  }
}

async function openFolderInExplorer() {
  if (!window.electronAPI?.playground?.openFolder) {
    addLog("error", "Open Folder is unavailable in this build.");
    return;
  }

  try {
    const activeTab = getActiveTab();
    const data = await window.electronAPI.playground.openFolder({
      defaultPath: state.explorerRootPath || activeTab?.filePath || state.currentFilePath || undefined,
    });

    if (!data || data.success === false) {
      addLog("error", data?.error || "Failed to open folder.");
      return;
    }

    if (data.canceled || !data.dirPath) {
      return;
    }

    state.explorerRootPath = data.dirPath;
    await refreshExplorerTree();

    state.ui.activeSidebarPanel = "explorer";
    state.ui.sidebarHidden = false;
    applyUiPreferences();

    showToast(`Opened folder: ${data.dirPath}`);
    addLog("success", `Opened folder: ${data.dirPath}`);
  } catch (err) {
    addLog("error", `Open folder failed: ${err.message}`);
  }
}

async function openFileFromPath(filePath, options = {}) {
  if (!window.electronAPI?.playground?.readFile) {
    addLog("error", "File open from sidebar is unavailable in this build.");
    return;
  }

  try {
    const result = await window.electronAPI.playground.readFile({ filePath });

    if (!result || result.success === false) {
      addLog("error", result?.error || "Failed to open file.");
      return;
    }

    const resolvedPath = result.filePath || filePath;
    const content = typeof result.content === "string" ? result.content : "";
    openDocumentInTab(resolvedPath, content);

    if (options.syncExplorerRoot !== false) {
      await syncExplorerRootFromFilePath(resolvedPath);
    } else {
      renderExplorerTree();
    }

    showToast(`Opened ${getFileLabel(resolvedPath)}`);
    addLog("success", `Opened ${getFileLabel(resolvedPath)}`);
  } catch (err) {
    addLog("error", `Open file failed: ${err.message}`);
  }
}

function applySidebarLayout() {
  const sidebar = document.getElementById("sidebar") || document.querySelector(".sidebar");
  const activePanel = normalizeSidebarPanel(state.ui.activeSidebarPanel);

  state.ui.activeSidebarPanel = activePanel;

  document.querySelectorAll(".act-btn[data-panel]").forEach((btn) => {
    btn.classList.toggle("act-active", btn.dataset.panel === activePanel);
  });

  if (sidebar) {
    sidebar.classList.toggle("is-hidden", Boolean(state.ui.sidebarHidden));
    sidebar.querySelectorAll(".sidebar-section[data-panel-group]").forEach((section) => {
      const group = section.dataset.panelGroup;
      let show = group === activePanel;

      if (section.id === "deployment-section" && !state.deployment) {
        show = false;
      }

      section.style.display = show ? "" : "none";
    });
  }
}

function updateTabLabel() {
  renderTabBar();
}

function updateBreadcrumb() {
  const bcContract = document.getElementById("bc-contract");
  if (!bcContract) {
    return;
  }

  const fileName = getFileLabel(state.currentFilePath || "Untitled.sol");
  bcContract.textContent = state.selectedContract ? `${fileName} > ${state.selectedContract}` : fileName;
}

function updateStatusBar() {
  const deployEl = document.getElementById("sb-deploy");
  const compilerEl = document.getElementById("sb-compiler");

  if (deployEl) {
    deployEl.textContent = state.deployment
      ? `${state.deployment.contractName} @ ${shortAddr(state.deployment.contractAddress)}`
      : "No deployment";
  }

  if (compilerEl) {
    const contractName = state.compilerMeta?.contractName;
    compilerEl.textContent = contractName ? `Solidity 0.8.21 • ${contractName}` : "Solidity 0.8.21";
  }
}

function updateCursorStatus(line, column) {
  const cursorEl = document.getElementById("sb-cursor");
  if (!cursorEl) {
    return;
  }

  const safeLine = Math.max(1, Number(line) || 1);
  const safeColumn = Math.max(1, Number(column) || 1);
  cursorEl.textContent = `Ln ${safeLine}, Col ${safeColumn}`;
}

function getTextareaCursorPosition(textarea) {
  const cursor = Math.max(0, textarea.selectionStart || 0);
  const before = textarea.value.slice(0, cursor);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: (lines[lines.length - 1] || "").length + 1,
  };
}

function applyTerminalPanelLayout() {
  const panel = document.querySelector(".terminal-panel");
  const grip = document.getElementById("terminal-resizer");
  if (!panel) {
    return;
  }

  const hidden = Boolean(state.ui.terminalHidden);

  if (hidden) {
    document.documentElement.style.setProperty("--terminal-height", "0px");
    panel.classList.add("is-collapsed");
    if (grip) {
      grip.classList.add("is-hidden");
    }
    return;
  }

  const height = clampTerminalHeight(state.ui.terminalHeight, DEFAULT_TERMINAL_HEIGHT);
  state.ui.terminalHeight = Math.max(MIN_TERMINAL_HEIGHT, height);
  if (state.ui.terminalHeight >= MIN_TERMINAL_HEIGHT) {
    state.ui.terminalLastOpenHeight = state.ui.terminalHeight;
  }

  document.documentElement.style.setProperty("--terminal-height", `${state.ui.terminalHeight}px`);
  panel.classList.remove("is-collapsed");
  if (grip) {
    grip.classList.remove("is-hidden");
  }
}

function applyUiPreferences(options = {}) {
  const shouldPersist = options.persist !== false;

  document.body.setAttribute("data-theme", state.ui.theme);
  document.documentElement.style.setProperty("--ui-font-size", `${DEFAULT_UI_FONT_SIZE}px`);
  document.documentElement.style.setProperty("--editor-font-size", `${state.ui.editorFontSize}px`);
  document.documentElement.style.setProperty("--editor-font-family", getEditorFontFamily());
  document.documentElement.style.setProperty("--sidebar-font-size", `${state.ui.sidebarFontSize}px`);
  document.documentElement.style.setProperty("--terminal-font-size", `${state.ui.terminalFontSize}px`);

  applySidebarLayout();
  applyTerminalPanelLayout();

  if (state.editor) {
    state.editor.updateOptions({
      fontSize: state.ui.editorFontSize,
      fontFamily: getEditorFontFamily(),
    });
  }

  if (state.monaco) {
    state.monaco.editor.setTheme(getMonacoThemeName(state.ui.theme));
  }

  if (state.plainEditor) {
    state.plainEditor.style.fontSize = `${state.ui.editorFontSize}px`;
    state.plainEditor.style.fontFamily = getEditorFontFamily();
  }

  syncAppearanceInputs();

  if (shouldPersist) {
    saveUiPreferences();
  }
}

function initAppearanceControls() {
  const themeSelect = document.getElementById("theme-select");
  const fontFamilySelect = document.getElementById("font-family-select");
  const editorFontSizeRange = document.getElementById("editor-font-size-range");

  if (themeSelect) {
    themeSelect.addEventListener("change", (event) => {
      state.ui.theme = normalizeTheme(event.target.value);
      applyUiPreferences();
    });
  }

  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", (event) => {
      state.ui.editorFontKey = normalizeFontKey(event.target.value);
      applyUiPreferences();
    });
  }

  if (editorFontSizeRange) {
    editorFontSizeRange.addEventListener("input", (event) => {
      state.ui.editorFontSize = clampNumber(Number(event.target.value), 11, 24, DEFAULT_UI_PREFS.editorFontSize);
      applyUiPreferences();
    });
  }

  syncAppearanceInputs();
}

function changeEditorFontSizeBy(delta) {
  const nextSize = clampNumber(
    state.ui.editorFontSize + delta,
    11,
    24,
    DEFAULT_UI_PREFS.editorFontSize
  );

  if (nextSize === state.ui.editorFontSize) {
    return;
  }

  state.ui.editorFontSize = nextSize;
  applyUiPreferences();
  showToast(`Editor font size: ${nextSize}px`);
}

function changeAllFontSizesBy(delta) {
  // Change editor font size
  const nextEditorSize = clampNumber(
    state.ui.editorFontSize + delta,
    11,
    24,
    DEFAULT_UI_PREFS.editorFontSize
  );

  // Change sidebar font size
  const nextSidebarSize = clampNumber(
    state.ui.sidebarFontSize + delta,
    MIN_UI_FONT_SIZE,
    MAX_UI_FONT_SIZE,
    DEFAULT_SIDEBAR_FONT_SIZE
  );

  // Change terminal font size
  const nextTerminalSize = clampNumber(
    state.ui.terminalFontSize + delta,
    MIN_UI_FONT_SIZE,
    MAX_UI_FONT_SIZE,
    DEFAULT_TERMINAL_FONT_SIZE
  );

  // Check if any size changed
  const hasChanges = 
    nextEditorSize !== state.ui.editorFontSize ||
    nextSidebarSize !== state.ui.sidebarFontSize ||
    nextTerminalSize !== state.ui.terminalFontSize;

  if (!hasChanges) {
    return;
  }

  state.ui.editorFontSize = nextEditorSize;
  state.ui.sidebarFontSize = nextSidebarSize;
  state.ui.terminalFontSize = nextTerminalSize;
  applyUiPreferences();
  showToast(`Application zoom: Editor ${nextEditorSize}px, UI ${nextSidebarSize}px`);
}

function changeSidebarFontSizeBy(delta) {
  const nextSize = clampNumber(
    state.ui.sidebarFontSize + delta,
    MIN_UI_FONT_SIZE,
    MAX_UI_FONT_SIZE,
    DEFAULT_SIDEBAR_FONT_SIZE
  );

  if (nextSize === state.ui.sidebarFontSize) {
    return;
  }

  state.ui.sidebarFontSize = nextSize;
  applyUiPreferences();
  showToast(`Sidebar font size: ${nextSize}px`);
}

function changeTerminalFontSizeBy(delta) {
  const nextSize = clampNumber(
    state.ui.terminalFontSize + delta,
    MIN_UI_FONT_SIZE,
    MAX_UI_FONT_SIZE,
    DEFAULT_TERMINAL_FONT_SIZE
  );

  if (nextSize === state.ui.terminalFontSize) {
    return;
  }

  state.ui.terminalFontSize = nextSize;
  applyUiPreferences();
  showToast(`Terminal font size: ${nextSize}px`);
}

function toggleTerminalVisibility() {
  if (state.ui.terminalHidden) {
    state.ui.terminalHidden = false;
    const restoreHeight = clampTerminalHeight(
      state.ui.terminalLastOpenHeight,
      DEFAULT_TERMINAL_HEIGHT
    );
    state.ui.terminalHeight = Math.max(MIN_TERMINAL_HEIGHT, restoreHeight);
  } else {
    if (state.ui.terminalHeight >= MIN_TERMINAL_HEIGHT) {
      state.ui.terminalLastOpenHeight = state.ui.terminalHeight;
    }
    state.ui.terminalHidden = true;
  }

  applyUiPreferences();
}

function changeTerminalHeightBy(direction) {
  if (direction > 0 && state.ui.terminalHidden) {
    state.ui.terminalHidden = false;
    const restoreHeight = clampTerminalHeight(
      state.ui.terminalLastOpenHeight,
      DEFAULT_TERMINAL_HEIGHT
    );
    state.ui.terminalHeight = Math.max(MIN_TERMINAL_HEIGHT, restoreHeight);
    applyUiPreferences();
    return;
  }

  if (state.ui.terminalHidden) {
    return;
  }

  const currentHeight = clampTerminalHeight(
    state.ui.terminalHeight,
    DEFAULT_TERMINAL_HEIGHT
  );

  const nextHeight = clampTerminalHeight(
    currentHeight + (direction * TERMINAL_HEIGHT_STEP),
    DEFAULT_TERMINAL_HEIGHT
  );

  if (direction < 0 && nextHeight < MIN_TERMINAL_HEIGHT) {
    state.ui.terminalLastOpenHeight = Math.max(MIN_TERMINAL_HEIGHT, currentHeight);
    state.ui.terminalHidden = true;
    applyUiPreferences();
    return;
  }

  state.ui.terminalHeight = Math.max(MIN_TERMINAL_HEIGHT, nextHeight);
  state.ui.terminalLastOpenHeight = state.ui.terminalHeight;
  applyUiPreferences();
}

function setWindowMaximizedState(isMaximized) {
  const maximizeBtn = document.getElementById("btn-window-maximize");
  const restoreBtn = document.getElementById("btn-window-restore");
  if (!maximizeBtn || !restoreBtn) {
    return;
  }

  maximizeBtn.classList.toggle("is-hidden", Boolean(isMaximized));
  restoreBtn.classList.toggle("is-hidden", !Boolean(isMaximized));
}

function initWindowControls() {
  const controls = window.electronAPI && window.electronAPI.windowControls;
  if (!controls) {
    return;
  }

  const minimizeBtn = document.getElementById("btn-window-minimize");
  const maximizeBtn = document.getElementById("btn-window-maximize");
  const restoreBtn = document.getElementById("btn-window-restore");
  const closeBtn = document.getElementById("btn-window-close");

  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", async () => {
      await controls.minimize();
    });
  }

  const handleToggleMaximize = async () => {
    const result = await controls.toggleMaximize();
    if (result && typeof result.isMaximized === "boolean") {
      setWindowMaximizedState(result.isMaximized);
    }
  };

  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", handleToggleMaximize);
  }

  if (restoreBtn) {
    restoreBtn.addEventListener("click", handleToggleMaximize);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", async () => {
      await controls.close();
    });
  }

  if (typeof controls.onStateChange === "function") {
    controls.onStateChange((payload = {}) => {
      if (typeof payload.isMaximized === "boolean") {
        setWindowMaximizedState(payload.isMaximized);
      }
    });
  }

  controls.isMaximized().then((result) => {
    if (result && typeof result.isMaximized === "boolean") {
      setWindowMaximizedState(result.isMaximized);
    }
  });
}

function toggleSidebar() {
  state.ui.sidebarHidden = !state.ui.sidebarHidden;
  applyUiPreferences();
}

function initActivityBar() {
  document.querySelectorAll(".act-btn[data-panel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = normalizeSidebarPanel(btn.dataset.panel);
      if (state.ui.activeSidebarPanel === panel && !state.ui.sidebarHidden) {
        state.ui.sidebarHidden = true;
      } else {
        state.ui.activeSidebarPanel = panel;
        state.ui.sidebarHidden = false;
      }
      applyUiPreferences();
    });
  });
}

async function copySourceToClipboard() {
  const code = getEditorValue();
  try {
    await navigator.clipboard.writeText(code);
    showToast("Copied to clipboard!");
    addLog("info", "Source code copied.");
  } catch (_) {
    showToast("Copy failed.");
  }
}

function initMenuBar() {
  const nav = document.getElementById("menubar-nav");
  if (!nav) {
    return;
  }

  const fontMenuItems = Object.keys(EDITOR_FONT_OPTIONS).map((fontKey) => {
    return {
      label: `Font: ${getFontDisplayName(fontKey)}`,
      kbd: "",
      action: () => setEditorFontKey(fontKey),
    };
  });

  const MENUS = {
    file: [
      { label: "New File", kbd: "Ctrl+N", action: createNewFileTab },
      { sep: true },
      { label: "Open File", kbd: "Ctrl+O", action: openSolFile },
      { label: "Open Folder", kbd: "Ctrl+Shift+O", action: openFolderInExplorer },
      { sep: true },
      { label: "Save", kbd: "Ctrl+S", action: saveSolFile },
      { label: "Save As", kbd: "Ctrl+Shift+S", action: saveSolFileAs },
    ],
    edit: [
      { label: "Copy Source", kbd: "Ctrl+Shift+C", action: copySourceToClipboard },
    ],
    view: [
      { label: "Toggle Sidebar", kbd: "Ctrl+B", action: toggleSidebar },
      { label: "Toggle Terminal", kbd: "Ctrl+`", action: toggleTerminalVisibility },
      { sep: true },
      { label: "Theme: Dark", kbd: "", action: () => setTheme("dark") },
      { label: "Theme: Light", kbd: "", action: () => setTheme("light") },
      { sep: true },
      ...fontMenuItems,
    ],
    compile: [
      { label: "Compile Source", kbd: "Ctrl+Enter", action: compileSource },
    ],
    deploy: [
      { label: "Deploy Contract", kbd: "Ctrl+D", action: deploySource },
      { label: "Reset Session", kbd: "Ctrl+R", action: resetSession },
    ],
    help: [
      { label: "Send Feedback", kbd: "", action: () => window.open(FEEDBACK_URL, "_blank", "noopener") },
    ],
  };

  let openMenuState = null;

  const closeMenus = () => {
    if (!openMenuState) {
      return;
    }
    openMenuState.dropdown.classList.remove("open");
    openMenuState.button.classList.remove("mn-active");
    openMenuState = null;
  };

  const openMenu = (button, dropdown) => {
    closeMenus();
    dropdown.classList.add("open");
    button.classList.add("mn-active");
    openMenuState = { button, dropdown };
  };

  Object.entries(MENUS).forEach(([name, items]) => {
    const button = nav.querySelector(`.mn-item[data-menu="${name}"]`);
    if (!button) {
      return;
    }

    const dropdown = document.createElement("div");
    dropdown.className = "mn-dropdown";

    items.forEach((item) => {
      if (item.sep) {
        const sep = document.createElement("div");
        sep.className = "mn-dd-sep";
        dropdown.appendChild(sep);
        return;
      }

      const row = document.createElement("div");
      row.className = "mn-dd-item";
      row.innerHTML = `<span>${item.label}</span><span class="mn-dd-kbd">${item.kbd || ""}</span>`;
      row.addEventListener("click", async (event) => {
        event.stopPropagation();
        closeMenus();
        await item.action();
      });
      dropdown.appendChild(row);
    });

    button.appendChild(dropdown);

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (openMenuState && openMenuState.button === button) {
        closeMenus();
      } else {
        openMenu(button, dropdown);
      }
    });

    button.addEventListener("mouseenter", () => {
      if (openMenuState && openMenuState.button !== button) {
        openMenu(button, dropdown);
      }
    });
  });

  document.addEventListener("click", closeMenus);
  window.addEventListener("blur", closeMenus);
}

function updateCurrentFileLabel() {
  const el = document.getElementById("current-file");
  const activeTab = getActiveTab();
  const activePath = activeTab?.filePath || "";

  state.currentFilePath = activePath;

  if (el) {
    if (activePath) {
      el.textContent = `File: ${activePath}`;
      el.title = activePath;
    } else {
      el.textContent = "File: Unsaved document";
      el.title = "Unsaved document";
    }
  }

  updateTabLabel();
  updateBreadcrumb();
}

function getEditorValue() {
  if (state.editor) return state.editor.getValue();
  if (state.plainEditor) return state.plainEditor.value;
  return state.code || "";
}

function setEditorValue(nextValue) {
  state.code = nextValue;
  const activeTab = getActiveTab();
  if (activeTab) {
    activeTab.content = nextValue;
  }

  if (state.editor) {
    state.editor.setValue(nextValue);
    return;
  }
  if (state.plainEditor) {
    state.plainEditor.value = nextValue;
  }
}

function ensurePlainEditor(note) {
  if (state.plainEditor) {
    state.plainEditor.classList.remove("hidden");
    state.plainEditor.style.fontSize = `${state.ui.editorFontSize}px`;
    state.plainEditor.style.fontFamily = getEditorFontFamily();
    const cursor = getTextareaCursorPosition(state.plainEditor);
    updateCursorStatus(cursor.line, cursor.column);
    return;
  }

  const mount = document.getElementById("editor-mount");
  const textarea = document.createElement("textarea");
  textarea.className = "plain-editor";
  textarea.spellcheck = false;
  textarea.style.fontSize = `${state.ui.editorFontSize}px`;
  textarea.style.fontFamily = getEditorFontFamily();
  textarea.value = state.code || "";
  textarea.addEventListener("input", () => {
    state.code = textarea.value;
    const activeTab = getActiveTab();
    if (activeTab) {
      activeTab.content = textarea.value;
    }
    const cursor = getTextareaCursorPosition(textarea);
    updateCursorStatus(cursor.line, cursor.column);
  });
  textarea.addEventListener("keyup", () => {
    const cursor = getTextareaCursorPosition(textarea);
    updateCursorStatus(cursor.line, cursor.column);
  });
  textarea.addEventListener("click", () => {
    const cursor = getTextareaCursorPosition(textarea);
    updateCursorStatus(cursor.line, cursor.column);
  });
  mount.appendChild(textarea);

  state.plainEditor = textarea;
  updateCursorStatus(1, 1);
  if (note) addLog("warning", note);
}

// ─── Terminal ─────────────────────────────────────────────────────────────────
const terminal = document.getElementById("terminal-output");
const LEVEL_PREFIX = { info: "[INFO]", success: "[OK]", warning: "[WARN]", error: "[ERR]", result: "[RES]", event: "[EVT]" };

function addLog(level, message, details = null) {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-prefix ${level}">${LEVEL_PREFIX[level] || "[LOG]"}</span><span class="log-msg ${level}">${escapeHtml(message)}</span>`;
  terminal.appendChild(line);

  if (details !== null) {
    const d = document.createElement("div");
    d.className = "log-details";
    const text = typeof details === "string" ? details : JSON.stringify(details, null, 2);
    d.textContent = text;
    terminal.appendChild(d);
  }

  // Keep max 200 lines
  while (terminal.children.length > 400) terminal.removeChild(terminal.firstChild);
  terminal.scrollTop = terminal.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const toastEl = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2500);
}

// ─── Offline engine status ────────────────────────────────────────────────────
async function checkOfflineEngine() {
  if (!window.electronAPI || !window.electronAPI.playground) {
    return false;
  }

  try {
    const health = await window.electronAPI.playground.health();
    return Boolean(health && health.status === "ok");
  } catch (_) {
    return false;
  }
}

async function waitForOfflineEngine() {
  for (let i = 0; i < 8; i++) {
    const ok = await checkOfflineEngine();
    if (ok) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  addLog("error", "Offline engine failed to initialize.");
}

// ─── API calls ────────────────────────────────────────────────────────────────
const IPC_ROUTE_MAP = {
  "/compile": "compile",
  "/deploy": "deploy",
  "/call": "call",
  "/reset": "reset",
};

async function api(path, body) {
  if (!window.electronAPI || !window.electronAPI.playground) {
    throw new Error("Electron offline bridge is unavailable.");
  }

  const method = IPC_ROUTE_MAP[path];
  if (!method || typeof window.electronAPI.playground[method] !== "function") {
    throw new Error(`Unsupported API route: ${path}`);
  }

  return window.electronAPI.playground[method](body || {});
}

// ─── UI: busy state ───────────────────────────────────────────────────────────
function setBusy(key, val) {
  state.busy[key] = val;
  const btns = {
    compile: document.getElementById("btn-compile"),
    deploy: document.getElementById("btn-deploy"),
    call: document.getElementById("btn-run"),
    reset: document.getElementById("btn-reset"),
  };
  const labels = {
    compile: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Compile`,
    deploy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Deploy`,
    call: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run`,
    reset: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.62"/></svg> Reset`,
  };
  if (btns[key]) {
    btns[key].disabled = val;
    btns[key].innerHTML = val ? `<span class="spinner"></span> …` : labels[key];
  }
}

// ─── Constructor args UI ──────────────────────────────────────────────────────
function renderConstructorArgs(abi) {
  const wrap = document.getElementById("constructor-args-wrap");
  const ctorAbi = (abi || []).find((e) => e.type === "constructor");
  const inputs = ctorAbi?.inputs || [];
  if (!inputs.length) { wrap.innerHTML = ""; return; }

  wrap.innerHTML = `<div class="section-title" style="margin-bottom:6px;font-size:10px;">Constructor Args</div>` +
    inputs.map((inp, i) => `
      <div class="field-wrap">
        <label class="field-label">${inp.name || "arg" + i} (${inp.type})</label>
        <input class="inp ctor-arg" data-index="${i}" type="text"
          value="${escapeHtml(state.constructorArgValues[i] ?? defaultValueForType(inp.type))}"
          placeholder="${inp.type.includes("[") || inp.type === "tuple" ? "JSON value" : "Value"}" />
      </div>`).join("");

  wrap.querySelectorAll(".ctor-arg").forEach((el) => {
    el.addEventListener("input", (e) => {
      state.constructorArgValues[parseInt(e.target.dataset.index)] = e.target.value;
    });
  });
}

// ─── Function args UI ─────────────────────────────────────────────────────────
function renderFunctionArgs(fnAbi) {
  const wrap = document.getElementById("fn-args-wrap");
  const pwrap = document.getElementById("fn-payable-wrap");
  const inputs = fnAbi?.inputs || [];

  if (!inputs.length) { wrap.innerHTML = ""; }
  else {
    wrap.innerHTML = inputs.map((inp, i) => `
      <div class="field-wrap">
        <label class="field-label">${inp.name || "arg" + i} (${inp.type})</label>
        <input class="inp fn-arg" data-index="${i}" type="text"
          value="${escapeHtml(state.fnArgValues[i] ?? defaultValueForType(inp.type))}"
          placeholder="${inp.type.includes("[") || inp.type === "tuple" ? "JSON value" : "Value"}" />
      </div>`).join("");

    wrap.querySelectorAll(".fn-arg").forEach((el) => {
      el.addEventListener("input", (e) => {
        state.fnArgValues[parseInt(e.target.dataset.index)] = e.target.value;
      });
    });
  }

  pwrap.style.display = fnAbi?.stateMutability === "payable" ? "block" : "none";
}

// ─── Contract select UI ───────────────────────────────────────────────────────
function renderContractSelect(contracts) {
  const wrap = document.getElementById("contract-select-wrap");
  const sel = document.getElementById("contract-select");
  if (!contracts || contracts.length <= 1) { wrap.style.display = "none"; return; }
  wrap.style.display = "block";
  sel.innerHTML = `<option value="">Auto-select deployable</option>` +
    contracts.map((c) => `<option value="${c.contractName}"${c.contractName === state.selectedContract ? " selected" : ""}>${c.contractName}${c.deployable ? "" : " (non-deployable)"}</option>`).join("");
}

// ─── Function select UI ───────────────────────────────────────────────────────
function renderFunctionSelect() {
  const fns = state.abi.filter((e) => e.type === "function");
  const sel = document.getElementById("fn-select");
  sel.innerHTML = `<option value="">Select a function…</option>` +
    fns.map((fn) => {
      const sig = toFunctionSignature(fn);
      const badge = isReadOnly(fn) ? " [read]" : fn.stateMutability === "payable" ? " [payable]" : "";
      return `<option value="${sig}">${sig}${badge}</option>`;
    }).join("");
  sel.value = state.selectedFnSig;
  const fnAbi = fns.find((f) => toFunctionSignature(f) === state.selectedFnSig) || null;
  renderFunctionArgs(fnAbi);
}

// ─── Deployment UI ────────────────────────────────────────────────────────────
function showDeployment(deployment) {
  state.deployment = deployment;
  state.accounts = deployment.accounts || [];
  state.selectedSender = deployment.deployer;

  document.getElementById("deployment-section").style.display = "block";
  document.getElementById("deploy-addr").textContent = deployment.contractAddress;
  document.getElementById("deploy-name").textContent = deployment.contractName;

  const list = document.getElementById("accounts-list");
  list.innerHTML = state.accounts.map((addr) =>
    `<li class="acct-item${addr === state.selectedSender ? " selected" : ""}" data-addr="${addr}" title="${addr}">${shortAddr(addr)}</li>`
  ).join("");
  list.querySelectorAll(".acct-item").forEach((li) => {
    li.addEventListener("click", () => {
      state.selectedSender = li.dataset.addr;
      list.querySelectorAll(".acct-item").forEach((x) => x.classList.remove("selected"));
      li.classList.add("selected");
    });
  });

  document.getElementById("fn-no-deploy").style.display = "none";
  document.getElementById("fn-controls").style.display = "block";
  renderFunctionSelect();
  applySidebarLayout();
  updateStatusBar();
}

function clearDeployment() {
  state.deployment = null;
  state.accounts = [];
  state.selectedSender = "";
  state.selectedFnSig = "";
  state.fnArgValues = {};
  state.callValueWei = "0";
  document.getElementById("deployment-section").style.display = "none";
  document.getElementById("fn-no-deploy").style.display = "block";
  document.getElementById("fn-controls").style.display = "none";
  document.getElementById("fn-select").innerHTML = `<option value="">Select a function…</option>`;
  document.getElementById("fn-args-wrap").innerHTML = "";
  document.getElementById("fn-payable-wrap").style.display = "none";

  const fnValue = document.getElementById("fn-value");
  if (fnValue) fnValue.value = "0";

  applySidebarLayout();
  updateStatusBar();
}

function showCompilerMeta(meta) {
  state.compilerMeta = meta;
  const metaEl = document.getElementById("compiler-meta");
  metaEl.style.display = "block";
  document.getElementById("ci-name").textContent = meta.contractName;
  const warnEl = document.getElementById("ci-warn");
  warnEl.textContent = (meta.warnings || []).length > 0
    ? `⚠ ${meta.warnings.length} warning(s)` : "";
  updateStatusBar();
  updateBreadcrumb();
}

async function clearForFreshCompile() {
  const previousAddress = state.deployment?.contractAddress;

  if (previousAddress) {
    try {
      await api("/reset", { contractAddress: previousAddress });
    } catch (_) {
      // Keep compile flow resilient even if previous in-memory session reset fails.
    }
  }

  state.abi = [];
  state.compiledContracts = [];
  state.selectedContract = "";
  state.compilerMeta = null;
  state.constructorArgValues = {};
  state.fnArgValues = {};
  state.selectedFnSig = "";
  state.callValueWei = "0";

  document.getElementById("terminal-output").innerHTML = "";
  document.getElementById("compiler-meta").style.display = "none";
  document.getElementById("contract-select-wrap").style.display = "none";
  document.getElementById("constructor-args-wrap").innerHTML = "";

  clearDeployment();
  updateStatusBar();
  updateBreadcrumb();
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function compileSource() {
  const code = getEditorValue();
  if (!code.trim()) { addLog("error", "No code to compile."); return; }
  setBusy("compile", true);

  try {
    await clearForFreshCompile();
    addLog("info", "Compiling Solidity source…");

    const payload = { code };
    if (state.selectedContract) payload.contractName = state.selectedContract;
    const data = await api("/compile", payload);

    if (!data.success) {
      addLog("error", "Compilation failed.", (data.errors || []).join("\n") || data.error);
      setBusy("compile", false);
      return;
    }

    state.abi = data.abi || [];
    state.compiledContracts = data.contracts || [];
    state.selectedContract = data.contractName || "";
    renderConstructorArgs(state.abi);
    renderContractSelect(state.compiledContracts);
    showCompilerMeta({ contractName: data.contractName, warnings: data.warnings });

    addLog("success", `Compiled: ${data.contractName}`, {
      functions: state.abi.filter((e) => e.type === "function").map((f) => toFunctionSignature(f)),
    });
    if ((data.warnings || []).length > 0) addLog("warning", `${data.warnings.length} warning(s).`, data.warnings.join("\n"));

  } catch (err) {
    addLog("error", `Compile error: ${err.message}`);
  } finally {
    setBusy("compile", false);
  }
}

async function deploySource() {
  const code = getEditorValue();
  if (!code.trim()) { addLog("error", "No code to deploy."); return; }
  setBusy("deploy", true);
  addLog("info", "Deploying to in-memory EVM…");

  try {
    const ctorAbi = state.abi.find((e) => e.type === "constructor");
    const ctorInputs = ctorAbi?.inputs || [];
    const constructorArgs = ctorInputs.map((_, i) =>
      state.constructorArgValues[i] ?? defaultValueForType(ctorInputs[i].type)
    );

    const payload = { code, constructorArgs };
    if (state.selectedContract) payload.contractName = state.selectedContract;

    const data = await api("/deploy", payload);

    if (!data.success) {
      addLog("error", "Deployment failed.", (data.errors || []).join("\n") || data.error);
      setBusy("deploy", false);
      return;
    }

    state.abi = data.abi || state.abi;
    showDeployment(data);

    addLog("success", `Deployed: ${data.contractName}`, {
      address: data.contractAddress,
      deployer: data.deployer,
      balance: data.balance,
    });

  } catch (err) {
    addLog("error", `Deploy error: ${err.message}`);
  } finally {
    setBusy("deploy", false);
  }
}

async function runFunction() {
  if (!state.deployment) { addLog("error", "No deployment. Deploy first."); return; }
  const fns = state.abi.filter((e) => e.type === "function");
  const fnAbi = fns.find((f) => toFunctionSignature(f) === state.selectedFnSig);
  if (!fnAbi) { addLog("error", "Select a function first."); return; }

  setBusy("call", true);
  const sig = toFunctionSignature(fnAbi);
  addLog("info", `Calling ${sig}…`);

  try {
    const inputs = fnAbi.inputs || [];
    // Read current input values from DOM
    const argEls = document.querySelectorAll(".fn-arg");
    const args = inputs.map((_, i) => {
      const el = argEls[i];
      return el ? el.value : (state.fnArgValues[i] ?? defaultValueForType(inputs[i].type));
    });

    const valueWei = document.getElementById("fn-value")?.value || "0";

    const data = await api("/call", {
      contractAddress: state.deployment.contractAddress,
      functionName: state.selectedFnSig,
      args,
      sender: state.selectedSender,
      value: valueWei,
    });

    if (!data.success) {
      addLog("error", `Call failed: ${data.error}`);
      setBusy("call", false);
      return;
    }

    if (data.type === "call") {
      addLog("result", `${sig} → ${JSON.stringify(data.result)}`, data.result !== null ? { returnValue: data.result } : null);
    } else {
      addLog("success", `TX sent: ${sig}`, {
        txHash: data.txHash,
        gasUsed: data.gasUsed,
      });
      if (data.events && data.events.length > 0) {
        data.events.forEach((ev) => {
          addLog("event", `Event: ${ev.event}`, ev.returnValues);
        });
      }
    }

  } catch (err) {
    addLog("error", `Run error: ${err.message}`);
  } finally {
    setBusy("call", false);
  }
}

async function resetSession() {
  if (!state.deployment) { addLog("info", "Nothing to reset."); return; }
  setBusy("reset", true);
  addLog("info", "Resetting session…");

  try {
    await api("/reset", { contractAddress: state.deployment.contractAddress });
    clearDeployment();
    addLog("success", "Session cleared.");
  } catch (err) {
    addLog("error", `Reset error: ${err.message}`);
  } finally {
    setBusy("reset", false);
  }
}

async function openSolFile() {
  if (!window.electronAPI?.playground?.openFile) {
    addLog("error", "Open file is unavailable in this build.");
    return;
  }

  try {
    const activeTab = getActiveTab();
    const data = await window.electronAPI.playground.openFile({
      defaultPath: activeTab?.filePath || state.currentFilePath || undefined,
    });

    if (!data || data.success === false) {
      addLog("error", data?.error || "Failed to open file.");
      return;
    }

    if (data.canceled) {
      return;
    }

    const filePath = data.filePath || "";
    const content = typeof data.content === "string" ? data.content : "";
    openDocumentInTab(filePath, content);
    await syncExplorerRootFromFilePath(filePath);

    const name = getFileLabel(filePath);
    showToast(`Opened ${name}`);
    addLog("success", `Opened ${name}`);
  } catch (err) {
    addLog("error", `Open file failed: ${err.message}`);
  }
}

async function saveSolFileAs() {
  if (!window.electronAPI?.playground?.saveFileAs) {
    addLog("error", "Save As is unavailable in this build.");
    return false;
  }

  try {
    syncActiveTabContentFromEditor();
    const activeTab = getActiveTab();
    const code = getEditorValue();
    const data = await window.electronAPI.playground.saveFileAs({
      content: code,
      filePath: activeTab?.filePath || state.currentFilePath || "contract.sol",
    });

    if (!data || data.success === false) {
      addLog("error", data?.error || "Failed to save file.");
      return false;
    }

    if (data.canceled) {
      return false;
    }

    const targetPath = data.filePath || activeTab?.filePath || state.currentFilePath;
    if (activeTab) {
      activeTab.filePath = targetPath || "";
      activeTab.title = getFileLabel(targetPath);
      activeTab.content = code;
    }

    state.currentFilePath = targetPath || "";
    updateCurrentFileLabel();
    await syncExplorerRootFromFilePath(state.currentFilePath);

    const name = getFileLabel(state.currentFilePath);
    showToast(`Saved ${name}`);
    addLog("success", `Saved ${name}`);
    return true;
  } catch (err) {
    addLog("error", `Save As failed: ${err.message}`);
    return false;
  }
}

async function saveSolFile() {
  if (!window.electronAPI?.playground?.saveFile) {
    addLog("error", "Save is unavailable in this build.");
    return;
  }

  syncActiveTabContentFromEditor();
  const activeTab = getActiveTab();

  if (!activeTab?.filePath) {
    await saveSolFileAs();
    return;
  }

  try {
    const code = getEditorValue();
    const data = await window.electronAPI.playground.saveFile({
      filePath: activeTab.filePath,
      content: code,
    });

    if (!data || data.success === false) {
      addLog("error", data?.error || "Failed to save file.");
      return;
    }

    const targetPath = data.filePath || activeTab.filePath;
    activeTab.filePath = targetPath;
    activeTab.title = getFileLabel(targetPath);
    activeTab.content = code;
    state.currentFilePath = targetPath;
    updateCurrentFileLabel();
    await syncExplorerRootFromFilePath(state.currentFilePath);

    const name = getFileLabel(state.currentFilePath);
    showToast(`Saved ${name}`);
    addLog("success", `Saved ${name}`);
  } catch (err) {
    addLog("error", `Save failed: ${err.message}`);
  }
}

// ─── Monaco Editor ────────────────────────────────────────────────────────────
function initMonaco() {
  if (typeof window.require !== "function") {
    ensurePlainEditor("Monaco loader missing. Fallback editor active.");
    return;
  }

  const loaderScript = Array.from(document.getElementsByTagName("script")).find(
    (script) => script.src && script.src.includes("monaco-editor/min/vs/loader.js")
  );

  const vsBaseUrl = (
    loaderScript?.src
      ? loaderScript.src.replace(/\/loader\.js(?:\?.*)?$/, "")
      : new URL("../../node_modules/monaco-editor/min/vs", window.location.href).toString()
  ).replace(/\/$/, "");

  const workerBootstrap =
    "self.MonacoEnvironment={baseUrl:'" + vsBaseUrl + "'};" +
    "importScripts('" + vsBaseUrl + "/base/worker/workerMain.js');";

  window.MonacoEnvironment = {
    getWorkerUrl: function () {
      return URL.createObjectURL(
        new Blob([workerBootstrap], { type: "text/javascript" })
      );
    },
  };

  try {
    require.config({ paths: { vs: vsBaseUrl } });
  } catch (err) {
    ensurePlainEditor("Monaco setup failed. Fallback editor active.");
    addLog("error", "Monaco config failed.", err.message);
    return;
  }

  require(
    ["vs/editor/editor.main"],
    function (monaco) {
      state.monaco = monaco;

      // Register Solidity language
      if (!monaco.languages.getLanguages().some((l) => l.id === "solidity")) {
        monaco.languages.register({ id: "solidity" });
      }

      monaco.languages.setMonarchTokensProvider("solidity", {
        keywords: ["pragma","solidity","contract","library","interface","abstract","function","constructor","modifier","event","struct","enum","mapping","memory","storage","calldata","public","private","internal","external","view","pure","payable","returns","return","if","else","for","while","do","break","continue","import","as","using","new","delete","emit","revert","require","assert","try","catch","is","override","virtual"],
        typeKeywords: ["address","bool","string","bytes","byte","uint","uint8","uint16","uint32","uint64","uint128","uint256","int","int8","int16","int32","int64","int128","int256"],
        operators: ["=",">","<","!","~","?",":","==","<=",">=","!=","&&","||","++","--","+","-","*","/","&","|","^","%","<<",">>"],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"'0-9xXuU])/,
        tokenizer: {
          root: [
            [/[a-zA-Z_$][\w$]*/, { cases: { "@keywords": "keyword", "@typeKeywords": "type", "@default": "identifier" } }],
            [/\d+/, "number"],
            [/[{}()[\]]/, "delimiter.bracket"],
            [/@symbols/, { cases: { "@operators": "operator", "@default": "delimiter" } }],
            [/;|,|\./, "delimiter"],
            [/"/, "string", "@string_double"],
            [/'/, "string", "@string_single"],
            [/\/\*/, "comment", "@comment"],
            [/\/\/.*$/, "comment"],
            [/\s+/, "white"],
          ],
          comment: [[/[^/*]+/, "comment"], [/\*\//, "comment", "@pop"], [/[/*]/, "comment"]],
          string_double: [[/[^\\"]+/, "string"], [/"/, "string", "@pop"]],
          string_single: [[/[^\\']+/, "string"], [/'/, "string", "@pop"]],
        },
      });

      monaco.languages.setLanguageConfiguration("solidity", {
        comments: { lineComment: "//", blockComment: ["/*", "*/"] },
        brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
        autoClosingPairs: [{ open: "{", close: "}" }, { open: "[", close: "]" }, { open: "(", close: ")" }, { open: '"', close: '"' }, { open: "'", close: "'" }],
      });

      monaco.editor.defineTheme("sol-vscode-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6A9955" },
          { token: "keyword", foreground: "C586C0" },
          { token: "type", foreground: "4EC9B0" },
          { token: "number", foreground: "B5CEA8" },
          { token: "string", foreground: "CE9178" },
          { token: "operator", foreground: "D4D4D4" },
          { token: "identifier", foreground: "D4D4D4" },
        ],
        colors: {
          "editor.background": "#1E1E1E",
          "editor.foreground": "#D4D4D4",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#C6C6C6",
          "editorCursor.foreground": "#AEAFAD",
          "editor.selectionBackground": "#264F78",
          "editorLineHighlightBackground": "#2A2D2E",
          "editorIndentGuide.background": "#404040",
        },
      });

      monaco.editor.defineTheme("sol-tokyonight-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "888B94" },
          { token: "keyword", foreground: "65359D" },
          { token: "type", foreground: "006C86" },
          { token: "number", foreground: "965027" },
          { token: "string", foreground: "385F0D" },
          { token: "operator", foreground: "006C86" },
          { token: "identifier", foreground: "343B58" },
        ],
        colors: {
          "editor.background": "#E6E7ED",
          "editor.foreground": "#343B59",
          "editorLineNumber.foreground": "#9DA0AB",
          "editorLineNumber.activeForeground": "#363C4D",
          "editorCursor.foreground": "#363C4D",
          "editor.selectionBackground": "#ACB0BF40",
          "editorLineHighlightBackground": "#DCDEE3",
          "editorIndentGuide.background": "#D0D4E3",
          "editorIndentGuide.activeBackground": "#BDC1CF",
        },
      });

      if (state.plainEditor) {
        state.code = state.plainEditor.value;
        state.plainEditor.classList.add("hidden");
      }

      state.editor = monaco.editor.create(document.getElementById("editor-mount"), {
        value: state.code,
        language: "solidity",
        theme: getMonacoThemeName(state.ui.theme),
        fontSize: state.ui.editorFontSize,
        fontFamily: getEditorFontFamily(),
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: "on",
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorBlinking: "blink",
      });

      applyUiPreferences({ persist: false });

      state.editor.onDidChangeModelContent(() => {
        const value = state.editor.getValue();
        state.code = value;
        const activeTab = getActiveTab();
        if (activeTab) {
          activeTab.content = value;
        }
      });

      state.editor.onDidChangeCursorPosition((event) => {
        updateCursorStatus(event.position.lineNumber, event.position.column);
      });

      updateCursorStatus(1, 1);

      // Add wheel event listener to Monaco editor DOM node
      const editorDomNode = state.editor.getDomNode();
      if (editorDomNode) {
        editorDomNode.addEventListener(
          "wheel",
          (event) => {
            if (!(event.ctrlKey || event.metaKey)) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            const delta = event.deltaY < 0 ? 1 : -1;
            changeEditorFontSizeBy(delta);
          },
          { passive: false, capture: true }
        );
      }

      // Ctrl+Enter -> compile
      state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, compileSource);
      addLog("info", "Editor ready. Ctrl+S save, Ctrl+Shift+S save as, Ctrl+Enter compile.");
    },
    function (err) {
      const message = err && err.message ? err.message : "Unknown Monaco loading error.";
      ensurePlainEditor("Monaco failed to load. Fallback editor active.");
      addLog("error", "Monaco load failed.", message);
    }
  );
}

// ─── Events ───────────────────────────────────────────────────────────────────
document.getElementById("btn-compile").addEventListener("click", compileSource);
document.getElementById("btn-deploy").addEventListener("click", deploySource);
document.getElementById("btn-run").addEventListener("click", runFunction);
document.getElementById("btn-reset").addEventListener("click", resetSession);
document.getElementById("btn-open").addEventListener("click", openSolFile);
document.getElementById("btn-open-folder").addEventListener("click", openFolderInExplorer);
document.getElementById("btn-save").addEventListener("click", saveSolFile);
document.getElementById("btn-save-as").addEventListener("click", saveSolFileAs);

const copyBtn = document.getElementById("btn-copy");
if (copyBtn) {
  copyBtn.addEventListener("click", copySourceToClipboard);
}

const refreshFilesBtn = document.getElementById("btn-refresh-files");
if (refreshFilesBtn) {
  refreshFilesBtn.addEventListener("click", () => {
    refreshExplorerTree();
  });
}

const fileTree = document.getElementById("file-tree");
if (fileTree) {
  fileTree.addEventListener("click", (event) => {
    const directoryRow = event.target.closest(".file-tree-item.directory");
    if (directoryRow && directoryRow.dataset.dirPath) {
      openDirectoryInExplorer(directoryRow.dataset.dirPath);
      return;
    }

    const row = event.target.closest(".file-tree-item.file");
    if (!row || !row.dataset.filePath) {
      return;
    }

    if (row.dataset.openable !== "true") {
      showToast("This file type cannot be opened in the editor.");
      return;
    }

    openFileFromPath(row.dataset.filePath, { syncExplorerRoot: false });
  });
}

document.getElementById("btn-clear-terminal").addEventListener("click", () => {
  document.getElementById("terminal-output").innerHTML = "";
  addLog("info", "Terminal cleared.");
});

document.getElementById("contract-select").addEventListener("change", (e) => {
  state.selectedContract = e.target.value;
  updateBreadcrumb();
});

document.getElementById("fn-select").addEventListener("change", (e) => {
  state.selectedFnSig = e.target.value;
  state.fnArgValues = {};
  const fns = state.abi.filter((x) => x.type === "function");
  const fnAbi = fns.find((f) => toFunctionSignature(f) === e.target.value) || null;
  renderFunctionArgs(fnAbi);
});

const editorMount = document.getElementById("editor-mount");
if (editorMount) {
  editorMount.addEventListener(
    "wheel",
    (event) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      const delta = event.deltaY < 0 ? 1 : -1;
      changeEditorFontSizeBy(delta);
    },
    { passive: false }
  );
}

const terminalPanel = document.querySelector(".terminal-panel");
if (terminalPanel) {
  terminalPanel.addEventListener(
    "wheel",
    (event) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      const delta = event.deltaY < 0 ? 1 : -1;
      changeTerminalFontSizeBy(delta);
    },
    { passive: false }
  );
}

const sidebar = document.getElementById("sidebar") || document.querySelector(".sidebar");
if (sidebar) {
  sidebar.addEventListener(
    "wheel",
    (event) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      const delta = event.deltaY < 0 ? 1 : -1;
      changeSidebarFontSizeBy(delta);
    },
    { passive: false }
  );
}

const terminalResizer = document.getElementById("terminal-resizer");
if (terminalResizer) {
  let dragging = false;
  let startY = 0;
  let startHeight = DEFAULT_TERMINAL_HEIGHT;

  terminalResizer.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (state.ui.terminalHidden) {
      state.ui.terminalHidden = false;
      state.ui.terminalHeight = Math.max(
        MIN_TERMINAL_HEIGHT,
        clampTerminalHeight(state.ui.terminalLastOpenHeight, DEFAULT_TERMINAL_HEIGHT)
      );
      applyUiPreferences({ persist: false });
    }

    dragging = true;
    startY = event.clientY;
    startHeight = clampTerminalHeight(state.ui.terminalHeight, DEFAULT_TERMINAL_HEIGHT);

    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) {
      return;
    }

    const delta = startY - event.clientY;
    const nextHeight = clampTerminalHeight(startHeight + delta, DEFAULT_TERMINAL_HEIGHT);

    if (nextHeight < MIN_TERMINAL_HEIGHT) {
      state.ui.terminalHidden = true;
    } else {
      state.ui.terminalHidden = false;
      state.ui.terminalHeight = Math.min(MAX_TERMINAL_HEIGHT, Math.max(MIN_TERMINAL_HEIGHT, nextHeight));
      state.ui.terminalLastOpenHeight = state.ui.terminalHeight;
    }

    applyUiPreferences({ persist: false });
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    saveUiPreferences();
  });
}

window.addEventListener("keydown", (e) => {
  const hasModifier = e.ctrlKey || e.metaKey;
  if (!hasModifier) return;

  if (e.code === "Backquote") {
    e.preventDefault();
    toggleTerminalVisibility();
    return;
  }

  const key = e.key.toLowerCase();
  const isZoomInShortcut = key === "+" || key === "=" || e.code === "NumpadAdd";
  const isZoomOutShortcut =
    key === "-" ||
    key === "_" ||
    key === "subtract" ||
    e.code === "Minus" ||
    e.code === "NumpadSubtract";

  if (isZoomInShortcut) {
    e.preventDefault();
    changeAllFontSizesBy(1);
    return;
  }

  if (isZoomOutShortcut) {
    e.preventDefault();
    changeAllFontSizesBy(-1);
    return;
  }

  if (key === "b") {
    e.preventDefault();
    toggleSidebar();
    return;
  }

  if (key === "n") {
    e.preventDefault();
    createNewFileTab();
    return;
  }

  if (key === "d") {
    e.preventDefault();
    deploySource();
    return;
  }

  if (key === "r") {
    e.preventDefault();
    resetSession();
    return;
  }

  if (key === "c" && e.shiftKey) {
    e.preventDefault();
    copySourceToClipboard();
    return;
  }

  if (key === "o" && e.shiftKey) {
    e.preventDefault();
    openFolderInExplorer();
    return;
  }

  if (key === "o") {
    e.preventDefault();
    openSolFile();
    return;
  }

  if (key === "w") {
    e.preventDefault();
    closeTabById(state.activeTabId);
    return;
  }

  if (key === "s" && e.shiftKey) {
    e.preventDefault();
    saveSolFileAs();
    return;
  }

  if (key === "s") {
    e.preventDefault();
    saveSolFile();
    return;
  }

  if (key === "enter") {
    if (state.editor) {
      return;
    }
    e.preventDefault();
    compileSource();
  }
});

// Template buttons
document.querySelectorAll(".tpl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tpl = btn.dataset.tpl;
    setEditorValue(TEMPLATES[tpl] || "");
    document.querySelectorAll(".tpl-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.abi = [];
    state.compiledContracts = [];
    state.selectedContract = "";
    state.compilerMeta = null;
    state.constructorArgValues = {};
    document.getElementById("compiler-meta").style.display = "none";
    document.getElementById("contract-select-wrap").style.display = "none";
    document.getElementById("constructor-args-wrap").innerHTML = "";
    clearDeployment();
    addLog("info", `Loaded template: ${tpl}`);
  });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
(async function init() {
  // Set version in UI
  const versionBadge = document.getElementById("version-badge");
  const appStatus = document.getElementById("app-status-version");
  if (versionBadge) {
    versionBadge.textContent = `v${VERSION}`;
  }
  if (appStatus) {
    appStatus.title = `Version ${VERSION}`;
  }

  loadUiPreferences();
  state.code = TEMPLATES.counter;
  initializeEditorTabs(state.code);

  applyUiPreferences({ persist: false });
  initMenuBar();
  initActivityBar();
  initAppearanceControls();
  initWindowControls();
  initTabBar();

  renderTabBar();
  renderExplorerTree();

  updateCurrentFileLabel();
  updateStatusBar();
  updateCursorStatus(1, 1);

  addLog("info", "Solidity Playground starting in offline mode…");
  addLog("info", `Version: ${VERSION}`);
  addLog("info", "Please share feedback:", FEEDBACK_URL);
  await waitForOfflineEngine();
  initMonaco();
})();
