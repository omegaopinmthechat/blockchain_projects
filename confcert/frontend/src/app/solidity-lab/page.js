"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowLeft,
  Code,
  Copy,
  Hammer,
  ListChecks,
  Loader2,
  PlayCircle,
  Rocket,
  RotateCcw,
  TerminalSquare,
} from "lucide-react";
import StarBackground from "@/components/StarBackground";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_CODE = `// SPDX-License-Identifier: MIT
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
}`;

const TEMPLATE_OPTIONS = [
  {
    id: "counter",
    name: "Counter",
    code: DEFAULT_CODE,
  },
  {
    id: "greeter",
    name: "Greeter",
    code: `// SPDX-License-Identifier: MIT
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
  },
  {
    id: "vault",
    name: "Simple Vault",
    code: `// SPDX-License-Identifier: MIT
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
  },
];

function trimTrailingSlash(value) {
  return (value || "").trim().replace(/\/+$/, "");
}

function toFunctionSignature(fnAbi) {
  return `${fnAbi.name}(${(fnAbi.inputs || [])
    .map((input) => input.type)
    .join(",")})`;
}

function isReadOnly(fnAbi) {
  return fnAbi.stateMutability === "view" || fnAbi.stateMutability === "pure";
}

function toLog(level, message, details = null) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    level,
    message,
    details,
    time: new Date().toLocaleTimeString(),
  };
}

function defaultValueForType(type) {
  const normalized = (type || "").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.includes("[")) {
    return "[]";
  }

  if (normalized === "bool") {
    return "false";
  }

  if (normalized.startsWith("uint") || normalized.startsWith("int")) {
    return "0";
  }

  if (normalized === "address") {
    return "0x0000000000000000000000000000000000000000";
  }

  if (normalized.startsWith("bytes")) {
    return "0x";
  }

  if (normalized.startsWith("tuple")) {
    return "{}";
  }

  return "";
}

const ONE_DARK_PRO_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "ABB2BF", fontStyle: "" },
    { token: "comment.line", foreground: "ABB2BF", fontStyle: "" },
    { token: "comment.block", foreground: "ABB2BF", fontStyle: "" },
    { token: "comment.doc", foreground: "ABB2BF", fontStyle: "" },
    { token: "comment.solidity", foreground: "ABB2BF", fontStyle: "" },
    { token: "keyword", foreground: "C678DD" },
    { token: "type", foreground: "E5C07B" },
    { token: "number", foreground: "D19A66" },
    { token: "string", foreground: "98C379" },
    { token: "delimiter", foreground: "ABB2BF" },
    { token: "operator", foreground: "56B6C2" },
    { token: "identifier", foreground: "E06C75" },
    { token: "tag", foreground: "61AFEF" },
  ],
  colors: {
    "editor.background": "#282C34",
    "editor.foreground": "#ABB2BF",
    "editorLineNumber.foreground": "#4B5263",
    "editorLineNumber.activeForeground": "#8A93A8",
    "editorCursor.foreground": "#61AFEF",
    "editor.selectionBackground": "#3E4451",
    "editor.inactiveSelectionBackground": "#3A3F4B",
    "editor.selectionHighlightBackground": "#2C313C",
    "editorIndentGuide.background1": "#3B4048",
    "editorIndentGuide.activeBackground1": "#5C6370",
    "editorWhitespace.foreground": "#3B4048",
    "editorLineHighlightBackground": "#2C313A",
  },
};

