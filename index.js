const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const GOOGLE_SHEET_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxitm6rWGKmJ69JIivq_sIHiTtr08q8wJWUK_E0Trk7qT78tUoCItolmTPAGGBqV8wM/exec";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error with email transporter:", error);
  } else {
    console.log("Email transporter is ready");
  }
});

app.post("/api/submitform", async (req, res) => {
  const { name, mobileNumber, email, message, timestamp } = req.body;

  if (!name || !mobileNumber || !message || !timestamp) {
    return res
      .status(400)
      .json({ error: "All fields except email are required" });
  }

  const emailContent = `
    <h3>New Form Submission Kerala</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Mobile:</strong> ${mobileNumber}</p>
    ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
        <p><strong>Message:</strong> ${message}</p>
    <p><strong>Date & Time:</strong> ${timestamp}</p>
  `;

  // Mail options
  const mailOptions = {
    from: "info@ipcsglobal.com",
    to: "ipcsglobalindia@gmail.com,dmmanager.ipcs@gmail.com",
    subject: "Lead Form Submission",
    html: emailContent,
  };

  try {
    // Send email
    const emailResult = await transporter.sendMail(mailOptions);
    console.log("Email sent:", emailResult.response);

    // Send data to Google Sheets via Apps Script Web App
    const sheetResponse = await axios.post(GOOGLE_SHEET_WEB_APP_URL, {
      name,
      mobileNumber,
      email,
      message,
      timestamp,
    });

    if (sheetResponse.data.status !== "success") {
      console.error("Google Sheets Error:", sheetResponse.data);
      throw new Error("Failed to add data to Google Sheet");
    }
    console.log("Data added to Google Sheet");

    res.status(200).json({
      message: "Form submitted, email sent, data added to Google Sheet",
    });
  } catch (error) {
    console.error("Error:", error.message || error);
    res.status(500).json({ error: "Failed to process the request" });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
