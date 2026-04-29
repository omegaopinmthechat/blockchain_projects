"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Code,
  Download,
  Droplets,
  Headset,
  Home,
  Compass,
  Menu,
  Hexagon,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import SolidityFileExplorer from "@/components/SolidityFileExplorer";
import { buildTree } from "@/hooks/useSolidityFiles";

const navItems = [
  { href: "/",                   label: "Home",                icon: Home },
  { href: "/documentation",      label: "Documentation",       icon: BookOpen },
  { href: "/solidity-lab",       label: "Solidity Lab",        icon: Code },
  { href: "/offline-playground", label: "Playground download", icon: Download },
  { href: "/faucet",             label: "Get Sepolia",         icon: Droplets },
  { href: "/support",            label: "Support",             icon: Headset },
  { href: "/settings",           label: "Settings",            icon: Settings },
];

/* ─── helpers ───────────────────────────────────────────────────────────── */

function readFilesFromStorage() {
  try {
    const raw = localStorage.getItem("solidityLabFiles");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* ─── Single nav button ─────────────────────────────────────────────────── */
function NavBtn({ item, isActive, className }) {
  const Icon = item.icon;
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-10 justify-center rounded-xl border border-transparent px-2 md:w-full lg:h-12 lg:justify-start lg:px-4 transition-all duration-200",
        isActive
          ? "bg-[#8B5CF6] text-white font-medium"
          : "text-text-muted hover:text-text-main hover:bg-bg-card/50",
        className,
      )}
    >
      <Link href={item.href} title={item.label} className="flex items-center gap-3 w-full">
        <Icon className="h-5 w-5 shrink-0" />
        <span className="hidden lg:inline text-[15px]">{item.label}</span>
      </Link>
    </Button>
  );
}

/* ─── Sidebar file explorer state (read-only listener) ──────────────────── */
function useLabFileState(isLabPage) {
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);

  useEffect(() => {
    if (!isLabPage) return;

    function sync() {
      const f = readFilesFromStorage();
      setFiles(f);
      const active = localStorage.getItem("solidityLabActiveFile");
      const resolved =
        active && f[active] !== undefined ? active : Object.keys(f)[0] ?? null;
      setActiveFile(resolved);
    }

    sync();
    window.addEventListener("solidityFilesChanged", sync);
    return () => window.removeEventListener("solidityFilesChanged", sync);
  }, [isLabPage]);

  return { files, activeFile };
}

function dispatch(action) {
  window.dispatchEvent(new CustomEvent("solidityFileAction", { detail: action }));
}

/* ─── Inline explorer that appears under the Solidity Lab nav item ──────── */
function LabExplorer({ files, activeFile }) {
  const tree = buildTree(files);
  const existingPaths = Object.keys(files);
  return (
    <SolidityFileExplorer
      tree={tree}
      activeFile={activeFile}
      existingPaths={existingPaths}
      onOpen={(file)            => dispatch({ type: "open",         file })}
      onCreateFile={(name, dir) => dispatch({ type: "createFile",   name, dir })}
      onCreateFolder={(name, dir)=>dispatch({ type: "createFolder", name, dir })}
      onRename={(kind, path, newName) =>
        dispatch({ type: "rename", kind, path, newName })
      }
      onDelete={(kind, path)    => dispatch({ type: "delete",       kind, path })}
      onMove={(fromPath, toFolder) => dispatch({ type: "moveFile",  fromPath, toFolder })}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AppSidebar
═══════════════════════════════════════════════════════════════════════════ */
export default function AppSidebar() {
  const pathname = usePathname() || "/";
  const isLabPage =
    pathname === "/solidity-lab" || pathname.startsWith("/solidity-lab/");

  const { files, activeFile } = useLabFileState(isLabPage);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col bg-sidebar-bg px-3 py-4 md:flex lg:w-64 lg:px-4 transition-colors duration-300 border-r border-border-main overflow-y-auto">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3 text-text-main lg:justify-start">
          <Hexagon className="h-6 w-6 text-purple-500" />
          <span className="hidden text-lg font-bold tracking-wide lg:inline">LearnChain</span>
        </div>

        {/* Nav — file explorer is injected inline right after Solidity Lab */}
        <nav className="flex flex-col">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <div key={item.href}>
                <NavBtn item={item} isActive={isActive} className="mb-1" />

                {/* File Explorer — only under Solidity Lab, only on that page */}
                {item.href === "/solidity-lab" && isLabPage && (
                  <LabExplorer files={files} activeFile={activeFile} />
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-border-main bg-bg-card/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center px-3 gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 border-border-main bg-bg-main text-text-main"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              title="Navigation"
              className="w-72 border-r border-border-main bg-bg-main px-4 py-6 flex flex-col overflow-y-auto"
            >
              <div className="mb-6 flex items-center gap-2 text-text-muted">
                <Compass className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wide">Navigation</span>
              </div>

              <nav className="flex flex-col">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <div key={item.href}>
                      <SheetClose asChild>
                        <Button
                          asChild
                          variant="ghost"
                          className={cn(
                            "h-12 w-full justify-start rounded-xl border border-transparent px-4 transition-all duration-200 mb-1",
                            isActive
                              ? "bg-[#8B5CF6] text-white font-medium"
                              : "text-text-muted hover:text-text-main hover:bg-bg-card/50",
                          )}
                        >
                          <Link href={item.href} className="flex items-center gap-3 w-full">
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="text-[15px]">{item.label}</span>
                          </Link>
                        </Button>
                      </SheetClose>

                      {item.href === "/solidity-lab" && isLabPage && (
                        <LabExplorer files={files} activeFile={activeFile} />
                      )}
                    </div>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex justify-end">
            <p className="text-lg font-bold text-text-main">LearnChain</p>
          </div>
        </div>
      </div>
    </>
  );
}