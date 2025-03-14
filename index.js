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
  "https://script.google.com/macros/s/AKfycbwyK6CkuQbxkNlM4JcHXK_VzlNzwhYuZ3nYHkcb4-VGokbklDnCgAw5sHHRld1DGuhk/exec";

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
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Connection Verified. Ready to send emails!");
  }
});

app.post("/api/contact-form-submission", async (req, res) => {
  const { name, phone, email, message, timestamp } = req.body;
  console.log(req.body);

  if (!name || !phone || !timestamp || !email) {
    return res
      .status(400)
      .json({ error: "All fields except message are required" });
  }

  const emailContent = `
    <h3>Enquiry Submission</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Mobile:</strong> ${phone}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}  
    <p><strong>Date & Time:</strong> ${timestamp}</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "akshay@ipcsglobal.com",
    subject: "Enquiry Submission",
    html: emailContent,
  };

  try {
    // Send email
    const emailResult = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", emailResult.response);

    // Send data to Google Sheets
    const sheetResponse = await axios.post(GOOGLE_SHEET_WEB_APP_URL, {
      name,
      phone,
      email,
      message, 
      timestamp,
    });

    console.log("Google Sheets Response:", sheetResponse.data);

    if (sheetResponse.data.status !== "success") {
      console.error(" Google Sheets Error:", sheetResponse.data);
      throw new Error("Failed to add data to Google Sheet");
    }

    console.log("Data successfully added to Google Sheet");

    res.status(200).json({
      message: "Form submitted, email sent, data added to Google Sheet",
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to process the request" });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running for IPCS Technologies");
});

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
