const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const MONGO_CONN = process.env.MONGO_CONN;

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_CONN, { dbName: 'Registerations' })
  .then(() => console.log('Connection to Registerations Done!'))
  .catch(err => console.log(err));

// Define User Schema and Model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  contactno: String,
  college: String,
  yds: String,
  events: [String]
});

const userModel = mongoose.model('participants', userSchema);

// Endpoint to create user
app.post('/create-user', (req, res) => {
  const userData = req.body;

  userModel.create(userData)
    .then(() => {
      console.log('Data Registered');

      // Send confirmation email
      sendConfirmationEmail(userData.email, userData.name)
        .then(() => {
          res.status(201).json({ message: 'Registered Successfully' });
        })
        .catch(err => {
          console.error('Error sending email:', err);
          res.status(201).json({ message: 'Registered Successfully, but failed to send confirmation email.' });
        });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

// Function to send confirmation email
async function sendConfirmationEmail(toEmail, name) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS 
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Registration Confirmation',
    text: `Dear ${name},\n\nThank you for registering!\n\nWe will get back to you if your application is accepted.\n\nBest regards,\nNDLI SEC`
  };

  return transporter.sendMail(mailOptions);
}

// Fallback route to serve index.html in case the root is requested
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000; // Use PORT from environment or default to 5000
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
