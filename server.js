require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(bodyParser.urlencoded({ extended: true }));

// Serve /public for index.html, main.js, global assets
app.use(express.static(path.join(__dirname, 'public')));

// Serve /parts so browser can fetch navbar.html and form.html
app.use('/parts', express.static(path.join(__dirname, 'parts')));

// Serve /css so partials can load their own styles
app.use('/css', express.static(path.join(__dirname, 'css')));

// ===== Multer setup for file uploads =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Make sure this folder exists
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

// ===== Serve index.html at root =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/send-email', upload.single('userImage'), (req, res) => {
    // Log the entire body to see what’s coming from the frontend
    console.log('Incoming form data:', req.body);

    const { fullName, age, address, contact, facebookName } = req.body;
    const uploadedFile = req.file;

    // Duplicate name check
    const nameKey = fullName.trim().toLowerCase();
    if (submittedNames.has(nameKey)) {
        return res.status(400).send('This name has already submitted the form.');
    }
    submittedNames.add(nameKey);

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
            console.error(error);
            res.status(500).send('Error sending email');
        } else {
            console.log('Email sent: ' + info.response);
            res.send('Form submitted and email sent successfully!');
        }
    });
});

// ===== Start server =====
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
