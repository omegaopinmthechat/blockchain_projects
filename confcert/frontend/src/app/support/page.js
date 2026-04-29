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
    <main className="relative min-h-screen overflow-hidden text-text-main">

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border-main bg-bg-card/70 px-4 py-2 text-sm font-medium text-text-main transition hover:bg-bg-input"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <section className="rounded-3xl border border-border-main bg-bg-card p-6 shadow-sm sm:p-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-input border border-border-main text-text-main">
              <Headset className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-main sm:text-3xl">Contact Support</h1>
              <p className="mt-1 text-sm text-text-muted sm:text-base">
                Need help with LearnChain? Send your issue and we will get back to you.
              </p>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:support@learnchain.live"
              className="rounded-2xl border border-border-main bg-bg-input/50 p-5 text-sm text-text-main transition hover:bg-bg-input hover:border-purple-500/50"
            >
              <p className="mb-2 inline-flex items-center gap-2 font-bold text-text-main">
                <Mail className="h-4 w-4" />
                Direct Support Email
              </p>
              <p className="break-all text-text-muted">support@learnchain.live</p>
            </a>

            <div className="rounded-2xl border border-border-main bg-bg-input/50 p-5 text-sm text-text-main">
              <p className="mb-2 font-bold text-text-main">Response Tips</p>
              <p className="text-text-muted">
                Add wallet address, page URL, and optional screenshot to speed up resolution.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main" htmlFor="name">
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
                  className="w-full rounded-xl border border-border-main bg-bg-input px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border-main bg-bg-input px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-main" htmlFor="subject">
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
                className="w-full rounded-xl border border-border-main bg-bg-input px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
              />
              <p className="mt-2 text-right text-xs text-text-muted">
                {MAX_SUBJECT - subject.length} characters left
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-main" htmlFor="message">
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
                className="w-full resize-y rounded-xl border border-border-main bg-bg-input px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
              />
              <p className="mt-2 text-right text-xs text-text-muted">
                {remainingChars} characters left
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-main" htmlFor="attachment">
                Optional Image (JPG, PNG, WEBP, GIF up to 2 MB)
              </label>
              <div className="rounded-xl border border-border-main bg-bg-card p-3">
                <input
                  id="attachment"
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAttachmentChange}
                  className="block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border file:border-border-main file:bg-bg-input file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-text-main hover:file:bg-bg-card"
                />

                {attachment ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border-main bg-bg-input px-3 py-2 text-sm text-text-main">
                    <Paperclip className="h-4 w-4" />
                    <span className="max-w-full truncate">{attachment.name}</span>
                    <span className="text-text-muted">({Math.ceil(attachment.size / 1024)} KB)</span>
                    <button
                      type="button"
                      onClick={resetAttachment}
                      className="ml-auto inline-flex items-center gap-1 rounded-md border border-border-main bg-bg-card px-2 py-1 text-xs text-text-main hover:bg-bg-input"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                ) : null}

                {attachmentError ? (
                  <p className="mt-2 text-sm text-red-400">{attachmentError}</p>
                ) : null}
              </div>
            </div>

            {result.type === "success" ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-green-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm">{result.message}</p>
              </div>
            ) : result.type === "error" ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{result.message}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70 sm:py-3.5 sm:text-base"
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
