"use client";
import Link from "next/link";
import { motion } from 'framer-motion';
import { Blocks, Award, Rocket, Vote, Heart, Shield, Github, BookOpen, Linkedin, Video } from "lucide-react";
import StarBackground from "@/components/StarBackground";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <StarBackground starCount={120} />

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
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
              <strong>Note:</strong> Install MetaMask extension for PC/Laptops, or download the MetaMask app for mobile/tablets to get started!
            </p>
          </div>

          <div className="relative inline-block mb-8 sm:mb-12">
            <Link href="/documentation">
              <button className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm sm:text-base rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg active:scale-95">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  View Documentation & Deploy Guide
                </span>
                <span className="sm:hidden">Documentation</span>
              </button>
            </Link>

            {/* Red Sticker Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 10,
                delay: 0.5
              }}
              className="absolute -top-3 -left-2 sm:-top-4 sm:-left-3"
            >
              <div className="relative">
                {/* Sticker with wavy edges */}
                <div
                  className="bg-red-600 px-2 sm:px-3 py-1 sm:py-1.5 -rotate-12 shadow-lg"
                  style={{
                    clipPath: 'polygon(8% 5%, 15% 2%, 25% 4%, 35% 1%, 45% 3%, 55% 1%, 65% 4%, 75% 2%, 85% 5%, 92% 3%, 96% 10%, 98% 20%, 99% 50%, 98% 80%, 96% 90%, 92% 97%, 85% 95%, 75% 98%, 65% 96%, 55% 99%, 45% 97%, 35% 99%, 25% 96%, 15% 98%, 8% 95%, 4% 90%, 2% 80%, 1% 50%, 2% 20%, 4% 10%)',
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    <span className="text-white font-bold text-[8px] sm:text-[10px] whitespace-nowrap leading-tight">
                      Video<br/>Tutorials
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Faucet Section */}
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-sm sm:text-base text-slate-300 mb-4">
              Do not have SepoliaETH on your account? Get 0.05 instantly every 24 hours:
            </p>
            <Link href="/faucet">
              <button className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-base sm:text-lg rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg active:scale-95">
                <span>Get Free SepoliaETH</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
          {/* ConfCert Project */}
          <Link href="/confcert">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              whileHover={{ scale: 1.03 }}
              className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-yellow-500/30 hover:border-yellow-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(234,179,8,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(234,179,8,0.5)] transition-all duration-300 cursor-pointer active:scale-95"
            >
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
            </motion.div>
          </Link>

          {/* Placeholder for future projects */}
          <Link href="/voting">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-blue-500/30 hover:border-blue-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(59,130,246,0.5)] transition-all duration-300 cursor-pointer active:scale-95"
            >
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
            </motion.div>
          </Link>

          {/* Donate System Project */}
          <Link href="/donate">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-green-500/30 hover:border-green-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(34,197,94,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(34,197,94,0.5)] transition-all duration-300 cursor-pointer active:scale-95"
            >
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
            </motion.div>
          </Link>

          {/* University Certificate Project */}
          <Link href="/university-certificate">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(99,102,241,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(99,102,241,0.5)] transition-all duration-300 cursor-pointer active:scale-95"
            >
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
            </motion.div>
          </Link>

          {/* Rental Agreement Project */}
          <Link href="/rental">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.03 }}
              className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-teal-500/30 hover:border-teal-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(20,184,166,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(20,184,166,0.5)] transition-all duration-300 cursor-pointer active:scale-95"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-teal-400 mb-2 sm:mb-3">
                Rental Agreement
              </h3>
              
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Smart contract-based rental agreements with automated monthly rent collection and security deposits.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <span className="px-2 sm:px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-xs text-teal-400">
                  Automated
                </span>
                <span className="px-2 sm:px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-xs text-teal-400">
                  Payments
                </span>
                <span className="px-2 sm:px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-xs text-teal-400">
                  Web3
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-teal-400 text-sm sm:text-base font-semibold group-hover:gap-3 transition-all">
                Explore Project
                <Rocket className="w-4 h-4" />
              </div>
            </motion.div>
          </Link>

          <Link href="/assignment">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.03 }}
              className="group bg-linear-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(6,182,212,0.5)] transition-all duration-300 cursor-pointer active:scale-95"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:rotate-6 transition-transform duration-300">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-2 sm:mb-3">
                Assignment Vault
              </h3>

              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Timestamped assignment submissions with IPFS storage and blockchain proof.
              </p>

              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <span className="px-2 sm:px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-400">
                  Timestamp
                </span>
                <span className="px-2 sm:px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-400">
                  IPFS
                </span>
                <span className="px-2 sm:px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-400">
                  Proof
                </span>
              </div>

              <div className="flex items-center gap-2 text-cyan-400 text-sm sm:text-base font-semibold group-hover:gap-3 transition-all">
                Explore Project
                <Rocket className="w-4 h-4" />
              </div>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            className="bg-linear-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-6 sm:p-8 opacity-50"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Blocks className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-400 mb-2 sm:mb-3">
              Coming Soon
            </h3>

            <p className="text-sm sm:text-base text-slate-500">
              More blockchain projects in development...
            </p>
          </motion.div>
        </div>

        {/* About Section */}
        <div className="relative z-10 mt-12 sm:mt-16 lg:mt-20 text-center">
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
        <div className="relative z-10 mt-12 sm:mt-16 text-center">
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
