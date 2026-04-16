const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const DB_PATH = path.join(__dirname, '../../data/packages.json');

function loadPackages() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function savePackages(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function generateId() {
  const year = new Date().getFullYear();
  const count = Object.keys(loadPackages()).length + 1;
  return `MOD-${year}-${String(count).padStart(4, '0')}`;
}

function sendEmail(to, subject, message) {
  if (!process.env.EMAIL_USER) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: `<div style="font-family:Arial;padding:20px;">${message}</div>`
  });
}

/* CREATE PACKAGE */
router.post('/create', (req, res) => {
  const data = loadPackages();
  const id = generateId();

  data[id] = {
    id,
    ...req.body,
    status: "Collected",
    statusKey: "collected",
    createdAt: new Date().toISOString(),
    timeline: [{
      date: new Date().toISOString(),
      status: "Collected",
      location: req.body.senderLocation,
      icon: "📦"
    }]
  };

  savePackages(data);
  res.json({ success: true, id });
});

/* UPDATE STAGE */
router.post('/stage/:id', (req, res) => {
  const data = loadPackages();
  const pkg = data[req.params.id];
  if (!pkg) return res.json({ success: false });

  pkg.status = req.body.status;
  pkg.statusKey = req.body.statusKey;
  pkg.timeline.push({
    date: new Date().toISOString(),
    status: req.body.status,
    location: req.body.location,
    icon: req.body.icon
  });

  savePackages(data);
  res.json({ success: true });
});

/* EDIT FIELD */
router.post('/edit/:id', (req, res) => {
  const data = loadPackages();
  const pkg = data[req.params.id];
  if (!pkg) return res.json({ success: false });

  pkg[req.body.field] = req.body.value;
  savePackages(data);

  res.json({ success: true });
});

/* DELETE */
router.delete('/delete/:id', (req, res) => {
  const data = loadPackages();
  delete data[req.params.id];
  savePackages(data);
  res.json({ success: true });
});

/* SEND EMAIL */
router.post('/email/:id', (req, res) => {
  const data = loadPackages();
  const pkg = data[req.params.id];
  if (!pkg) return res.json({ success: false });

  sendEmail(pkg.recipientEmail, req.body.subject, req.body.message);
  res.json({ success: true });
});

/* LIST ALL */
router.get('/all', (req, res) => {
  res.json(loadPackages());
});

module.exports = router;
