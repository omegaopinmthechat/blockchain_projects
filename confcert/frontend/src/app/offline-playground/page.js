"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCode2,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Wrench,
} from "lucide-react";

const RELEASES_LATEST_API = "/api/releases/latest";
const RELEASES_PAGE_URL =
  "https://github.com/omegaopinmthechat/blockchain_projects/releases";
const INITIAL_RELEASE_INFO = {
  versionTag: "latest",
  versionLabel: "latest",
  downloadUrl: "",
  releaseUrl: RELEASES_PAGE_URL,
};
const LTS_DOWNLOAD_URL =
  "https://github.com/omegaopinmthechat/blockchain_projects/releases/download/v1.1.0/Solidity.Playground.Setup.1.1.0.exe";

const featureCards = [
  {
    title: "File Workspace",
    description:
      "Open, save, and save-as .sol files directly from the left panel so your workflow stays quick and clean.",
    icon: FileCode2,
    accent: "border-cyan-500/35 from-cyan-500/15 to-blue-500/10 text-cyan-300",
  },
  {
    title: "Compile And Deploy",
    description:
      "Compile contracts, pass constructor args, and deploy into the in-memory local EVM in one click.",
    icon: Rocket,
    accent: "border-emerald-500/35 from-emerald-500/15 to-green-500/10 text-emerald-300",
  },
  {
    title: "Function Tester",
    description:
      "Select any ABI function, pass inputs, execute calls, and inspect results without switching tools.",
    icon: SlidersHorizontal,
    accent: "border-violet-500/35 from-violet-500/15 to-indigo-500/10 text-violet-300",
  },
  {
    title: "Live Terminal Feedback",
    description:
      "Track compile outputs, deploy status, and function call logs from the built-in terminal panel.",
    icon: TerminalSquare,
    accent: "border-amber-500/35 from-amber-500/15 to-yellow-500/10 text-amber-300",
  },
  {
    title: "Offline First",
    description:
      "Runs locally in Electron, so you can experiment with contracts even without internet access.",
    icon: ShieldCheck,
    accent: "border-blue-500/35 from-blue-500/15 to-sky-500/10 text-blue-300",
  },
  {
    title: "Beta Friendly",
    description:
      "Designed for learning and testing fast ideas with a minimal setup and focused developer flow.",
    icon: Wrench,
    accent: "border-pink-500/35 from-pink-500/15 to-rose-500/10 text-pink-300",
  },
];

const walkthroughCards = [
  {
    label: "Preview A",
    title: "Quick Start Screen",
    summary:
      "The startup view keeps file controls, compile/deploy actions, and terminal output visible at once.",
    points: [
      "Clear Open/Save/Safe As file actions",
      "Compile and Deploy controls above the fold",
      "Terminal logs show startup and environment messages",
    ],
  },
  {
    label: "Preview B",
    title: "Post Deploy Workflow",
    summary:
      "After deployment, contract address and function testing controls become active in the same layout.",
    points: [
      "Constructor arguments supported before deploy",
      "Active deployment card shows address and account",
      "Function tester enables quick contract interaction",
    ],
  },
];

