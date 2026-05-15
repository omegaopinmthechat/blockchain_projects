import Link from "next/link";
import { Github, Linkedin, Globe } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border-main bg-bg-card">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-text-main">Learnchain</p>
            <p className="text-sm text-text-muted leading-relaxed">
              Verified blockchain projects and practical learning resources for real-world use cases.
            </p>
            <a
              href="https://iamamar.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-text-main hover:text-cyan-400 transition-colors"
            >
              <Globe className="w-4 h-4" />
              iamamar.dev
            </a>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-4">
              Explore
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <Link
                href="/documentation"
                className="text-text-muted hover:text-text-main transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/faucet"
                className="text-text-muted hover:text-text-main transition-colors"
              >
                Sepolia Faucet
              </Link>
              <Link
                href="/support"
                className="text-text-muted hover:text-text-main transition-colors"
              >
                Support
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-4">
              Connect
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://github.com/omegaopinmthechat/blockchain_projects"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/amarsankarmaitra"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border-main pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>(c) {new Date().getFullYear()} Amar Sankar Maitra. All rights reserved.</span>
          <span>Built with Solidity, Next.js, and IPFS.</span>
        </div>
      </div>
    </footer>
  );
}
