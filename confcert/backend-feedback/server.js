import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5502;

// Middleware
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

// Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL, // use uppercase (best practice)
    pass: process.env.MAIL_PASS,
  },
});

// API
app.post("/send-feedback", async (req, res) => {
  try {
    const { email, description } = req.body;

    if (!email || !description) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const mailOptions = {
      from: `"Feedback System" <${process.env.MAIL}>`, 
      replyTo: email, 
      to: "work.amarsankarmaitra@gmail.com",
      subject: "New Feedback Received",
      html: `
        <h2>New Feedback</h2>
        <p><strong>User Email:</strong> ${email}</p>
        <p><strong>Description:</strong></p>
        <p>${description}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Feedback sent successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send email ❌" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
