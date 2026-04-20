"use strict";

const FEEDBACK_URL = "https://smartcontractsbyamar.vercel.app/feedback";
const UI_PREFS_STORAGE_KEY = "solidityPlaygroundUIPrefsV1";
const DEFAULT_UI_FONT_SIZE = 18;
const DEFAULT_TERMINAL_HEIGHT = 220;
const MIN_TERMINAL_HEIGHT = 90;
const MAX_TERMINAL_HEIGHT = 520;
const TERMINAL_HEIGHT_STEP = 24;

const EDITOR_FONT_OPTIONS = {
  consolas: "Consolas, 'Courier New', monospace",
  cascadia: "'Cascadia Code', Consolas, 'Courier New', monospace",
  jetbrains: "'JetBrains Mono', Consolas, 'Courier New', monospace",
  fira: "'Fira Code', Consolas, 'Courier New', monospace",
  courier: "'Courier New', monospace",
};

const DEFAULT_UI_PREFS = {
  theme: "dark",
  editorFontSize: 13,
  editorFontKey: "consolas",
  terminalHeight: DEFAULT_TERMINAL_HEIGHT,
  terminalHidden: false,
  terminalLastOpenHeight: DEFAULT_TERMINAL_HEIGHT,
};

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  runtimeMode: "offline",
  code: "",
  currentFilePath: "",
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
    terminalHeight: DEFAULT_UI_PREFS.terminalHeight,
    terminalHidden: DEFAULT_UI_PREFS.terminalHidden,
    terminalLastOpenHeight: DEFAULT_UI_PREFS.terminalLastOpenHeight,
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
  state.ui.terminalHeight = clampTerminalHeight(Number(parsed.terminalHeight), DEFAULT_UI_PREFS.terminalHeight);
  state.ui.terminalHidden = Boolean(parsed.terminalHidden);
  state.ui.terminalLastOpenHeight = clampTerminalHeight(
    Number(parsed.terminalLastOpenHeight),
    DEFAULT_UI_PREFS.terminalLastOpenHeight
  );

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

function applyTerminalPanelLayout() {
  const panel = document.querySelector(".terminal-panel");
  if (!panel) {
    return;
  }

  const hidden = Boolean(state.ui.terminalHidden);

  if (hidden) {
    document.documentElement.style.setProperty("--terminal-height", "0px");
    panel.classList.add("is-collapsed");
    return;
  }

  const height = clampTerminalHeight(state.ui.terminalHeight, DEFAULT_TERMINAL_HEIGHT);
  state.ui.terminalHeight = Math.max(MIN_TERMINAL_HEIGHT, height);
  if (state.ui.terminalHeight >= MIN_TERMINAL_HEIGHT) {
    state.ui.terminalLastOpenHeight = state.ui.terminalHeight;
  }

  document.documentElement.style.setProperty("--terminal-height", `${state.ui.terminalHeight}px`);
  panel.classList.remove("is-collapsed");
}

function applyUiPreferences(options = {}) {
  const shouldPersist = options.persist !== false;

  document.body.setAttribute("data-theme", state.ui.theme);
  document.documentElement.style.setProperty("--ui-font-size", `${DEFAULT_UI_FONT_SIZE}px`);
  document.documentElement.style.setProperty("--editor-font-size", `${state.ui.editorFontSize}px`);
  document.documentElement.style.setProperty("--editor-font-family", getEditorFontFamily());

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

function updateCurrentFileLabel() {
  const el = document.getElementById("current-file");
  if (!el) {
    return;
  }

  if (state.currentFilePath) {
    el.textContent = `File: ${state.currentFilePath}`;
    el.title = state.currentFilePath;
    return;
  }

  el.textContent = "File: Unsaved document";
  el.title = "Unsaved document";
}

function getEditorValue() {
  if (state.editor) return state.editor.getValue();
  if (state.plainEditor) return state.plainEditor.value;
  return state.code || "";
}

function setEditorValue(nextValue) {
  state.code = nextValue;
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
  });
  mount.appendChild(textarea);

  state.plainEditor = textarea;
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
}

function showCompilerMeta(meta) {
  state.compilerMeta = meta;
  const metaEl = document.getElementById("compiler-meta");
  metaEl.style.display = "block";
  document.getElementById("ci-name").textContent = meta.contractName;
  const warnEl = document.getElementById("ci-warn");
  warnEl.textContent = (meta.warnings || []).length > 0
    ? `⚠ ${meta.warnings.length} warning(s)` : "";
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
    const data = await window.electronAPI.playground.openFile({
      defaultPath: state.currentFilePath || undefined,
    });

    if (!data || data.success === false) {
      addLog("error", data?.error || "Failed to open file.");
      return;
    }

    if (data.canceled) {
      return;
    }

    await clearForFreshCompile();
    setEditorValue(typeof data.content === "string" ? data.content : "");
    state.currentFilePath = data.filePath || "";
    updateCurrentFileLabel();

    const name = getFileLabel(state.currentFilePath);
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
    const code = getEditorValue();
    const data = await window.electronAPI.playground.saveFileAs({
      content: code,
      filePath: state.currentFilePath || "contract.sol",
    });

    if (!data || data.success === false) {
      addLog("error", data?.error || "Failed to save file.");
      return false;
    }

    if (data.canceled) {
      return false;
    }

    state.currentFilePath = data.filePath || state.currentFilePath;
    updateCurrentFileLabel();

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

  if (!state.currentFilePath) {
    await saveSolFileAs();
    return;
  }

  try {
    const code = getEditorValue();
    const data = await window.electronAPI.playground.saveFile({
      filePath: state.currentFilePath,
      content: code,
    });

    if (!data || data.success === false) {
      addLog("error", data?.error || "Failed to save file.");
      return;
    }

    state.currentFilePath = data.filePath || state.currentFilePath;
    updateCurrentFileLabel();

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
        state.code = state.editor.getValue();
      });

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
document.getElementById("btn-save").addEventListener("click", saveSolFile);
document.getElementById("btn-save-as").addEventListener("click", saveSolFileAs);

const copyBtn = document.getElementById("btn-copy");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const code = getEditorValue();
    try {
      await navigator.clipboard.writeText(code);
      showToast("Copied to clipboard!");
      addLog("info", "Source code copied.");
    } catch (_) {
      showToast("Copy failed.");
    }
  });
}

document.getElementById("btn-clear-terminal").addEventListener("click", () => {
  document.getElementById("terminal-output").innerHTML = "";
  addLog("info", "Terminal cleared.");
});

document.getElementById("contract-select").addEventListener("change", (e) => {
  state.selectedContract = e.target.value;
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
      changeTerminalHeightBy(delta);
    },
    { passive: false }
  );
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
    changeEditorFontSizeBy(1);
    return;
  }

  if (isZoomOutShortcut) {
    e.preventDefault();
    changeEditorFontSizeBy(-1);
    return;
  }

  if (key === "o") {
    e.preventDefault();
    openSolFile();
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
  loadUiPreferences();
  applyUiPreferences({ persist: false });
  initAppearanceControls();
  initWindowControls();

  state.code = TEMPLATES.counter;
  updateCurrentFileLabel();

  addLog("info", "Solidity Playground starting in offline mode…");
  addLog("info", "Version: 1.1");
  addLog("info", "Please share feedback:", FEEDBACK_URL);
  await waitForOfflineEngine();
  initMonaco();
})();
