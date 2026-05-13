const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

// ================= OTP STORE =================
let otpStore = {};

// ================= MAIL CONFIG =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kingrey1545@gmail.com",
    pass: "eenexugavqhkvwbq"
  }
});

// ================= REPORT API =================
app.post("/api/report", async (req, res) => {
  try {
    const { type, description } = req.body;

    console.log("NEW REPORT");
    console.log(type);
    console.log(description);

    await transporter.sendMail({
      from: "kingrey1545@gmail.com",
      to: "kingrey1545@gmail.com",
      subject: `SkyCast Report - ${type}`,
      text: description
    });

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ================= OBSERVATION API =================
app.post("/api/observation", (req, res) => {
  const observation = req.body;

  console.log("NEW OBSERVATION");
  console.log(observation);

  res.json({ success: true });
});

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp,
      expire: Date.now() + 5 * 60 * 1000
    };

    await transporter.sendMail({
      from: '"SkyCast" <kingrey1545@gmail.com>',
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP Code</h2>
        <p>Use this code to verify your account:</p>
        <h1 style="color:#2196f3">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `
    });

    console.log("OTP sent to:", email);

    res.json({ success: true });

  } catch (err) {
    console.error("MAIL ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const data = otpStore[email];

  if (!data) return res.json({ success: false });
  if (Date.now() > data.expire) return res.json({ success: false });
  if (data.otp !== otp) return res.json({ success: false });

  delete otpStore[email];

  res.json({ success: true });
});

// ================= START SERVER =================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});