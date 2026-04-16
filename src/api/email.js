const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    return null;
  }
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ===== EMAIL TEMPLATES =====
function baseTemplate(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #F4F4F4; }
      .wrapper { max-width: 620px; margin: 30px auto; }
      .header {
        background: linear-gradient(135deg, #1A1A2E 0%, #FF6B35 100%);
        padding: 35px 30px;
        text-align: center;
        border-radius: 16px 16px 0 0;
        color: white;
      }
      .header .logo { font-size: 50px; margin-bottom: 10px; }
      .header h1 { font-size: 26px; font-weight: 900; letter-spacing: 2px; }
      .header p { opacity: 0.85; font-size: 14px; margin-top: 5px; }
      .body { background: white; padding: 35px 30px; }
      .footer {
        background: #1A1A2E;
        color: rgba(255,255,255,0.6);
        text-align: center;
        padding: 20px;
        font-size: 12px;
        border-radius: 0 0 16px 16px;
      }
      .footer a { color: #FF6B35; text-decoration: none; }
      .track-btn {
        display: block;
        background: linear-gradient(135deg, #FF6B35, #FF8C42);
        color: white !important;
        text-decoration: none;
        padding: 16px 30px;
        border-radius: 30px;
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        margin: 25px auto;
        max-width: 280px;
        box-shadow: 0 4px 15px rgba(255,107,53,0.4);
      }
      .id-box {
        background: #FFF8F5;
        border: 2px dashed #FF6B35;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
      }
      .id-box .label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
      .id-box .id { font-size: 26px; font-weight: 900; color: #FF6B35; letter-spacing: 3px; }
      .info-grid { display: table; width: 100%; border-collapse: collapse; margin: 20px 0; }
      .info-row { display: table-row; }
      .info-cell { display: table-cell; padding: 10px 15px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
      .info-cell.label { font-size: 12px; font-weight: 700; color: #999; text-transform: uppercase; width: 40%; }
      .info-cell.value { font-size: 14px; color: #1A1A2E; font-weight: 600; }
      .status-banner {
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
      }
      .status-banner .icon { font-size: 40px; margin-bottom: 10px; display: block; }
      .status-banner .status { font-size: 20px; font-weight: 900; }
      .status-banner .location { font-size: 14px; opacity: 0.8; margin-top: 5px; }
      .timeline { margin: 20px 0; }
      .t-item { display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-start; }
      .t-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
      .t-body .t-status { font-weight: 700; color: #1A1A2E; font-size: 15px; }
      .t-body .t-loc { font-size: 13px; color: #666; }
      .t-body .t-date { font-size: 12px; color: #FF6B35; margin-top: 2px; }
      .beertjie-box {
        background: linear-gradient(135deg, #FFF8F5, #FFF3E0);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
        border: 1px solid #FFE0CC;
      }
      .beertjie-box .dog { font-size: 50px; margin-bottom: 10px; }
      .beertjie-box p { font-style: italic; color: #666; font-size: 14px; line-height: 1.6; }
      h2 { color: #1A1A2E; font-size: 20px; margin-bottom: 15px; }
      p { color: #444; line-height: 1.7; font-size: 14px; margin-bottom: 12px; }
      .divider { border: none; border-top: 2px solid #F3F4F6; margin: 25px 0; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <div class="logo">🐾</div>
        <h1>MOD DELIVERY</h1>
        <p>Midgets Out for Delivery — Powered by Beertjie</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} MOD — Midgets Out for Delivery</p>
        <p style="margin-top:5px;">Powered by Beertjie 🐾 | <a href="${BASE_URL}">Visit our website</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
}

function buildInfoGrid(pkg) {
  const rows = [
    ['📤 Sender', pkg.sender],
    ['📍 From', pkg.senderLocation || 'N/A'],
    ['📥 Recipient', pkg.recipientName],
    ['📍 Destination', pkg.destination],
    ['⚖️ Weight', pkg.weight],
    ['🚀 Service', pkg.serviceType],
    ['📅 Est. Delivery', pkg.estimatedDelivery || 'TBD'],
    ['📝 Description', pkg.description]
  ];
  return `
    <div class="info-grid">
      ${rows.map(([l, v]) => `
        <div class="info-row">
          <div class="info-cell label">${l}</div>
          <div class="info-cell value">${v || 'N/A'}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function buildTimeline(pkg, limit = 5) {
  if (!pkg.timeline || pkg.timeline.length === 0) return '<p>No timeline events yet.</p>';
  const events = pkg.timeline.slice(-limit).reverse();
  return `
    <div class="timeline">
      ${events.map(t => `
        <div class="t-item">
          <div class="t-icon">${t.icon || '📍'}</div>
          <div class="t-body">
            <div class="t-status">${t.status}</div>
            <div class="t-loc">📍 ${t.location}</div>
            <div class="t-date">🕐 ${t.date}</div>
            ${t.note ? `<div class="t-loc" style="margin-top:3px;">💬 ${t.note}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

const STAGE_COLORS = {
  collected:   '#6B7280',
  processing:  '#6366F1',
  dispatched:  '#3B82F6',
  in_transit:  '#F59E0B',
  out_delivery:'#FF6B35',
  delivered:   '#10B981',
  delayed:     '#EF4444',
  held:        '#8B5CF6',
  customs:     '#EC4899',
  returned:    '#DC2626'
};

// ===== MAIN SEND FUNCTION =====
async function sendTrackingEmail(pkg, type, customMsg = '', overrideEmail = null) {
  const transporter = createTransporter();
  if (!transporter) throw new Error('Email not configured in .env');

  const toEmail = overrideEmail || pkg.recipientEmail;
  if (!toEmail) throw new Error('No recipient email address');

  const trackUrl = `${BASE_URL}/tracking?id=${pkg.id}`;
  const stage = pkg.statusKey ? (STAGE_COLORS[pkg.statusKey] || '#FF6B35') : '#FF6B35';

  let subject, html;

  // ---- CONFIRMATION ----
  if (type === 'confirmation') {
    subject = `📦 Your MOD Order is Confirmed — ${pkg.id}`;
    html = baseTemplate(`
      <h2>Hello ${pkg.recipientName}! 👋</h2>
      <p>Great news! Your package has been registered in the MOD system and Beertjie is ready to deliver!</p>

      <div class="id-box">
        <div class="label">Your Tracking Number</div>
        <div class="id">${pkg.id}</div>
      </div>

      ${buildInfoGrid(pkg)}

      <div class="beertjie-box">
        <div class="dog">🐕</div>
        <p>"Woof! I personally sniff-inspected your package and it smells wonderful! I promise to deliver it with maximum fluffiness and zero chewed corners!" — <strong>Beertjie</strong></p>
      </div>

      <a href="${trackUrl}" class="track-btn">🔍 Track Your Package</a>

      <p style="text-align:center;font-size:12px;color:#999;">Keep your tracking number safe: <strong>${pkg.id}</strong></p>
    `);
  }

  // ---- STATUS UPDATE ----
  else if (type === 'update') {
    const lastEvent = pkg.timeline?.[pkg.timeline.length - 1] || {};
    subject = `🔄 Package Update — ${pkg.id} — ${pkg.status}`;
    html = baseTemplate(`
      <h2>Package Update, ${pkg.recipientName}!</h2>
      <p>Your MOD package has been updated. Here's the latest from Beertjie!</p>

      <div class="id-box">
        <div class="label">Tracking Number</div>
        <div class="id">${pkg.id}</div>
      </div>

      <div class="status-banner" style="background:${stage}22;border:2px solid ${stage};">
        <span class="icon">${lastEvent.icon || '📦'}</span>
        <div class="status" style="color:${stage};">${pkg.status}</div>
        <div class="location">📍 ${pkg.lastLocation || lastEvent.location || 'N/A'}</div>
      </div>

      <h2 style="margin-top:25px;">📋 Recent Timeline</h2>
      ${buildTimeline(pkg, 4)}

      ${buildInfoGrid(pkg)}

      <a href="${trackUrl}" class="track-btn">🔍 View Full Tracking</a>
    `);
  }

  // ---- DELIVERED ----
  else if (type === 'delivered') {
    subject = `✅ Package Delivered! — ${pkg.id}`;
    html = baseTemplate(`
      <h2>Your Package Has Been Delivered! 🎉</h2>
      <p>Beertjie successfully completed his mission! Your package has been delivered.</p>

      <div class="id-box">
        <div class="label">Delivered Package</div>
        <div class="id">${pkg.id}</div>
      </div>

      <div class="status-banner" style="background:#D1FAE5;border:2px solid #10B981;">
        <span class="icon">✅</span>
        <div class="status" style="color:#10B981;">Successfully Delivered!</div>
        <div class="location">📍 ${pkg.destination}</div>
      </div>

      <div class="beertjie-box">
        <div class="dog">🐕</div>
        <p>"WOOF WOOF! I did it! Package delivered safe and sound! It was an honour serving you. Please rate me 5 paw stars! 🐾🐾🐾🐾🐾" — <strong>Beertjie</strong></p>
      </div>

      ${buildInfoGrid(pkg)}

      <a href="${trackUrl}" class="track-btn">📋 View Delivery Details</a>

      <p style="text-align:center;color:#666;font-size:14px;">Thank you for choosing MOD! Beertjie looks forward to delivering for you again! 🐾</p>
    `);
  }

  // ---- DELAY ----
  else if (type === 'delay') {
    subject = `⚠️ Delivery Delay Notice — ${pkg.id}`;
    html = baseTemplate(`
      <h2>Delivery Update — ${pkg.recipientName}</h2>
      <p>We want to keep you informed. There has been a slight delay with your MOD delivery. Beertjie is doing his absolute best!</p>

      <div class="id-box">
        <div class="label">Affected Package</div>
        <div class="id">${pkg.id}</div>
      </div>

      <div class="status-banner" style="background:#FEF3C7;border:2px solid #F59E0B;">
        <span class="icon">⚠️</span>
        <div class="status" style="color:#D97706;">Delivery Delay</div>
        <div class="location">📍 Current location: ${pkg.lastLocation || 'In transit'}</div>
      </div>

      <p>We sincerely apologise for the inconvenience. Your package is being handled with the utmost care and Beertjie has not rested once!</p>

      ${customMsg ? `<div style="background:#FFF8F5;border-left:4px solid #FF6B35;padding:15px;border-radius:8px;margin:15px 0;"><p style="margin:0;"><strong>Additional Information:</strong><br>${customMsg}</p></div>` : ''}

      ${buildInfoGrid(pkg)}

      <a href="${trackUrl}" class="track-btn">🔍 Track Your Package</a>

      <div class="beertjie-box">
        <div class="dog">😔</div>
        <p>"I am so sorry for the delay! My tiny legs are going as fast as they can! I promise I won't stop until your package is delivered safely." — <strong>Beertjie</strong></p>
      </div>
    `);
  }

  // ---- CUSTOM ----
  else if (type === 'custom') {
    subject = `📬 Message from MOD Delivery — ${pkg.id}`;
    html = baseTemplate(`
      <h2>Hello ${pkg.recipientName}! 🐾</h2>

      <div class="id-box">
        <div class="label">Regarding Package</div>
        <div class="id">${pkg.id}</div>
      </div>

      <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #E5E7EB;">
        <p style="white-space:pre-wrap;">${customMsg || 'No message provided.'}</p>
      </div>

      ${buildInfoGrid(pkg)}

      <a href="${trackUrl}" class="track-btn">🔍 Track Your Package</a>
    `);
  }

  await transporter.sendMail({
    from: `"MOD Delivery 🐾" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html
  });

  console.log(`✅ ${type} email sent to ${toEmail} for package ${pkg.id}`);
}

// ===== CUSTOM RAW EMAIL =====
async function sendCustomEmail(to, subject, message, trackingId = null) {
  const transporter = createTransporter();
  if (!transporter) throw new Error('Email not configured in .env');

  const trackLink = trackingId
    ? `<p style="text-align:center;"><a href="${BASE_URL}/tracking?id=${trackingId}" style="color:#FF6B35;font-weight:700;">🔍 Track Package: ${trackingId}</a></p>`
    : '';

  const html = baseTemplate(`
    <h2>Message from MOD Delivery 🐾</h2>

    ${trackingId ? `
    <div class="id-box">
      <div class="label">Regarding Package</div>
      <div class="id">${trackingId}</div>
    </div>
    ` : ''}

    <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #E5E7EB;min-height:100px;">
      <p style="white-space:pre-wrap;margin:0;">${message}</p>
    </div>

    ${trackLink}
  `);

  await transporter.sendMail({
    from: `"MOD Delivery 🐾" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });

  console.log(`✅ Custom email sent to ${to}`);
}

// ===== CONTACT FORM ROUTE (website) =====
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const transporter = createTransporter();
  if (!transporter) {
    return res.json({ success: true, message: 'Message received! (Email not configured in demo mode)' });
  }

  try {
    await transporter.sendMail({
      from: `"MOD Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `MOD Contact: ${subject || 'General'} — from ${name}`,
      html: baseTemplate(`
        <h2>New Contact Form Message</h2>
        <div class="info-grid">
          <div class="info-row"><div class="info-cell label">Name</div><div class="info-cell value">${name}</div></div>
          <div class="info-row"><div class="info-cell label">Email</div><div class="info-cell value">${email}</div></div>
          <div class="info-row"><div class="info-cell label">Subject</div><div class="info-cell value">${subject || 'N/A'}</div></div>
        </div>
        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="white-space:pre-wrap;margin:0;">${message}</p>
        </div>
      `)
    });
    res.json({ success: true, message: 'Message sent! Beertjie will get back to you! 🐾' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
module.exports.sendTrackingEmail = sendTrackingEmail;
module.exports.sendCustomEmail = sendCustomEmail;
