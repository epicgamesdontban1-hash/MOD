const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const DB_PATH = path.join(__dirname, '../../data/packages.json');

function load() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function generateId() {
  const year = new Date().getFullYear();
  const count = Object.keys(load()).length + 1;
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
    html: message
  });
}

/* GET ALL */
router.get('/all', (req,res)=> res.json(load()));

/* CREATE */
router.post('/create', (req,res)=>{
  const data = load();
  const id = req.body.customId || generateId();

  if (data[id]) return res.json({success:false, error:"ID exists"});

  data[id] = {
    id,
    sender: req.body.sender || "",
    senderLocation: req.body.senderLocation || "",
    recipientName: req.body.recipientName || "",
    recipientEmail: req.body.recipientEmail || "",
    destination: req.body.destination || "",
    weight: req.body.weight || "",
    description: req.body.description || "",
    status: "Collected",
    statusKey: "collected",
    timeline: []
  };

  save(data);
  res.json({success:true, id});
});

/* UPDATE FIELD */
router.post('/update/:id', (req,res)=>{
  const data = load();
  const pkg = data[req.params.id];
  if (!pkg) return res.json({success:false});

  Object.keys(req.body).forEach(key=>{
    pkg[key] = req.body[key];
  });

  save(data);
  res.json({success:true});
});

/* CHANGE ID */
router.post('/change-id/:id', (req,res)=>{
  const data = load();
  const pkg = data[req.params.id];
  if (!pkg) return res.json({success:false});

  const newId = req.body.newId;
  if (data[newId]) return res.json({success:false, error:"New ID exists"});

  data[newId] = {...pkg, id:newId};
  delete data[req.params.id];

  save(data);
  res.json({success:true});
});

/* ADD TIMELINE */
router.post('/timeline/:id', (req,res)=>{
  const data = load();
  const pkg = data[req.params.id];
  if (!pkg) return res.json({success:false});

  pkg.timeline.push({
    date: new Date().toISOString(),
    status: req.body.status,
    location: req.body.location,
    icon: req.body.icon || "📍"
  });

  pkg.status = req.body.status;
  pkg.statusKey = req.body.statusKey;

  save(data);
  res.json({success:true});
});

/* DELETE */
router.delete('/delete/:id',(req,res)=>{
  const data = load();
  delete data[req.params.id];
  save(data);
  res.json({success:true});
});

/* EMAIL */
router.post('/email/:id',(req,res)=>{
  const data = load();
  const pkg = data[req.params.id];
  if (!pkg) return res.json({success:false});

  sendEmail(pkg.recipientEmail, req.body.subject, req.body.message);
  res.json({success:true});
});

module.exports = router;
