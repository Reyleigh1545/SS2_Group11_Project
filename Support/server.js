const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kingrey1545@gmail.com",
    pass: "eenexugavqhkvwbq"
  }
});

app.post("/api/report", async (req, res) => {

  try {

    const { type, description } = req.body;

    console.log("NEW REPORT");
    console.log(type);
    console.log(description);

    const info = await transporter.sendMail({
      from: "kingrey1545@gmail.com",
      to: "kingrey1545@gmail.com",
      subject: `SkyCast Report - ${type}`,
      text: description
    });

    console.log(info);

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.post("/api/observation", (req, res) => {

  const observation = req.body;

  console.log(observation);

  res.json({
    success: true
  });

});