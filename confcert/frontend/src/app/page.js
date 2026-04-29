"use client";
import Link from "next/link";
import { motion } from 'framer-motion';
import { Blocks, Award, Rocket, Vote, Heart, Shield, Github, BookOpen, Linkedin } from "lucide-react";
export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex mb-6 px-4 py-2 bg-transparent border border-border-main rounded-full">
            <span className="text-text-muted text-sm">
              Blockchain Projects Portfolio
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-text-main px-4 tracking-tight">
            Blockchain Projects
          </h1>

          <p className="text-lg text-text-muted mb-8 max-w-2xl mx-auto px-4">
            Explore decentralized applications built on blockchain technology.<br />
            Secure, transparent, and innovative solutions.
          </p>

          <div className="bg-bg-input border border-border-main rounded-2xl p-5 max-w-4xl mx-auto mb-8">
            <p className="text-base text-text-main">
              <span className="font-bold text-text-main">Note:</span> Install MetaMask extension for PC/Laptops, or download the MetaMask app for mobile/tablets to get started!
            </p>
          </div>

        </div>

        {/* Projects Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
          {/* ConfCert Project */}
          <Link href="/confcert">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              className="bg-bg-card border border-border-main hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 h-full flex flex-col"
            >
              <div className="w-14 h-14 bg-[#2A2216] rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-yellow-500" />
              </div>

              <h3 className="text-2xl font-bold text-yellow-500 mb-4">
                ConfCert
              </h3>

              <p className="text-base text-text-muted leading-relaxed">
                Blockchain-powered certificate issuance and verification system
                with IPFS storage.
              </p>
            </motion.div>
          </Link>

          {/* Voting System Project */}
          <Link href="/voting">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-bg-card border border-border-main hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 h-full flex flex-col"
            >
              <div className="w-14 h-14 bg-[#1A2035] rounded-2xl flex items-center justify-center mb-6">
                <Vote className="w-7 h-7 text-blue-500" />
              </div>

              <h3 className="text-2xl font-bold text-blue-500 mb-4">
                Voting System
              </h3>

              <p className="text-base text-text-muted leading-relaxed">
                Decentralized voting system ensuring transparency and preventing
                fraud.
              </p>
            </motion.div>
          </Link>

          {/* Donate System Project */}
          <Link href="/donate">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-bg-card border border-border-main hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 h-full flex flex-col"
            >
              <div className="w-14 h-14 bg-[#14291F] rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-green-500" />
              </div>

              <h3 className="text-2xl font-bold text-green-500 mb-4">
                Donate System
              </h3>

              <p className="text-base text-text-muted leading-relaxed">
                Transparent charity donation platform with blockchain-verified
                transactions.
              </p>
            </motion.div>
          </Link>

          {/* University Certificate Project */}
          <Link href="/university-certificate">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-bg-card border border-border-main hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 h-full flex flex-col"
            >
              <div className="w-14 h-14 bg-btn-bg rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-indigo-500" />
              </div>

              <h3 className="text-2xl font-bold text-indigo-500 mb-4">
                University Certificate
              </h3>

              <p className="text-base text-text-muted leading-relaxed">
                Hash-based certificate verification system. Store and verify
                document authenticity.
              </p>
            </motion.div>
          </Link>

          {/* Rental Agreement Project */}
          <Link href="/rental">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-bg-card border border-border-main hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 h-full flex flex-col"
            >
              <div className="w-14 h-14 bg-[#112423] rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-teal-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-teal-500 mb-4">
                Rental Agreement
              </h3>
              
              <p className="text-base text-text-muted leading-relaxed">
                Smart contract-based rental agreements with automated monthly rent collection and security deposits.
              </p>
            </motion.div>
          </Link>

          <Link href="/assignment">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-bg-card border border-border-main hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 h-full flex flex-col"
            >
              <div className="w-14 h-14 bg-[#112428] rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-cyan-500" />
              </div>

              <h3 className="text-2xl font-bold text-cyan-500 mb-4">
                Assignment Vault
              </h3>

              <p className="text-base text-text-muted leading-relaxed">
                Timestamped assignment submissions with IPFS storage and blockchain proof.
              </p>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-bg-card border border-border-main border-dashed rounded-3xl p-8 opacity-60 h-full flex flex-col"
          >
            <div className="w-14 h-14 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-6">
              <Blocks className="w-7 h-7 text-text-muted" />
            </div>

            <h3 className="text-2xl font-bold text-text-muted mb-4">
              Coming Soon
            </h3>

            <p className="text-base text-text-muted leading-relaxed">
              More blockchain projects in development...
            </p>
          </motion.div>
        </div>

        {/* About Section */}
        <div className="relative z-10 mt-16 sm:mt-24 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-text-main">
            Built with Modern Tech
          </h2>

          <div className="flex flex-wrap justify-center gap-3 mt-8 px-4">
            {['Solidity', 'Web3.js', 'Next.js', 'IPFS', 'MetaMask'].map((tech) => (
              <div key={tech} className="px-6 py-3 bg-bg-card border border-border-main hover:border-purple-500/50 transition-colors rounded-xl">
                <span className="text-text-muted font-medium">
                  {tech}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-16 sm:mt-24 pb-8 text-center">
          <div className="bg-bg-card border border-border-main rounded-3xl p-8 max-w-4xl mx-auto">
            <p className="text-xl font-bold text-text-main mb-6">
              Made by Amar Sankar Maitra
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
              <a
                href="https://github.com/omegaopinmthechat/blockchain_projects"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-btn-bg hover:bg-btn-hover text-text-main rounded-xl font-semibold transition-all duration-300"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/amarsankarmaitra"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-semibold transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
