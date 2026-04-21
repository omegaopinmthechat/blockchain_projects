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
import StarBackground from "@/components/StarBackground";

const RELEASES_LATEST_API = "/api/releases/latest";
const RELEASES_PAGE_URL =
  "https://github.com/omegaopinmthechat/blockchain_projects/releases";
const INITIAL_RELEASE_INFO = {
  versionTag: "latest",
  versionLabel: "latest",
  downloadUrl: "",
  releaseUrl: RELEASES_PAGE_URL,
};
const LEGACY_DOWNLOAD_URL =
  "https://github.com/omegaopinmthechat/blockchain_projects/releases/download/v1.0.0/Solidity.Playground.Setup.1.0.0.exe";

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
      <StarBackground starCount={120} />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <FadeUp className="mb-6">
          <Link href="/solidity-lab">
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition-all duration-300 hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
              Back to Solidity Lab
            </button>
          </Link>
        </FadeUp>

        <section className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <FadeUp delay={0.05} className="xl:col-span-7">
            <div className="rounded-3xl border-2 border-slate-700 bg-linear-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_22px_60px_-18px_rgba(0,0,0,0.65)] sm:p-8 lg:p-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/35 bg-linear-to-r from-blue-500/20 to-cyan-500/20 px-4 py-2">
                <Sparkles className="h-4 w-4 text-blue-300" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300 sm:text-sm">
                  Offline Solidity Playground
                </span>
              </div>

              <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
                Download The Desktop Playground And Build Contracts Offline
              </h1>

              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base lg:text-lg">
                Install the Windows setup and get a complete local workflow for writing Solidity,
                compiling, deploying to an in-memory EVM, and testing contract functions from one
                desktop app.
              </p>

              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                <span className="rounded-full border border-emerald-500/35 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  Version {releaseInfo.versionLabel}
                </span>
                <span className="rounded-full border border-blue-500/35 bg-blue-500/12 px-3 py-1.5 text-xs font-semibold text-blue-300">
                  Windows Installer (.exe)
                </span>
                <span className="rounded-full border border-violet-500/35 bg-violet-500/12 px-3 py-1.5 text-xs font-semibold text-violet-300">
                  In-Memory EVM
                </span>
                <span className="rounded-full border border-amber-500/35 bg-amber-500/12 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  Beta Build
                </span>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.15} className="xl:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border-2 border-slate-700 bg-linear-to-b from-slate-900/95 to-slate-950/95 p-6 shadow-[0_22px_60px_-18px_rgba(0,0,0,0.7)] sm:p-7">
              <div className="mb-5 flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-600/80 bg-slate-800 p-2 shadow-[0_12px_28px_-16px_rgba(56,189,248,0.8)]">
                  <Image
                    src="/final_icon.png"
                    alt="Solidity Playground app icon"
                    fill
                    sizes="56px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-100">Ready To Install</p>
                  <p className="text-sm text-slate-400">
                    Official {releaseInfo.versionTag} desktop setup
                  </p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Platform</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">Windows</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Package</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">.exe Setup</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Mode</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">Offline Local</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Flow</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">Compile To Test</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {releaseInfo.downloadUrl ? (
                  <a
                    href={releaseInfo.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-linear-to-r from-emerald-500 to-green-500 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_36px_-20px_rgba(34,197,94,0.8)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_42px_-20px_rgba(34,197,94,0.9)]"
                  >
                    <Download className="h-4 w-4" />
                    Download Setup {releaseInfo.versionLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/70 px-5 py-3 text-sm font-bold text-slate-400"
                  >
                    <Download className="h-4 w-4" />
                    Download Unavailable
                  </button>
                )}

                <a
                  href={releaseInfo.releaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-300 hover:bg-slate-700"
                >
                  Open Release Page
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href={LEGACY_DOWNLOAD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-600/80 bg-slate-900/70 px-5 py-2 text-xs font-semibold text-slate-300 transition-all duration-300 hover:bg-slate-800"
                >
                  Need older build? Download Setup 1.0.0
                </a>
              </div>
            </div>
          </FadeUp>
        </section>

        <FadeUp delay={0.05} className="mb-10">
          <div className="mb-6 flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-100 sm:text-3xl">Core Features</h2>
            <span className="h-px flex-1 bg-linear-to-r from-slate-600 to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.08 * index }}
                  className={`rounded-2xl border bg-linear-to-br p-5 sm:p-6 ${feature.accent}`}
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-slate-950/45">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-100">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </FadeUp>

        <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {walkthroughCards.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.12 * index }}
              className="rounded-2xl border-2 border-slate-700 bg-linear-to-b from-slate-800/90 to-slate-900/95 p-5 sm:p-6"
            >
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/35 bg-blue-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                {item.label}
              </div>

              <h3 className="text-xl font-semibold text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.summary}</p>

              <div className="mock-screen mt-4 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="h-2 w-20 rounded-full bg-slate-600/70" />
                  <span className="h-2 w-8 rounded-full bg-slate-700/80" />
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4 space-y-2 rounded-lg border border-slate-700/80 bg-slate-950/60 p-2">
                    <div className="h-2 rounded bg-cyan-500/35" />
                    <div className="h-2 rounded bg-blue-500/25" />
                    <div className="h-2 rounded bg-slate-700/80" />
                    <div className="h-10 rounded bg-slate-800/70" />
                  </div>
                  <div className="col-span-8 rounded-lg border border-slate-700/80 bg-linear-to-br from-slate-800 to-slate-900 p-2">
                    <div className="mb-2 h-2 w-28 rounded bg-violet-500/35" />
                    <div className="h-20 rounded bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.18),transparent_45%),linear-gradient(145deg,#111827,#0f172a)]" />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {item.points.map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <p className="text-sm text-slate-300">{point}</p>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </section>
      </main>

      <style jsx>{`
        .orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(50px);
          opacity: 0.38;
          animation: drift 14s ease-in-out infinite;
        }

        .orb-one {
          width: 280px;
          height: 280px;
          top: -70px;
          left: -70px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.7), rgba(56, 189, 248, 0.08));
        }

        .orb-two {
          width: 240px;
          height: 240px;
          top: 18%;
          right: -60px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.65), rgba(14, 165, 233, 0.06));
          animation-delay: 2.2s;
        }

        .orb-three {
          width: 260px;
          height: 260px;
          bottom: -95px;
          right: 22%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.45), rgba(14, 116, 144, 0.04));
          animation-delay: 4s;
        }

        .mock-screen {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 12px 28px -20px rgba(0, 0, 0, 0.8);
          animation: pulseGlow 3.8s ease-in-out infinite;
        }

        @keyframes drift {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -20px, 0) scale(1.04);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 12px 28px -20px rgba(0, 0, 0, 0.8);
          }
          50% {
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 34px -18px rgba(56, 189, 248, 0.3);
          }
        }

        @media (max-width: 640px) {
          .orb {
            opacity: 0.26;
            filter: blur(58px);
          }
        }
      `}</style>
    </div>
  );
}
