"use client";
import Link from "next/link";
import { Blocks, Award, Rocket, Vote, Heart, Shield, Github, BookOpen, Linkedin } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 bg-linear-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full">
            <span className="text-blue-300 font-semibold text-xs sm:text-sm">
              Blockchain Projects Portfolio
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-4">
            Blockchain Projects
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Explore decentralized applications built on blockchain technology.
            Secure, transparent, and innovative solutions.
          </p>

          <div className="bg-linear-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4 max-w-2xl mx-auto mb-6 sm:mb-8">
            <p className="text-sm sm:text-base text-purple-300 font-medium">
              💡 <strong>Note:</strong> Install MetaMask extension for PC/Laptops, or download the MetaMask app for mobile/tablets to get started!
            </p>
          </div>

          <Link href="/documentation">
            <button className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm sm:text-base rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg active:scale-95">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                View Documentation & Deploy Guide
              </span>
              <span className="sm:hidden">Documentation</span>
            </button>
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
          {/* ConfCert Project */}
          <Link href="/confcert">
            <div className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-yellow-500/30 hover:border-yellow-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(234,179,8,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(234,179,8,0.5)] transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-2 sm:mb-3">
                ConfCert
              </h3>

              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Blockchain-powered certificate issuance and verification system
                with IPFS storage.
              </p>

              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <span className="px-2 sm:px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                  Sepolia
                </span>
                <span className="px-2 sm:px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                  IPFS
                </span>
                <span className="px-2 sm:px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                  Web3
                </span>
              </div>

              <div className="flex items-center gap-2 text-yellow-400 text-sm sm:text-base font-semibold group-hover:gap-3 transition-all">
                Explore Project
                <Rocket className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Placeholder for future projects */}
          <Link href="/voting">
            <div className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-blue-500/30 hover:border-blue-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Vote className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-blue-400 mb-2 sm:mb-3">
                Voting System
              </h3>

              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Decentralized voting system ensuring transparency and preventing
                fraud.
              </p>

              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <span className="px-2 sm:px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                  Ethereum
                </span>
                <span className="px-2 sm:px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                  Solidity
                </span>
                <span className="px-2 sm:px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                  Web3
                </span>
              </div>

              <div className="flex items-center gap-2 text-blue-400 text-sm sm:text-base font-semibold group-hover:gap-3 transition-all">
                Explore Project
                <Rocket className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Donate System Project */}
          <Link href="/donate">
            <div className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-green-500/30 hover:border-green-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(34,197,94,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(34,197,94,0.5)] transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-green-400 mb-2 sm:mb-3">
                Donate System
              </h3>

              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Transparent charity donation platform with blockchain-verified
                transactions.
              </p>

              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <span className="px-2 sm:px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
                  Charity
                </span>
                <span className="px-2 sm:px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
                  Ethereum
                </span>
                <span className="px-2 sm:px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
                  Web3
                </span>
              </div>

              <div className="flex items-center gap-2 text-green-400 text-sm sm:text-base font-semibold group-hover:gap-3 transition-all">
                Explore Project
                <Rocket className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* University Certificate Project */}
          <Link href="/university-certificate">
            <div className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(99,102,241,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-indigo-400 mb-2 sm:mb-3">
                University Certificate
              </h3>

              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Hash-based certificate verification system. Store and verify
                document authenticity.
              </p>

              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <span className="px-2 sm:px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs text-indigo-400">
                  SHA-256
                </span>
                <span className="px-2 sm:px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs text-indigo-400">
                  Verification
                </span>
                <span className="px-2 sm:px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs text-indigo-400">
                  Web3
                </span>
              </div>

              <div className="flex items-center gap-2 text-indigo-400 text-sm sm:text-base font-semibold group-hover:gap-3 transition-all">
                Explore Project
                <Rocket className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <div className="bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-6 sm:p-8 opacity-50">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Blocks className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-400 mb-2 sm:mb-3">
              Coming Soon
            </h3>

            <p className="text-sm sm:text-base text-slate-500">
              More blockchain projects in development...
            </p>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent px-4">
            Built with Modern Tech
          </h2>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mt-6 sm:mt-8 px-4">
            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-xl">
              <span className="text-slate-300 text-sm sm:text-base font-semibold">
                Solidity
              </span>
            </div>
            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-xl">
              <span className="text-slate-300 text-sm sm:text-base font-semibold">
                Web3.js
              </span>
            </div>
            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-xl">
              <span className="text-slate-300 text-sm sm:text-base font-semibold">
                Next.js
              </span>
            </div>
            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-xl">
              <span className="text-slate-300 text-sm sm:text-base font-semibold">
                IPFS
              </span>
            </div>
            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-xl">
              <span className="text-slate-300 text-sm sm:text-base font-semibold">
                MetaMask
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-6 sm:p-8">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-300 mb-4 sm:mb-6">
              Made by Amar Sankar Maitra
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
              <a
                href="https://github.com/omegaopinmthechat/blockchain_projects"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm sm:text-base rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                View on GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/amarsankarmaitra"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
