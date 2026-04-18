"use client";

import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/documentation",
    label: "Documentation",
    icon: BookOpen,
  },
  {
    href: "/solidity-lab",
    label: "Solidity Lab",
    icon: Code,
  },
  {
    href: "/offline-playground",
    label: "Playground download",
    icon: Download,
  },
  {
    href: "/faucet",
    label: "Get Sepolia",
    icon: Droplets,
  },
  {
    href: "/support",
    label: "Support",
    icon: Headset,
  },
];

export default function AppSidebar() {
  const pathname = usePathname() || "/";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r border-slate-700/70 bg-slate-900/95 px-3 py-4 backdrop-blur-md md:flex lg:w-64 lg:px-4">
        <div className="mb-6 flex items-center justify-center gap-2 text-slate-400 lg:justify-start">
          <Compass className="h-5 w-5" />
          <span className="hidden text-sm font-semibold tracking-wide lg:inline">
            Quick Nav
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={cn(
                  "h-10 justify-center rounded-lg border border-transparent px-2 md:w-full lg:h-11 lg:justify-start lg:px-3",
                  isActive
                    ? "border-slate-600/80 bg-slate-800 text-slate-100 ring-1 ring-amber-500/20 hover:bg-slate-700"
                    : "text-slate-400 hover:border-slate-700 hover:bg-slate-800/80 hover:text-slate-200",
                )}
              >
                <Link href={item.href} title={item.label}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-md border border-slate-600/80 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.8)]">
              <Image
                src="/final_icon.png"
                alt="Blockwave"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-100">Blockwave</p>
              <p className="text-[11px] text-slate-400">Quick Access</p>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-md border-slate-600/80 bg-slate-800 text-slate-100 hover:bg-slate-700"
                aria-label="Open quick navigation"
              >
                <Menu className="h-4 w-4" />
                <span>Quick Nav</span>
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              title="Quick navigation menu"
              className="w-72 border-r border-slate-700/80 bg-slate-900 px-4 py-6"
            >
              <div className="mb-6 flex items-center gap-2 text-slate-400">
                <Compass className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wide">Quick Nav</span>
              </div>

              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <SheetClose asChild key={item.href}>
                      <Button
                        asChild
                        variant="ghost"
                        className={cn(
                          "h-11 w-full justify-start rounded-lg border border-transparent px-3",
                          isActive
                            ? "border-slate-600/80 bg-slate-800 text-slate-100 ring-1 ring-amber-500/20 hover:bg-slate-700"
                            : "text-slate-400 hover:border-slate-700 hover:bg-slate-800/80 hover:text-slate-200",
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}