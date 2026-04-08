const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

let otpStore = {};

// config mail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kingrey1545@gmail.com",
    pass: "eenexugavqhkvwbq"
  }
});

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

    // gửi mail
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
// verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const data = otpStore[email];

  if (!data) return res.json({ success: false });

  if (Date.now() > data.expire) return res.json({ success: false });

  if (data.otp !== otp) return res.json({ success: false });

  delete otpStore[email];

  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on port 3000"));
console.log("Send OTP API called");