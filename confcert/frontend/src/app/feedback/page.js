"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import StarBackground from "@/components/StarBackground";

const MAX_CHARS = 4000;

export default function FeedbackPage() {
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState({ type: "", message: "" });

  const remainingChars = useMemo(() => MAX_CHARS - description.length, [description]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setResult({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, description }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setResult({
          type: "error",
          message: payload?.error || "Could not send feedback. Please try again.",
        });
        return;
      }

      setResult({
        type: "success",
        message: payload?.message || "Feedback sent successfully.",
      });
      setDescription("");
    } catch (_) {
      setResult({
        type: "error",
        message: "Could not reach feedback service. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <StarBackground starCount={110} />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <section className="rounded-2xl border border-cyan-500/30 bg-linear-to-b from-slate-900 to-slate-950 p-5 shadow-[0_20px_60px_-20px_rgba(6,182,212,0.45)] sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-300 sm:text-3xl">
                Share Your Feedback
              </h1>
              <p className="mt-1 text-sm text-slate-300 sm:text-base">
                Found a bug, feature request, or improvement idea? Send it directly.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="email">
                Your Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="description">
                Feedback
              </label>
              <textarea
                id="description"
                required
                rows={7}
                maxLength={MAX_CHARS}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Write your feedback here..."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25"
              />
              <p className="mt-2 text-right text-xs text-slate-400">
                {remainingChars} characters left
              </p>
            </div>

            {result.message ? (
              <div
                className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                  result.type === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-200"
                }`}
              >
                {result.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{result.message}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-cyan-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Feedback
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}