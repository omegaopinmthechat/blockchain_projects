"use client";
import Link from "next/link";
import { Shield, FileCheck, Upload } from "lucide-react";

export default function UniversityCertificate() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-indigo-50 via-indigo-100 to-indigo-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-6 sm:mb-4 sm:mb-6 lg:mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-2xl mb-6">
            <Shield className="w-12 min-h-11 sm:min-h-12 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
            University Certificate
          </h1>
          
          <p className="text-base sm:text-sm sm:text-base lg:text-lg lg:text-xl text-indigo-800">
            Blockchain-based certificate hash verification system
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Store Certificate */}
          <Link href="/university-certificate/store">
            <div className="group bg-linear-to-b from-white to-indigo-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
              <div className="w-16 h-16 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h2 className="text-base sm:text-sm sm:text-base lg:text-lg md:text-xl lg:text-2xl font-bold text-indigo-900 mb-3">
                Store Certificate Hash
              </h2>
              
              <p className="text-indigo-700 mb-4">
                Upload certificate and store its hash on blockchain (University only)
              </p>
              
              <div className="flex items-center gap-2 text-indigo-500 font-semibold group-hover:gap-3 transition-all">
                Go to Store
                <span className="text-xl">→</span>
              </div>
            </div>
          </Link>

          {/* Verify Certificate */}
          <Link href="/university-certificate/verify">
            <div className="group bg-linear-to-b from-white to-indigo-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
              <div className="w-16 h-16 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h2 className="text-base sm:text-sm sm:text-base lg:text-lg md:text-xl lg:text-2xl font-bold text-indigo-900 mb-3">
                Verify Certificate
              </h2>
              
              <p className="text-indigo-700 mb-4">
                Upload certificate file to verify its authenticity on blockchain
              </p>
              
              <div className="flex items-center gap-2 text-indigo-500 font-semibold group-hover:gap-3 transition-all">
                Go to Verify
                <span className="text-xl">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-linear-to-b from-white to-indigo-100 border-2 border-indigo-200 rounded-2xl p-4 sm:p-6 lg:p-8">
          <h3 className="text-base sm:text-sm sm:text-base lg:text-lg md:text-xl lg:text-2xl font-bold text-indigo-900 mb-4">How It Works</h3>
          
          <div className="space-y-4 text-indigo-800">
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold mt-1">1.</span>
              <p>
                <strong>University stores hash:</strong> Upload certificate file, system generates SHA-256 hash and stores it on blockchain
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold mt-1">2.</span>
              <p>
                <strong>Hash stored permanently:</strong> The hash is stored immutably on the blockchain, no one can modify it
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold mt-1">3.</span>
              <p>
                <strong>Anyone can verify:</strong> Upload the same certificate file to verify if its hash exists on blockchain
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-indigo-500 font-bold mt-1">4.</span>
              <p>
                <strong>Tamper-proof:</strong> Even a single character change in the certificate will result in a completely different hash
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-indigo-300 text-indigo-900 hover:bg-indigo-50 rounded-xl font-semibold transition-all">
              ← Back to Projects
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
