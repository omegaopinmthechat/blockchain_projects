import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5502;
const MAIL_USER = process.env.MAIL || process.env.mail;
const MAIL_PASS = process.env.MAIL_PASS || process.env.mail_pass;
const FEEDBACK_RECEIVER =
  process.env.FEEDBACK_RECEIVER || process.env.FEEDBACK_TO || MAIL_USER;
const SUPPORT_RECEIVER = process.env.SUPPORT_RECEIVER || FEEDBACK_RECEIVER;
const ALLOWED_ORIGIN = process.env.FEEDBACK_ALLOWED_ORIGIN || "*";
const MAX_FEEDBACK_LENGTH = 4000;
const MAX_SUPPORT_NAME_LENGTH = 120;
const MAX_SUPPORT_SUBJECT_LENGTH = 180;
const MAX_SUPPORT_MESSAGE_LENGTH = 4000;
const MAX_SUPPORT_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_SUPPORT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return emailPattern.test(String(value || "").trim());
}

function sanitizeText(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlWithBreaks(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br/>");
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

// Middleware
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
  }),
);
app.use(express.json({ limit: "8mb" }));

// Transporter
const transporter =
  MAIL_USER && MAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
      })
    : null;

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "feedback",
    mailConfigured: Boolean(MAIL_USER && MAIL_PASS),
  });
});

// API
app.post("/send-feedback", async (req, res) => {
  try {
    const { email, description } = req.body;
    const cleanEmail = sanitizeText(email);
    const cleanDescription = sanitizeText(description);

    if (!transporter || !MAIL_USER || !FEEDBACK_RECEIVER) {
      return res.status(500).json({
        error: "Mail service is not configured correctly.",
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    if (!cleanDescription) {
      return res.status(400).json({ error: "Feedback description is required." });
    }

    if (cleanDescription.length > MAX_FEEDBACK_LENGTH) {
      return res
        .status(400)
        .json({ error: "Feedback description must be 4000 characters or fewer." });
    }

    const mailOptions = {
      from: `"Feedback System" <${MAIL_USER}>`,
      replyTo: cleanEmail,
      to: FEEDBACK_RECEIVER,
      subject: "New Feedback Received",
      html: `
        <h2>New Feedback</h2>
        <p><strong>User Email:</strong> ${escapeHtml(cleanEmail)}</p>
        <p><strong>Description:</strong></p>
        <p>${escapeHtmlWithBreaks(cleanDescription)}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Feedback sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send feedback email." });
  }
});

app.post("/send-support", async (req, res) => {
  try {
    const { name, email, subject, message, attachment } = req.body;
    const cleanName = sanitizeText(name);
    const cleanEmail = sanitizeText(email);
    const cleanSubject = sanitizeText(subject) || "General Support Request";
    const cleanMessage = sanitizeText(message);
    let mailAttachments = [];

    if (!transporter || !MAIL_USER || !SUPPORT_RECEIVER) {
      return res.status(500).json({
        error: "Mail service is not configured correctly.",
      });
    }

    if (!cleanName) {
      return res.status(400).json({ error: "Name is required." });
    }

    if (cleanName.length > MAX_SUPPORT_NAME_LENGTH) {
      return res
        .status(400)
        .json({ error: "Name must be 120 characters or fewer." });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    if (cleanSubject.length > MAX_SUPPORT_SUBJECT_LENGTH) {
      return res
        .status(400)
        .json({ error: "Subject must be 180 characters or fewer." });
    }

    if (!cleanMessage) {
      return res.status(400).json({ error: "Support message is required." });
    }

    if (cleanMessage.length > MAX_SUPPORT_MESSAGE_LENGTH) {
      return res
        .status(400)
        .json({ error: "Support message must be 4000 characters or fewer." });
    }

    if (attachment != null) {
      const contentType = String(attachment?.contentType || "").trim().toLowerCase();
      const dataBase64 = String(attachment?.dataBase64 || "").trim();
      const fileName = sanitizeFilename(attachment?.fileName);

      if (!ALLOWED_SUPPORT_IMAGE_TYPES.includes(contentType)) {
        return res
          .status(400)
          .json({ error: "Attachment must be JPG, PNG, WEBP, or GIF." });
      }

      if (!/^[a-zA-Z0-9+/=\s]+$/.test(dataBase64)) {
        return res.status(400).json({ error: "Attachment format is invalid." });
      }

      const imageBytes = estimateBase64Size(dataBase64);
      if (!imageBytes || imageBytes > MAX_SUPPORT_IMAGE_BYTES) {
        return res
          .status(400)
          .json({ error: "Attachment must be 2 MB or smaller." });
      }

      mailAttachments = [
        {
          filename: fileName,
          content: dataBase64.replace(/\s/g, ""),
          encoding: "base64",
          contentType,
        },
      ];
    }

    const mailOptions = {
      from: `"Support Form" <${MAIL_USER}>`,
      replyTo: cleanEmail,
      to: SUPPORT_RECEIVER,
      subject: `Support Request: ${cleanSubject}`,
      html: `
        <h2>New Support Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
        <p><strong>Attachment:</strong> ${mailAttachments.length ? "Included" : "None"}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtmlWithBreaks(cleanMessage)}</p>
      `,
      attachments: mailAttachments,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Support request sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send support email." });
  }
});

// Start server
app.listen(PORT, () => {
  if (!MAIL_USER || !MAIL_PASS) {
    console.warn("MAIL/MAIL_PASS not set. Feedback email sending will fail.");
  }
  console.log(`Server running on http://localhost:${PORT}`);
});