export default function SolidityLabPage() {
  const backendUrl = process.env.NEXT_PUBLIC_COMPILER_BACKEND_URL || "http://localhost:5501";
  const compileShortcutRef = useRef(() => {});
  const lastShortcutRunAtRef = useRef(0);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [compiledContracts, setCompiledContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [compilerMeta, setCompilerMeta] = useState(null);
  const [activeAbi, setActiveAbi] = useState([]);
  const [constructorArgValues, setConstructorArgValues] = useState({});
  const [deployment, setDeployment] = useState(null);
  const [selectedFunctionSignature, setSelectedFunctionSignature] = useState("");
  const [functionArgValues, setFunctionArgValues] = useState({});
  const [callValueWei, setCallValueWei] = useState("0");
  const [lastCallResult, setLastCallResult] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [busy, setBusy] = useState({
    compile: false,
    deploy: false,
    call: false,
    reset: false,
  });

  const functionOptions = useMemo(() => {
    return (activeAbi || []).filter((entry) => entry.type === "function");
  }, [activeAbi]);

  const selectedFunctionAbi = useMemo(() => {
    return (
      functionOptions.find((fn) => toFunctionSignature(fn) === selectedFunctionSignature) ||
      null
    );
  }, [functionOptions, selectedFunctionSignature]);

  const constructorAbi = useMemo(() => {
    return activeAbi.find((entry) => entry.type === "constructor") || null;
  }, [activeAbi]);

  function handleEditorBeforeMount(monaco) {
    if (!monaco.languages.getLanguages().some((language) => language.id === "solidity")) {
      monaco.languages.register({ id: "solidity" });
    }

    monaco.languages.setLanguageConfiguration("solidity", {
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"],
      },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    });

    monaco.languages.setMonarchTokensProvider("solidity", {
      keywords: [
        "pragma",
        "solidity",
        "contract",
        "library",
        "interface",
        "abstract",
        "function",
        "constructor",
        "modifier",
        "event",
        "struct",
        "enum",
        "mapping",
        "memory",
        "storage",
        "calldata",
        "public",
        "private",
        "internal",
        "external",
        "view",
        "pure",
        "payable",
        "returns",
        "return",
        "if",
        "else",
        "for",
        "while",
        "do",
        "break",
        "continue",
        "import",
        "from",
        "as",
        "using",
        "new",
        "delete",
        "emit",
        "revert",
        "require",
        "assert",
        "try",
        "catch",
        "is",
        "override",
        "virtual",
      ],
      typeKeywords: [
        "address",
        "bool",
        "string",
        "bytes",
        "byte",
        "uint",
        "uint8",
        "uint16",
        "uint32",
        "uint64",
        "uint128",
        "uint256",
        "int",
        "int8",
        "int16",
        "int32",
        "int64",
        "int128",
        "int256",
        "fixed",
        "ufixed",
      ],
      operators: [
        "=",
        ">",
        "<",
        "!",
        "~",
        "?",
        ":",
        "==",
        "<=",
        ">=",
        "!=",
        "&&",
        "||",
        "++",
        "--",
        "+",
        "-",
        "*",
        "/",
        "&",
        "|",
        "^",
        "%",
        "<<",
        ">>",
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
      ],
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      escapes: /\\(?:[abfnrtv\\"'0-9xXuU])*/,
      tokenizer: {
        root: [
          [/[a-zA-Z_$][\w$]*/, {
            cases: {
              "@keywords": "keyword",
              "@typeKeywords": "type",
              "@default": "identifier",
            },
          }],
          [/\d+(_\d+)*/, "number"],
          [/\d+\.\d+([eE][\-+]?\d+)?/, "number.float"],
          [/[{}()[\]]/, "delimiter.bracket"],
          [/@symbols/, {
            cases: {
              "@operators": "operator",
              "@default": "delimiter",
            },
          }],
          [/;|,|\./, "delimiter"],
          [/"([^"\\]|\\.)*$/, "string.invalid"],
          [/'([^'\\]|\\.)*$/, "string.invalid"],
          [/"/, "string", "@string_double"],
          [/'/, "string", "@string_single"],
          [/\/\*/, "comment", "@comment"],
          [/\/\/.*$/, "comment"],
          [/\s+/, "white"],
        ],
        comment: [
          [/[^/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[/*]/, "comment"],
        ],
        string_double: [
          [/[^\\"]+/, "string"],
          [/@escapes/, "string.escape"],
          [/\\./, "string.escape.invalid"],
          [/"/, "string", "@pop"],
        ],
        string_single: [
          [/[^\\']+/, "string"],
          [/@escapes/, "string.escape"],
          [/\\./, "string.escape.invalid"],
          [/'/, "string", "@pop"],
        ],
      },
    });

    monaco.editor.defineTheme("one-dark-pro", ONE_DARK_PRO_THEME);
  }

  useEffect(() => {
    setTerminalLogs([toLog("info", "Ready. Compile your contract to start the playground.")]);
  }, []);

  function handleEditorMount(editor, monaco) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      compileShortcutRef.current();
    });
  }

  function setBusyFlag(key, value) {
    setBusy((prev) => ({ ...prev, [key]: value }));
  }

  function addLog(level, message, details = null) {
    setTerminalLogs((prev) => [...prev, toLog(level, message, details)].slice(-120));
  }

  function initializeConstructorArgs(abi, previousValues = {}) {
    const constructorEntry = (abi || []).find((entry) => entry.type === "constructor") || null;
    const inputs = constructorEntry?.inputs || [];

    if (inputs.length === 0) {
      setConstructorArgValues({});
      return;
    }

    const nextValues = {};
    inputs.forEach((input, index) => {
      const existing = previousValues[index];
      nextValues[index] = existing !== undefined ? existing : defaultValueForType(input.type);
    });

    setConstructorArgValues(nextValues);
  }

  async function compileWithAutoSelection(preferredContractName) {
    const payload = { code };
    if (preferredContractName) {
      payload.contractName = preferredContractName;
    }

    const firstAttempt = await requestJson("/compile", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (firstAttempt.success || !preferredContractName) {
      return firstAttempt;
    }

    const errorText = [
      ...(Array.isArray(firstAttempt.errors) ? firstAttempt.errors : []),
      firstAttempt.error || "",
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();

    const shouldRetry =
      errorText.includes("not found") || errorText.includes("not deployable");

    if (!shouldRetry) {
      return firstAttempt;
    }

    addLog(
      "warning",
      `Selected contract ${preferredContractName} is unavailable for current code. Retrying with auto selection.`
    );

    return requestJson("/compile", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async function requestJson(path, options = {}) {
    const base = trimTrailingSlash(backendUrl);

    if (!base) {
      throw new Error("Backend URL is required.");
    }

    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_err) {
      throw new Error("Backend returned a non-JSON response.");
    }

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  function clearExecutionState() {
    setActiveAbi([]);
    setConstructorArgValues({});
    setDeployment(null);
    setSelectedFunctionSignature("");
    setFunctionArgValues({});
    setCallValueWei("0");
    setLastCallResult(null);
  }

  function loadTemplate(template) {
    setCode(template.code);
    setCompiledContracts([]);
    setSelectedContract("");
    setCompilerMeta(null);
    setConstructorArgValues({});
    clearExecutionState();
    addLog("info", `Loaded template: ${template.name}`);
  }

  async function copySourceCode() {
    try {
      await navigator.clipboard.writeText(code);
      addLog("success", "Source code copied to clipboard.");
    } catch (_err) {
      addLog("error", "Failed to copy source code.");
    }
  }

  async function compileSource() {
    if (!code.trim()) {
      addLog("error", "No Solidity code found. Paste contract code first.");
      return;
    }

    setBusyFlag("compile", true);
    setLastCallResult(null);

    try {
      addLog("info", "Compiling Solidity source...");

      const data = await compileWithAutoSelection(selectedContract);

      if (!data.success) {
        addLog("error", "Compilation failed.", data.errors || data.error || null);
        setCompilerMeta(null);
        clearExecutionState();
        return;
      }

      setCompiledContracts(data.contracts || []);
      setSelectedContract(data.contractName || "");
      setCompilerMeta({
        contractName: data.contractName,
        declaredVersion: data.declaredVersion || "unknown",
        warnings: data.warnings || [],
      });
      setActiveAbi(data.abi || []);
      initializeConstructorArgs(data.abi || [], constructorArgValues);
      setDeployment(null);
      setLastCallResult(null);

      const functions = (data.abi || []).filter((entry) => entry.type === "function");
      setSelectedFunctionSignature(functions[0] ? toFunctionSignature(functions[0]) : "");
      setFunctionArgValues({});
      setCallValueWei("0");

      addLog("success", `Compilation complete for contract ${data.contractName}.`, {
        availableContracts: (data.contracts || []).map((item) => item.contractName),
      });

      if ((data.warnings || []).length > 0) {
        addLog("warning", `${data.warnings.length} compiler warning(s).`, data.warnings);
      }
    } catch (err) {
      addLog("error", `Compilation request failed: ${err.message}`);
    } finally {
      setBusyFlag("compile", false);
    }
  }

  async function deploySource() {
    if (!code.trim()) {
      addLog("error", "No Solidity code found. Paste contract code first.");
      return;
    }

    setBusyFlag("deploy", true);
    setLastCallResult(null);

    try {
      addLog("info", "Preparing deployment with latest code...");

      const compileData = await compileWithAutoSelection(selectedContract);

      if (!compileData.success) {
        addLog("error", "Compilation failed. Fix errors before deployment.", compileData.errors || null);
        return;
      }

      const resolvedAbi = compileData.abi || [];
      const resolvedConstructorAbi =
        resolvedAbi.find((entry) => entry.type === "constructor") || null;
      const constructorArgs = (resolvedConstructorAbi?.inputs || []).map((input, index) => {
        const value = constructorArgValues[index];
        if (value === undefined || value === null || `${value}`.trim() === "") {
          return defaultValueForType(input.type);
        }
        return value;
      });

      initializeConstructorArgs(resolvedAbi, constructorArgValues);

      setCompiledContracts(compileData.contracts || []);
      setSelectedContract(compileData.contractName || "");
      setCompilerMeta({
        contractName: compileData.contractName,
        declaredVersion: compileData.declaredVersion || "unknown",
        warnings: compileData.warnings || [],
      });
      setActiveAbi(resolvedAbi);

      if ((compileData.warnings || []).length > 0) {
        addLog("warning", `${compileData.warnings.length} compiler warning(s).`, compileData.warnings);
      }

      addLog("info", "Deploying contract to local in-memory chain...", {
        contractName: compileData.contractName,
        constructorArgsCount: constructorArgs.length,
      });

      const payload = {
        code,
        constructorArgs,
        contractName: compileData.contractName || selectedContract,
      };

      const data = await requestJson("/deploy", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!data.success) {
        addLog("error", "Deployment failed.", data.errors || data.error || null);
        return;
      }

      setCompiledContracts(data.contracts || []);
      setSelectedContract(data.contractName || "");
      setCompilerMeta((prev) => ({
        contractName: data.contractName,
        declaredVersion: prev?.declaredVersion || "unknown",
        warnings: data.warnings || [],
      }));
      setActiveAbi(data.abi || []);
      setDeployment({
        contractAddress: data.contractAddress,
        contractName: data.contractName,
        deployer: data.deployer,
        balance: data.balance,
        accounts: data.accounts || [],
      });

      const functions = (data.abi || []).filter((entry) => entry.type === "function");
      setSelectedFunctionSignature(functions[0] ? toFunctionSignature(functions[0]) : "");
      setFunctionArgValues({});
      setCallValueWei("0");

      addLog("success", `Deployment successful at ${data.contractAddress}.`, {
        contractName: data.contractName,
        deployer: data.deployer,
        constructorArgs,
      });

      if ((data.warnings || []).length > 0) {
        addLog("warning", `${data.warnings.length} warning(s) returned.`, data.warnings);
      }
    } catch (err) {
      addLog("error", `Deployment request failed: ${err.message}`);
    } finally {
      setBusyFlag("deploy", false);
    }
  }

  compileShortcutRef.current = () => {
    const now = Date.now();
    if (now - lastShortcutRunAtRef.current < 200) {
      return;
    }

    lastShortcutRunAtRef.current = now;

    if (busy.compile || busy.deploy) {
      addLog("warning", "Compile shortcut ignored: another compile/deploy is in progress.");
      return;
    }

    void compileSource();
  };

  useEffect(() => {
    function onWindowKeyDown(event) {
      if (event.defaultPrevented) {
        return;
      }

      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();
      compileShortcutRef.current();
    }

    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, []);

  async function runSelectedFunction() {
    if (!deployment?.contractAddress) {
      addLog("error", "Deploy a contract before executing functions.");
      return;
    }

    if (!selectedFunctionAbi) {
      addLog("error", "Select a function first.");
      return;
    }

    const functionSignature = toFunctionSignature(selectedFunctionAbi);
    const args = (selectedFunctionAbi.inputs || []).map((_, index) => {
      return functionArgValues[index] ?? "";
    });

    const valueToSend =
      selectedFunctionAbi.stateMutability === "payable" ? callValueWei || "0" : "0";

    setBusyFlag("call", true);
    setLastCallResult(null);

    try {
      addLog("info", `Executing ${functionSignature}...`, { args, value: valueToSend });

      const data = await requestJson("/call", {
        method: "POST",
        body: JSON.stringify({
          contractAddress: deployment.contractAddress,
          functionName: functionSignature,
          args,
          value: valueToSend,
        }),
      });

      if (!data.success) {
        addLog("error", `Function execution failed for ${functionSignature}.`, data.error || null);
        return;
      }

      setLastCallResult(data);

      if (data.type === "call") {
        addLog("success", `${functionSignature} completed as read call.`, data.result);
      } else {
        const emittedEvents = Array.isArray(data.events) ? data.events : [];

        addLog("success", `${functionSignature} transaction confirmed.`, {
          txHash: data.txHash,
          gasUsed: data.gasUsed,
          events: emittedEvents.length,
        });

        if (emittedEvents.length > 0) {
          const eventNames = emittedEvents.map((item) => item.event).join(", ");
          addLog("info", `Emitted ${emittedEvents.length} event(s): ${eventNames}`, emittedEvents);
        } else {
          addLog("info", "No events emitted in this transaction.");
        }
      }
    } catch (err) {
      addLog("error", `Execution request failed: ${err.message}`);
    } finally {
      setBusyFlag("call", false);
    }
  }

  async function resetSession() {
    if (!deployment?.contractAddress) {
      addLog("warning", "Nothing to reset. Deploy a contract first.");
      return;
    }

    setBusyFlag("reset", true);

    try {
      const data = await requestJson("/reset", {
        method: "POST",
        body: JSON.stringify({ contractAddress: deployment.contractAddress }),
      });

      if (!data.success) {
        addLog("error", "Reset failed.", data.error || null);
        return;
      }

      addLog("info", "Local session reset complete.");
      setDeployment(null);
      setLastCallResult(null);
    } catch (err) {
      addLog("error", `Reset request failed: ${err.message}`);
    } finally {
      setBusyFlag("reset", false);
    }
  }

  function onFunctionInputChange(index, value) {
    setFunctionArgValues((prev) => ({
      ...prev,
      [index]: value,
    }));
  }

  function onConstructorInputChange(index, value) {
    setConstructorArgValues((prev) => ({
      ...prev,
      [index]: value,
    }));
  }

  function onFunctionSelectionChange(value) {
    setSelectedFunctionSignature(value);
    setFunctionArgValues({});
    setCallValueWei("0");
    setLastCallResult(null);
  }

  return (
    <div className="min-h-screen relative">
      <StarBackground starCount={120} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="mb-6 sm:mb-8">
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-slate-600 text-slate-200 hover:bg-slate-800 rounded-xl font-semibold transition-all duration-300">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </button>
          </Link>
        </div>

        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-linear-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full">
            <Code className="w-4 h-4 text-blue-300" />
            <span className="text-sm font-semibold text-blue-300">Solidity Playground</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Simple Compile, Deploy, and Test Lab
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-3xl">
            Write your smart contract, compile it, deploy to a temporary local chain, and test
            functions step by step.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/70 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-300" />
                  <span className="text-sm font-semibold text-slate-200">Playground.sol</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {TEMPLATE_OPTIONS.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-600 text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all"
                    >
                      {template.name}
                    </button>
                  ))}

                  <button
                    onClick={copySourceCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-600 text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="code-theme-one-dark-pro rounded-none border-0 shadow-none">
                <MonacoEditor
                  beforeMount={handleEditorBeforeMount}
                  onMount={handleEditorMount}
                  path="Playground.sol"
                  language="solidity"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="one-dark-pro"
                  height="560px"
                  options={{
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                    fontSize: 14,
                    lineHeight: 24,
                    tabSize: 4,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    renderWhitespace: "selection",
                    padding: { top: 14, bottom: 14 },
                  }}
                />
              </div>
            </div>

            <div className="code-theme-one-dark-pro rounded-2xl p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-3 flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-blue-300" />
                Terminal Output
              </h2>

              <div className="code-theme-one-dark-pro rounded-xl p-3 sm:p-4 max-h-90 overflow-y-auto text-xs sm:text-sm">
                <div className="space-y-3">
                  {terminalLogs.map((entry) => (
                    <div key={entry.id}>
                      <p
                        className={`font-mono ${
                          entry.level === "success"
                            ? "text-green-300"
                            : entry.level === "error"
                              ? "text-red-300"
                              : entry.level === "warning"
                                ? "text-yellow-300"
                                : "text-blue-300"
                        }`}
                      >
                        [{entry.time}] {entry.level.toUpperCase()}: {entry.message}
                      </p>

                      {entry.details !== null && (
                        <pre className="mt-1 pl-3 border-l border-slate-600 text-slate-300 whitespace-pre-wrap wrap-break-word font-mono">
                          {typeof entry.details === "string"
                            ? entry.details
                            : JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-yellow-300" />
                Compile and Deploy
              </h2>

              <div className="space-y-4">
                {compiledContracts.length > 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Contract</label>

                    <select
                      value={selectedContract}
                      onChange={(e) => setSelectedContract(e.target.value)}
                      className="w-full min-h-11 sm:min-h-12 rounded-xl border-2 border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                    >
                      {!selectedContract && <option value="">Auto select deployable contract</option>}
                      {compiledContracts.map((item) => (
                        <option key={`${item.fileName}-${item.contractName}`} value={item.contractName}>
                          {item.contractName}
                          {item.deployable ? "" : " (non-deployable)"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {constructorAbi && (constructorAbi.inputs || []).length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-200 mb-1">
                      Constructor Arguments
                    </label>
                    {(constructorAbi.inputs || []).map((input, index) => (
                      <div key={`${input.name || "arg"}-${index}`}>
                        <label className="block text-xs font-semibold text-slate-200 mb-1">
                          {input.name || `arg${index}`} ({input.type})
                        </label>
                        <input
                          value={constructorArgValues[index] ?? defaultValueForType(input.type)}
                          onChange={(e) => onConstructorInputChange(index, e.target.value)}
                          placeholder={
                            input.type.includes("[") || input.type.startsWith("tuple")
                              ? "Use JSON-like value"
                              : "Value"
                          }
                          className="w-full min-h-10 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {constructorAbi && (constructorAbi.inputs || []).length === 0 && (
                  <p className="text-xs text-slate-300">
                    This contract has no constructor arguments.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={compileSource}
                    disabled={busy.compile}
                    className="inline-flex items-center justify-center gap-2 min-h-11 px-3 py-2 text-sm bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {busy.compile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hammer className="w-4 h-4" />}
                    Compile
                  </button>

                  <button
                    onClick={deploySource}
                    disabled={busy.deploy}
                    className="inline-flex items-center justify-center gap-2 min-h-11 px-3 py-2 text-sm bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {busy.deploy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    Deploy
                  </button>
                </div>
              </div>

              {compilerMeta && (
                <div className="mt-4 p-3 rounded-xl border border-slate-600 bg-slate-900/70">
                  <p className="text-xs text-slate-300 font-semibold">Compiled Contract</p>
                  <p className="text-sm text-slate-100 mt-1">{compilerMeta.contractName}</p>
                  {(compilerMeta.warnings || []).length > 0 && (
                    <p className="text-xs text-yellow-300 mt-1">
                      Warning Count: {compilerMeta.warnings.length}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-cyan-300" />
                Function Tester
              </h2>

              {!deployment?.contractAddress ? (
                <div className="rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm text-slate-200">
                  Deploy a contract first, then functions will appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-3">
                    <p className="text-xs font-semibold text-green-300">Active Deployment</p>
                    <p className="text-sm text-green-100 break-all mt-1">
                      {deployment.contractAddress}
                    </p>
                    <p className="text-xs text-green-200 mt-1">{deployment.contractName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Function</label>
                    <select
                      value={selectedFunctionSignature}
                      onChange={(e) => onFunctionSelectionChange(e.target.value)}
                      className="w-full min-h-11 sm:min-h-12 rounded-xl border-2 border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                    >
                      {!selectedFunctionSignature && <option value="">Select a function</option>}
                      {functionOptions.map((fn) => {
                        const signature = toFunctionSignature(fn);
                        return (
                          <option key={signature} value={signature}>
                            {signature}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedFunctionAbi && (selectedFunctionAbi.inputs || []).length > 0 && (
                    <div className="space-y-3">
                      {(selectedFunctionAbi.inputs || []).map((input, index) => (
                        <div key={`${input.name || "arg"}-${index}`}>
                          <label className="block text-xs font-semibold text-slate-200 mb-1">
                            {input.name || `arg${index}`} ({input.type})
                          </label>
                          <input
                            value={functionArgValues[index] || ""}
                            onChange={(e) => onFunctionInputChange(index, e.target.value)}
                            placeholder={
                              input.type.includes("[") || input.type === "tuple"
                                ? "Use JSON-like value"
                                : "Value"
                            }
                            className="w-full min-h-10 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFunctionAbi?.stateMutability === "payable" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Value in Wei
                      </label>
                      <input
                        value={callValueWei}
                        onChange={(e) => setCallValueWei(e.target.value)}
                        placeholder="0"
                        className="w-full min-h-10 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={runSelectedFunction}
                      disabled={busy.call || !selectedFunctionAbi}
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-3 py-2 text-sm bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {busy.call ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                      Run
                    </button>

                    <button
                      onClick={resetSession}
                      disabled={busy.reset}
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-3 py-2 text-sm bg-linear-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {busy.reset ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Reset
                    </button>
                  </div>

                  {lastCallResult && (
                    <pre className="code-theme-one-dark-pro rounded-xl p-3 text-xs sm:text-sm whitespace-pre-wrap wrap-break-word overflow-auto max-h-72">
                      {JSON.stringify(lastCallResult, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            
          </aside>
        </div>
      </div>
    </div>
  );
}
