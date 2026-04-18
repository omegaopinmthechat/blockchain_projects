import { NextResponse } from "next/server";

const DEFAULT_FEEDBACK_URL = "http://localhost:5502";
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

function getFeedbackServiceUrl() {
  const raw =
    process.env.NEXT_PUBLIC_FEEDBACK_BACKEND_URL ||
    DEFAULT_FEEDBACK_URL;

  return raw.replace(/\/+$/, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function estimateBase64Size(base64) {
  const normalized = String(base64 || "").replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function sanitizeFilename(value) {
  const safe = String(value || "")
    .trim()
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe || "support-image";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();
    const rawAttachment = body?.attachment;
    let attachment;

    if (!name) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 },
      );
    }

    if (name.length > MAX_NAME) {
      return NextResponse.json(
        { error: "Name must be 120 characters or fewer." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: "Please enter a subject." },
        { status: 400 },
      );
    }

    if (subject.length > MAX_SUBJECT) {
      return NextResponse.json(
        { error: "Subject must be 180 characters or fewer." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Please enter your support message." },
        { status: 400 },
      );
    }

    if (message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: "Support message must be 4000 characters or fewer." },
        { status: 400 },
      );
    }

    if (rawAttachment != null) {
      const fileName = sanitizeFilename(rawAttachment?.fileName);
      const contentType = String(rawAttachment?.contentType || "").trim().toLowerCase();
      const dataBase64 = String(rawAttachment?.dataBase64 || "").trim();

      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: "Attachment must be JPG, PNG, WEBP, or GIF." },
          { status: 400 },
        );
      }

      if (!/^[a-zA-Z0-9+/=\s]+$/.test(dataBase64)) {
        return NextResponse.json(
          { error: "Attachment format is invalid." },
          { status: 400 },
        );
      }

      const imageBytes = estimateBase64Size(dataBase64);
      if (!imageBytes || imageBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Attachment must be 2 MB or smaller." },
          { status: 400 },
        );
      }

      attachment = {
        fileName,
        contentType,
        dataBase64: dataBase64.replace(/\s/g, ""),
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let upstream;
    try {
      upstream = await fetch(`${getFeedbackServiceUrl()}/send-support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, attachment }),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    let payload = {};
    try {
      payload = await upstream.json();
    } catch (_) {
      payload = {};
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            payload?.error ||
            "Support service returned an error. Please try again.",
        },
        { status: upstream.status || 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: payload?.message || "Support request sent successfully.",
    });
  } catch (error) {
    const timeoutError = error && error.name === "AbortError";

    return NextResponse.json(
      {
        error: timeoutError
          ? "Support service timed out. Please try again."
          : "Unable to send support request right now.",
      },
      { status: 500 },
    );
  }
}
