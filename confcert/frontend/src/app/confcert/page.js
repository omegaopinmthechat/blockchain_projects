"use client";
import Link from "next/link";
import { FileCheck, Shield, Award, ArrowLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-yellow-50 via-yellow-100 to-yellow-200">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm border-2 border-yellow-400 text-yellow-900 hover:bg-yellow-50 rounded-xl font-semibold transition-all duration-300">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </button>
          </Link>
        </div>

        <div className="text-center mb-4 sm:mb-6 lg:mb-12">          <div className="inline-block mb-6 px-6 py-2 bg-linear-to-r from-yellow-200 to-yellow-300 rounded-full">
            <span className="text-yellow-900 font-semibold text-sm">
              Blockchain-Powered Certificates
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-linear-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            ConfCert
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-yellow-800 mb-4 sm:mb-6 lg:mb-8 max-w-2xl mx-auto">
            Issue and verify certificates on the blockchain with IPFS storage.
            Secure, transparent, and tamper-proof certification system.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/confcert/issue">
              <button className="inline-flex items-center justify-center gap-2 min-h-12 sm:min-h-14 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                Issue Certificate
              </button>
            </Link>

            <Link href="/confcert/bulk-issue">
              <button className="inline-flex items-center justify-center gap-2 min-h-12 sm:min-h-14 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                Bulk Issue
              </button>
            </Link>

            <Link href="/confcert/verify">
              <button className="inline-flex items-center justify-center gap-2 min-h-12 sm:min-h-14 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-linear-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-900 border-2 border-yellow-300 font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                Verify Certificate
              </button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-16">
          <div className="bg-linear-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] hover:scale-105 active:scale-95 transition-transform duration-300">
            <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-yellow-900 mb-2">
              Blockchain Security
            </h3>
            <p className="text-sm text-yellow-800">
              Certificates stored immutably on the blockchain, ensuring
              authenticity and preventing fraud.
            </p>
          </div>

          <div className="bg-linear-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] hover:scale-105 active:scale-95 transition-transform duration-300">
            <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-yellow-900 mb-2">
              IPFS Storage
            </h3>
            <p className="text-sm text-yellow-800">
              Certificate files stored on IPFS for decentralized, permanent, and
              accessible storage.
            </p>
          </div>

          <div className="bg-linear-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)] hover:scale-105 active:scale-95 transition-transform duration-300">
            <div className="w-12 min-h-11 sm:min-h-12 bg-linear-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-yellow-900 mb-2">
              Easy Verification
            </h3>
            <p className="text-sm text-yellow-800">
              Instantly verify any certificate by its ID. No central authority
              needed.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-20">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 lg:mb-12 text-yellow-900">
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div className="bg-linear-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)]">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-900 flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-10 min-h-10 rounded-full bg-linear-to-br from-yellow-400 to-yellow-500 text-white font-bold">
                  1
                </span>
                Issue Certificates
              </h3>
              <ul className="space-y-3 text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  Connect your MetaMask wallet
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  Upload the certificate file
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  Enter student name and submit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  File stored on IPFS, record on blockchain
                </li>
              </ul>
            </div>

            <div className="bg-linear-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)]">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-900 flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-10 min-h-10 rounded-full bg-linear-to-br from-yellow-400 to-yellow-500 text-white font-bold">
                  2
                </span>
                Verify Certificates
              </h3>
              <ul className="space-y-3 text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  Enter the certificate ID
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  Click verify to query blockchain
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  View certificate details and issuer
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">▸</span>
                  Access original certificate from IPFS
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
