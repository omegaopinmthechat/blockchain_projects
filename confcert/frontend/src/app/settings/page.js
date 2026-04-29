"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Check current theme from html class or local storage
    if (document.documentElement.classList.contains("light")) {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text-main"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-text-main">Settings</h1>
          <p className="mt-2 text-text-muted">
            Manage your application preferences and appearance.
          </p>
        </div>

        <div className="space-y-12">
          {/* Theme Section */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-text-main">Appearance</h2>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <button
                onClick={() => toggleTheme("dark")}
                className={`flex flex-1 items-center justify-center gap-3 rounded-xl border p-4 transition-all ${
                  theme === "dark"
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-border-main bg-bg-card text-text-muted hover:border-text-muted hover:text-text-main"
                }`}
              >
                <Moon className="h-5 w-5" />
                <span className="font-semibold">Dark</span>
              </button>

              <button
                onClick={() => toggleTheme("light")}
                className={`flex flex-1 items-center justify-center gap-3 rounded-xl border p-4 transition-all ${
                  theme === "light"
                    ? "border-purple-500 bg-purple-500/10 text-purple-600"
                    : "border-border-main bg-bg-card text-text-muted hover:border-text-muted hover:text-text-main"
                }`}
              >
                <Sun className="h-5 w-5" />
                <span className="font-semibold">Light</span>
              </button>
            </div>
            <p className="mt-3 text-sm text-text-muted">
              Choose your preferred interface theme.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
