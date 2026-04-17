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
const ALLOWED_ORIGIN = process.env.FEEDBACK_ALLOWED_ORIGIN || "*";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return emailPattern.test(String(value || "").trim());
}

function sanitizeText(value) {
  return String(value || "").trim();
}

// Middleware
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
  }),
);
app.use(express.json());

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

    if (cleanDescription.length > 4000) {
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
        <p><strong>User Email:</strong> ${cleanEmail}</p>
        <p><strong>Description:</strong></p>
        <p>${cleanDescription}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Feedback sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send feedback email." });
  }
});

// Start server
app.listen(PORT, () => {
  if (!MAIL_USER || !MAIL_PASS) {
    console.warn("MAIL/MAIL_PASS not set. Feedback email sending will fail.");
  }
  console.log(`Server running on http://localhost:${PORT}`);
});
