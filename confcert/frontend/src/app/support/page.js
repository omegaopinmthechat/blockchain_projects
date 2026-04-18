"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Headset,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Paperclip,
  X,
} from "lucide-react";
import StarBackground from "@/components/StarBackground";

const MAX_NAME = 120;
const MAX_SUBJECT = 180;
const MAX_MESSAGE = 4000;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function isAllowedImageType(type) {
  return ALLOWED_IMAGE_TYPES.includes(type);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read attachment."));
    reader.readAsDataURL(file);
  });
}

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState({ type: "", message: "" });
  const fileInputRef = useRef(null);

  const remainingChars = useMemo(() => MAX_MESSAGE - message.length, [message]);

  function resetAttachment() {
    setAttachment(null);
    setAttachmentError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleAttachmentChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      resetAttachment();
      return;
    }

    if (!isAllowedImageType(file.type)) {
      resetAttachment();
      setAttachmentError("Upload JPG, PNG, WEBP, or GIF images only.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      resetAttachment();
      setAttachmentError("Image must be 2 MB or smaller.");
      return;
    }

    setAttachment(file);
    setAttachmentError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setResult({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      let attachmentPayload;
      if (attachment) {
        const dataUrl = await readFileAsDataUrl(attachment);
        const commaIndex = dataUrl.indexOf(",");
        if (commaIndex < 0) {
          throw new Error("Invalid attachment format.");
        }

        attachmentPayload = {
          fileName: attachment.name,
          contentType: attachment.type,
          dataBase64: dataUrl.slice(commaIndex + 1),
        };
      }

      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          attachment: attachmentPayload,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setResult({
          type: "error",
          message: payload?.error || "Could not send support request. Please try again.",
        });
        return;
      }

      setResult({
        type: "success",
        message: payload?.message || "Support request sent successfully.",
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      resetAttachment();
    } catch (_) {
      setResult({
        type: "error",
        message: "Could not reach support service. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <StarBackground starCount={110} />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-slate-100">
              <Headset className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Contact Support</h1>
              <p className="mt-1 text-sm text-slate-300 sm:text-base">
                Need help with LearnChain? Send your issue and we will get back to you.
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <a
              href="mailto:support@learnchain.live"
              className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              <p className="mb-2 inline-flex items-center gap-2 font-semibold text-slate-100">
                <Mail className="h-4 w-4" />
                Direct Support Email
              </p>
              <p className="break-all text-slate-300">support@learnchain.live</p>
            </a>

            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200">
              <p className="mb-2 font-semibold text-slate-100">Response Tips</p>
              <p className="text-slate-300">
                Add wallet address, page URL, and optional screenshot to speed up resolution.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={MAX_NAME}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="subject">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                required
                maxLength={MAX_SUBJECT}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="What can we help you with?"
                className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-slate-500"
              />
              <p className="mt-2 text-right text-xs text-slate-400">
                {MAX_SUBJECT - subject.length} characters left
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={8}
                maxLength={MAX_MESSAGE}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full resize-y rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-slate-500"
              />
              <p className="mt-2 text-right text-xs text-slate-400">
                {remainingChars} characters left
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="attachment">
                Optional Image (JPG, PNG, WEBP, GIF up to 2 MB)
              </label>
              <div className="rounded-md border border-slate-700 bg-slate-900 p-3">
                <input
                  id="attachment"
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAttachmentChange}
                  className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border file:border-slate-600 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-200 hover:file:bg-slate-700"
                />

                {attachment ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                    <Paperclip className="h-4 w-4" />
                    <span className="max-w-full truncate">{attachment.name}</span>
                    <span className="text-slate-400">({Math.ceil(attachment.size / 1024)} KB)</span>
                    <button
                      type="button"
                      onClick={resetAttachment}
                      className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                ) : null}

                {attachmentError ? (
                  <p className="mt-2 text-xs text-rose-600">{attachmentError}</p>
                ) : null}
              </div>
            </div>

            {result.message ? (
              <div
                className={`flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Support Request
                </>
              )}
            </button>

            <p className="pt-2 text-sm text-slate-300">
              Support Email: <span className="font-semibold text-slate-100">support@learnchain.live</span>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
