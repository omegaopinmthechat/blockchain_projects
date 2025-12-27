"use client"
import { useState } from "react";
import Web3 from "web3";
import axios from "axios";
import { CONF_CERT_ABI } from "../../../lib/abi.js";
import Link from "next/link";
import { Upload, Wallet, ArrowLeft, Loader2, FileSpreadsheet, X, Plus, Edit3 } from "lucide-react";

export default function BulkIssue() {
  const [account, setAccount] = useState("");
  const [inputMode, setInputMode] = useState("csv"); // "csv" or "manual"
  const [csvFile, setCsvFile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [manualNames, setManualNames] = useState([""]);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask required");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
  }
  
  async function ensureSepoliaNetwork() {
    const sepoliaChainId = "0xaa36a7";

    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (currentChainId !== sepoliaChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: sepoliaChainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: sepoliaChainId,
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  }

  function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim());
      
      // Skip header row and parse CSV
      const parsed = rows.slice(1).map((row, index) => {
        const [name] = row.split(',').map(cell => cell.trim());
        return { name, fileIndex: index };
      });
      
      setCertificates(parsed);
    };
    
    reader.readAsText(file);
  }

  function handleFilesUpload(e) {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  }

  function addManualName() {
    setManualNames([...manualNames, ""]);
  }

  function removeManualName(index) {
    const updated = manualNames.filter((_, i) => i !== index);
    setManualNames(updated.length ? updated : [""]);
  }

  function updateManualName(index, value) {
    const updated = [...manualNames];
    updated[index] = value;
    setManualNames(updated);
  }

  function applyManualNames() {
    const validNames = manualNames.filter(name => name.trim());
    if (validNames.length === 0) {
      alert("Please enter at least one name");
      return;
    }
    const parsed = validNames.map((name, index) => ({ name, fileIndex: index }));
    setCertificates(parsed);
    alert(`${validNames.length} names added successfully`);
  }

  async function issueBulkCertificates() {
    if (!account) return alert("Connect MetaMask first");
    if (certificates.length === 0) return alert(inputMode === "csv" ? "Upload CSV file" : "Add student names");
    if (files.length === 0) return alert("Upload certificate files");
    if (certificates.length !== files.length) {
      return alert(`Number of names (${certificates.length}) must match number of files (${files.length})`);
    }

    await ensureSepoliaNetwork();

    try {
      setLoading(true);
      setStatus("Uploading files to IPFS...");

      const cids = [];
      
      // Upload each file to IPFS
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        
        const formData = new FormData();
        formData.append("certificate", files[i]);

        const uploadRes = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`,
          formData
        );

        cids.push(uploadRes.data.cid);
      }

      setStatus("Sending batch transaction...");

      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        CONF_CERT_ABI,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );

      const studentNames = certificates.map(cert => cert.name);

      const receipt = await contract.methods
        .issueCertificatesBatch(studentNames, cids)
        .send({ from: account });

      console.log("Bulk Receipt:", receipt);
      
      // Extract certificate IDs from events - Use getPastEvents as primary method
      let certificateIds = [];
      
      // Primary method: get events from the blockchain (most reliable)
      try {
        const events = await contract.getPastEvents('CertificateIssued', {
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber
        });
        
        console.log("All events in block:", events);
        
        const txEvents = events.filter(e => e.transactionHash === receipt.transactionHash);
        console.log("Events from this transaction:", txEvents);
        
        certificateIds = txEvents.map(e => e.returnValues.id);
        console.log("Certificate IDs:", certificateIds);
      } catch (err) {
        console.error("Error getting events:", err);
      }
      
      // Fallback 1: Try to get events from receipt
      if (certificateIds.length === 0 && receipt.events) {
        console.log("Receipt.events:", receipt.events);
        
        if (receipt.events.CertificateIssued) {
          const events = Array.isArray(receipt.events.CertificateIssued) 
            ? receipt.events.CertificateIssued 
            : [receipt.events.CertificateIssued];
          certificateIds = events.map(e => e.returnValues.id);
          console.log("Got IDs from receipt.events:", certificateIds);
        } else {
          // Sometimes events come as numbered properties like 0, 1, 2...
          Object.keys(receipt.events).forEach(key => {
            const event = receipt.events[key];
            if (event.event === 'CertificateIssued' && event.returnValues && event.returnValues.id) {
              certificateIds.push(event.returnValues.id);
            }
          });
          if (certificateIds.length > 0) {
            console.log("Got IDs from receipt.events (numbered):", certificateIds);
          }
        }
      }
      
      // Fallback 2: Try parsing logs directly
      if (certificateIds.length === 0 && receipt.logs && receipt.logs.length > 0) {
        console.log("Trying to parse logs, count:", receipt.logs.length);
        const web3 = new Web3(window.ethereum);
        
        // CertificateIssued event signature hash
        const eventSignature = web3.utils.sha3('CertificateIssued(uint256,string,string)');
        console.log("Event signature:", eventSignature);
        
        receipt.logs.forEach((log, index) => {
          console.log(`Log ${index} topics[0]:`, log.topics[0]);
          // Check if this log is a CertificateIssued event
          if (log.topics[0] === eventSignature) {
            try {
              const decoded = web3.eth.abi.decodeLog(
                [
                  { type: 'uint256', name: 'id', indexed: false },
                  { type: 'string', name: 'studentName', indexed: false },
                  { type: 'string', name: 'ipfsCID', indexed: false }
                ],
                log.data,
                log.topics.slice(1)
              );
              console.log(`Decoded log ${index}:`, decoded);
              if (decoded.id) {
                certificateIds.push(decoded.id);
              }
            } catch (e) {
              console.error(`Error decoding log ${index}:`, e);
            }
          }
        });
        console.log("Got IDs from logs:", certificateIds);
      }

      const idsDisplay = certificateIds.length > 0 
        ? ` IDs: ${certificateIds.join(', ')}`
        : '';
      
      setStatus(`Certificate batch issued successfully! ${certificates.length} certificates created.${idsDisplay}`);
      
      // Clear form
      setCertificates([]);
      setFiles([]);
      setCsvFile(null);
      setManualNames([""]);
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      setStatus("Certificate batch issuance failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-200">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 text-sm border-2 border-yellow-400 text-yellow-900 hover:bg-yellow-50 rounded-xl font-semibold transition-all duration-300 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Bulk Issue Certificates
          </h1>
          <p className="text-yellow-800 text-lg">
            Upload multiple certificates at once using CSV and certificate files
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Instructions
          </h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-yellow-900 mb-2">Option 1: CSV Upload</p>
              <ol className="space-y-2 text-yellow-800 text-sm ml-4">
                <li>1. Create a CSV file with header: <code className="bg-yellow-200 px-2 py-1 rounded">name</code></li>
                <li>2. Add student names in subsequent rows (one per row)</li>
                <li>3. Upload the CSV file</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-yellow-900 mb-2">Option 2: Manual Entry</p>
              <ol className="space-y-2 text-yellow-800 text-sm ml-4">
                <li>1. Switch to "Manual Entry" mode</li>
                <li>2. Add student names using the form</li>
                <li>3. Click "Apply Names"</li>
              </ol>
            </div>
            <p className="text-yellow-800 text-sm mt-3">
              Then upload certificate files (one for each student, in the same order) and click "Issue Batch"
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] mb-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-yellow-900 mb-2">Batch Certificate Details</h3>
            <p className="text-sm text-yellow-800">
              Connect your wallet and upload the required files
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Wallet Connection */}
            {!account ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <p className="text-yellow-800 text-center">
                  Connect your MetaMask wallet to continue
                </p>
                <button onClick={connectWallet} className="inline-flex items-center justify-center gap-2 h-14 px-8 py-4 text-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
                  <Wallet className="w-5 h-5" />
                  Connect MetaMask
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl border-2 border-yellow-300">
                <p className="text-sm text-yellow-700 mb-1 font-semibold">Connected Wallet</p>
                <p className="text-yellow-900 font-mono text-sm break-all">{account}</p>
              </div>
            )}

            {/* Form Fields */}
            {account && (
              <>
                {/* Input Mode Toggle */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => {
                      setInputMode("csv");
                      setCertificates([]);
                      setManualNames([""]);
                    }}
                    className={`flex-1 h-12 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      inputMode === "csv"
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                        : "bg-white border-2 border-yellow-200 text-yellow-900 hover:bg-yellow-50"
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 inline mr-2" />
                    CSV Upload
                  </button>
                  <button
                    onClick={() => {
                      setInputMode("manual");
                      setCertificates([]);
                      setCsvFile(null);
                    }}
                    className={`flex-1 h-12 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      inputMode === "manual"
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                        : "bg-white border-2 border-yellow-200 text-yellow-900 hover:bg-yellow-50"
                    }`}
                  >
                    <Edit3 className="w-5 h-5 inline mr-2" />
                    Manual Entry
                  </button>
                </div>

                {/* CSV Upload Mode */}
                {inputMode === "csv" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-yellow-900">
                      CSV File (Student Names)
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      disabled={loading}
                      className="flex h-12 w-full rounded-xl border-2 border-yellow-200 bg-white px-4 py-2 text-base text-yellow-900 placeholder:text-yellow-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-yellow-700 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        {csvFile.name} - {certificates.length} students
                      </p>
                    )}
                  </div>
                )}

                {/* Manual Entry Mode */}
                {inputMode === "manual" && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-yellow-900">
                      Student Names
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {manualNames.map((name, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => updateManualName(index, e.target.value)}
                            placeholder={`Student ${index + 1} name`}
                            disabled={loading}
                            className="flex h-12 flex-1 rounded-xl border-2 border-yellow-200 bg-white px-4 py-2 text-base text-yellow-900 placeholder:text-yellow-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                          />
                          {manualNames.length > 1 && (
                            <button
                              onClick={() => removeManualName(index)}
                              disabled={loading}
                              className="h-12 px-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addManualName}
                        disabled={loading}
                        className="flex items-center gap-2 h-10 px-4 py-2 bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-yellow-900 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        Add Name
                      </button>
                      <button
                        onClick={applyManualNames}
                        disabled={loading}
                        className="flex items-center gap-2 h-10 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                      >
                        Apply Names ({manualNames.filter(n => n.trim()).length})
                      </button>
                    </div>
                    {certificates.length > 0 && (
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ {certificates.length} names ready
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-yellow-900">
                    Certificate Files (Must match name order)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFilesUpload}
                    disabled={loading}
                    className="flex h-12 w-full rounded-xl border-2 border-yellow-200 bg-white px-4 py-2 text-base text-yellow-900 placeholder:text-yellow-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer"
                  />
                  {files.length > 0 && (
                    <p className="mt-2 text-sm text-yellow-700 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {files.length} files selected
                    </p>
                  )}
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-800">Uploading: {uploadProgress}%</p>
                    <div className="w-full h-2 bg-yellow-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={issueBulkCertificates}
                  disabled={loading || certificates.length === 0 || files.length === 0 || certificates.length !== files.length}
                  className="inline-flex items-center justify-center gap-2 w-full h-14 px-8 py-4 text-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Issue Batch ({certificates.length} certificates)
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className={`bg-gradient-to-b from-white to-yellow-100 border-2 rounded-2xl p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] ${status.includes("successfully") ? "border-green-500 from-green-50" : status.includes("failed") ? "border-red-500 from-red-50" : "border-yellow-200"}`}>
            <p className={`text-center font-semibold ${status.includes("successfully") ? "text-green-700" : status.includes("failed") ? "text-red-700" : "text-yellow-800"}`}>
              {status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
