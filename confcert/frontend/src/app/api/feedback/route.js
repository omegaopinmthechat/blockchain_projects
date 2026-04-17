import { NextResponse } from "next/server";

const DEFAULT_FEEDBACK_URL = "http://localhost:5502";

function getFeedbackServiceUrl() {
  const raw =
    process.env.FEEDBACK_BACKEND_URL ||
    process.env.NEXT_PUBLIC_FEEDBACK_BACKEND_URL ||
    DEFAULT_FEEDBACK_URL;

  return raw.replace(/\/+$/, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const description = String(body?.description || "").trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "Please enter your feedback." },
        { status: 400 },
      );
    }

    if (description.length > 4000) {
      return NextResponse.json(
        { error: "Feedback must be 4000 characters or fewer." },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let upstream;
    try {
      upstream = await fetch(`${getFeedbackServiceUrl()}/send-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, description }),
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
            "Feedback service returned an error. Please try again.",
        },
        { status: upstream.status || 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: payload?.message || "Feedback sent successfully.",
    });
  } catch (error) {
    const timeoutError = error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: timeoutError
          ? "Feedback service timed out. Please try again."
          : "Unable to send feedback right now.",
      },
      { status: 500 },
    );
  }
}