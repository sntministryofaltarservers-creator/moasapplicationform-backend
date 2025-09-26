require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Ensure uploads folder exists =====
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ===== Multer setup for file uploads =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ===== Nodemailer transporter =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== In-memory store for submitted names =====
const submittedNames = new Set();

// ===== API Endpoint =====
app.post('/send-email', upload.single('userImage'), (req, res) => {
  const { fullName, age, address, contact, facebookName } = req.body;
  const uploadedFile = req.file;

  const nameKey = fullName.trim().toLowerCase();
  console.log('Checking name:', nameKey);

  if (submittedNames.has(nameKey)) {
    console.log('Duplicate submission detected.');
    return res.status(400).send('This name has already submitted the form.');
  }

  // Build email content
  let htmlContent = `
    <h2>New Form Submission</h2>
    <p><strong>Name:</strong> ${fullName}</p>
    <p><strong>Age:</strong> ${age}</p>
    <p><strong>Address:</strong> ${address}</p>
    <p><strong>Contact:</strong> ${contact}</p>
    <p><strong>Facebook Name:</strong> ${facebookName}</p>
  `;

  const attachments = [];
  if (uploadedFile) {
    htmlContent += `
      <p><strong>Uploaded Photo:</strong></p>
      <img src="cid:userPhoto" style="max-width:300px; border-radius:8px;">
    `;
    attachments.push({
      filename: uploadedFile.originalname,
      path: uploadedFile.path,
      cid: 'userPhoto'
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: 'New Form Submission',
    html: htmlContent,
    attachments
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Email error:', error);
      return res.status(500).send('Error sending email');
    }

    console.log('Email sent:', info.response);
    submittedNames.add(nameKey); // ✅ Only mark as submitted after success
    res.send('Form submitted and email sent successfully!');
  });
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