function FadeUp({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

async function getLatestRelease() {
  const res = await fetch(RELEASES_LATEST_API, {
    cache: "no-store",
  });

  if (!res.ok) {
    return INITIAL_RELEASE_INFO;
  }

  const data = await res.json();
  const tag =
    typeof data?.versionTag === "string" && data.versionTag.trim()
      ? data.versionTag.trim()
      : INITIAL_RELEASE_INFO.versionTag;

  return {
    versionTag: tag,
    versionLabel:
      typeof data?.versionLabel === "string" && data.versionLabel.trim()
        ? data.versionLabel.trim()
        : tag.replace(/^v/i, ""),
    downloadUrl:
      typeof data?.downloadUrl === "string" ? data.downloadUrl : INITIAL_RELEASE_INFO.downloadUrl,
    releaseUrl:
      typeof data?.releaseUrl === "string" && data.releaseUrl.trim()
        ? data.releaseUrl
        : RELEASES_PAGE_URL,
  };
}

export default function OfflinePlaygroundPage() {
  const [releaseInfo, setReleaseInfo] = useState(INITIAL_RELEASE_INFO);

  useEffect(() => {
    let isActive = true;

    getLatestRelease()
      .then((latest) => {
        if (!isActive) {
          return;
        }
        setReleaseInfo(latest);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setReleaseInfo(INITIAL_RELEASE_INFO);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">


      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <FadeUp className="mb-6">
          <Link href="/solidity-lab">
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border-main bg-transparent px-5 py-2 text-sm font-medium text-text-muted transition-all duration-300 hover:bg-bg-input">
              <ArrowLeft className="h-4 w-4" />
              Back to Solidity Lab
            </button>
          </Link>
        </FadeUp>

        <section className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <FadeUp delay={0.05} className="xl:col-span-7">
            <div className="p-2 sm:p-6 lg:p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-transparent px-4 py-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-purple-400 sm:text-sm">
                  Offline Solidity Playground
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-tight text-text-main sm:text-5xl lg:text-6xl tracking-tight">
                Download The<br />Desktop Playground<br />And Build Contracts<br />Offline
              </h1>

              <p className="mb-8 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                Install the Windows setup and get a complete local workflow for writing Solidity,
                compiling, deploying to an in-memory EVM, and testing contract functions from one
                desktop app.
              </p>

            </div>
          </FadeUp>

          <FadeUp delay={0.15} className="xl:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-border-main bg-bg-card p-6 sm:p-8">
              <div className="mb-8 flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-bg-input flex items-center justify-center">
                  <Image
                    src="/final_icon.png"
                    alt="Solidity Playground app icon"
                    fill
                    sizes="56px"
                    className="object-contain p-2"
                    priority
                  />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-main">Ready To Install</p>
                  <p className="text-sm text-text-muted">
                    Official v{releaseInfo.versionLabel} desktop setup
                  </p>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border-main bg-bg-input p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Platform</p>
                  <p className="mt-1 text-sm font-medium text-text-main">Windows</p>
                </div>
                <div className="rounded-2xl border border-border-main bg-bg-input p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Package</p>
                  <p className="mt-1 text-sm font-medium text-text-main">.exe Setup</p>
                </div>
                <div className="rounded-2xl border border-border-main bg-bg-input p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Mode</p>
                  <p className="mt-1 text-sm font-medium text-text-main">Offline Local</p>
                </div>
                <div className="rounded-2xl border border-border-main bg-bg-input p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Flow</p>
                  <p className="mt-1 text-sm font-medium text-text-main">Compile To Test</p>
                </div>
              </div>

                <div className="flex flex-col gap-3">
                {releaseInfo.downloadUrl ? (
                  <a
                    href={releaseInfo.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] px-5 py-3 text-sm font-bold text-text-main transition-all duration-300"
                  >
                    <Download className="h-4 w-4" />
                    Download Setup {releaseInfo.versionLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border-main bg-bg-input px-5 py-3 text-sm font-bold text-text-muted"
                  >
                    <Download className="h-4 w-4" />
                    Download Unavailable
                  </button>
                )}

                <a
                  href={releaseInfo.releaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-main bg-transparent px-5 py-3 text-sm font-semibold text-text-muted transition-all duration-300 hover:bg-bg-input"
                >
                  Open Release Page
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-border-main bg-bg-card p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
                <p className="text-sm font-bold uppercase tracking-wider text-text-main">
                  LEGACY VERSION AVAILABLE
                </p>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-text-muted">
                <span className="font-semibold text-text-muted">Legacy:</span> Last stable older version (1.1.0) is still available but no longer actively supported.
              </p>
              <a
                href={LTS_DOWNLOAD_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border border-border-main bg-transparent px-5 py-3 text-sm font-semibold text-text-muted transition-all duration-300 hover:bg-bg-input"
              >
                <Download className="h-4 w-4" />
                Download Legacy 1.1.0
              </a>
            </div>
          </FadeUp>
        </section>

        <FadeUp delay={0.05} className="mb-12 border-t border-border-main pt-12">
          <h2 className="text-3xl font-bold text-text-main mb-8">Core Features</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              
              // Map old accents to new simplified dark styles
              let iconBg = "bg-purple-500/10";
              let iconColor = "text-purple-500";
              if (feature.title === "Compile And Deploy") {
                iconBg = "bg-green-500/10";
                iconColor = "text-green-500";
              } else if (feature.title === "Function Tester") {
                iconBg = "bg-fuchsia-500/10";
                iconColor = "text-fuchsia-500";
              } else if (feature.title === "Live Terminal Feedback") {
                iconBg = "bg-yellow-500/10";
                iconColor = "text-yellow-500";
              } else if (feature.title === "Offline First") {
                iconBg = "bg-blue-500/10";
                iconColor = "text-blue-500";
              } else if (feature.title === "Beta Friendly") {
                iconBg = "bg-pink-500/10";
                iconColor = "text-pink-500";
              }

              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.08 * index }}
                  className="rounded-3xl border border-border-main bg-bg-card p-8 hover:border-border-main transition-colors"
                >
                  <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-text-main">{feature.title}</h3>
                  <p className="text-base leading-relaxed text-text-muted">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </FadeUp>

        <section className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {walkthroughCards.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.12 * index }}
              className="rounded-3xl border border-border-main bg-bg-card p-8"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-400">
                {item.label}
              </div>

              <h3 className="text-2xl font-bold text-text-main">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-text-muted">{item.summary}</p>

              <div className="mock-screen mt-6 rounded-2xl border border-border-main bg-bg-input p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="h-2 w-20 rounded-full bg-border-main" />
                  <span className="h-2 w-8 rounded-full bg-text-muted" />
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4 space-y-2 rounded-xl border border-border-main/80 bg-bg-card p-3">
                    <div className="h-2 rounded bg-border-main" />
                    <div className="h-2 rounded bg-border-main" />
                    <div className="h-2 rounded bg-border-main" />
                    <div className="h-12 rounded bg-bg-input" />
                  </div>
                  <div className="col-span-8 rounded-xl border border-border-main/80 bg-bg-card p-3">
                    <div className="mb-3 h-2 w-28 rounded bg-border-main" />
                    <div className="h-24 rounded bg-bg-input" />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {item.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
                    <p className="text-base text-text-muted">{point}</p>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </section>
      </main>

      <style jsx>{`
        .mock-screen {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02), 0 8px 16px -8px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
