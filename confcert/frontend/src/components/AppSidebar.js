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
  Hexagon,
  Settings,
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
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function AppSidebar() {
  const pathname = usePathname() || "/";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col bg-sidebar-bg px-3 py-4 md:flex lg:w-64 lg:px-4 transition-colors duration-300 border-r border-border-main">
        <div className="mb-6 flex items-center justify-center gap-3 text-text-main lg:justify-start">
          <Hexagon className="h-6 w-6 text-purple-500" />
          <span className="hidden text-lg font-bold tracking-wide lg:inline">
            LearnChain
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
                  "h-10 justify-center rounded-xl border border-transparent px-2 md:w-full lg:h-12 lg:justify-start lg:px-4 transition-all duration-200",
                  isActive
                    ? "bg-[#8B5CF6] text-white font-medium"
                    : "text-text-muted hover:text-text-main hover:bg-bg-card/50",
                )}
              >
                <Link href={item.href} title={item.label} className="flex items-center gap-3 w-full">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:inline text-[15px]">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 border-b border-border-main bg-bg-card/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center px-3 gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 border-border-main bg-bg-main text-text-main"
                aria-label="Open quick navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              title="Quick navigation menu"
              className="w-72 border-r border-border-main bg-bg-main px-4 py-6"
            >
              <div className="mb-6 flex items-center gap-2 text-text-muted">
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
                          "h-12 w-full justify-start rounded-xl border border-transparent px-4 transition-all duration-200",
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