require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const path = require('path');
const fs = require('fs');

// ===== PACKAGE DB =====
const DB_PATH = path.join(__dirname, '../../data/packages.json');

function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
}

function loadPackages() {
  ensureDB();
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch (e) { return {}; }
}

function savePackages(packages) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(packages, null, 2));
}

function getPackage(id) {
  const packages = loadPackages();
  return packages[id.toUpperCase()] || null;
}

function createPackage(data) {
  const packages = loadPackages();
  packages[data.id] = data;
  savePackages(packages);
  return data;
}

function updatePackage(id, updates) {
  const packages = loadPackages();
  id = id.toUpperCase();
  if (!packages[id]) return null;
  packages[id] = { ...packages[id], ...updates };
  savePackages(packages);
  return packages[id];
}

function addTimelineEvent(id, event) {
  const packages = loadPackages();
  id = id.toUpperCase();
  if (!packages[id]) return null;
  if (!packages[id].timeline) packages[id].timeline = [];
  packages[id].timeline.push(event);
  savePackages(packages);
  return packages[id];
}

function deletePackage(id) {
  const packages = loadPackages();
  id = id.toUpperCase();
  if (!packages[id]) return false;
  delete packages[id];
  savePackages(packages);
  return true;
}

function generateId() {
  const year = new Date().getFullYear();
  const packages = loadPackages();
  const existing = Object.keys(packages).filter(k => k.startsWith(`MOD-${year}-`));
  const next = existing.length + 1;
  return `MOD-${year}-${String(next).padStart(4, '0')}`;
}

// ===== EMAIL =====
const nodemailer = require('nodemailer');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function createTransporter() {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') return null;
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

function baseEmailTemplate(content) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#F4F4F4; }
  .wrap { max-width:620px; margin:30px auto; }
  .hdr { background:linear-gradient(135deg,#1A1A2E,#FF6B35); padding:35px 30px; text-align:center; border-radius:16px 16px 0 0; color:white; }
  .hdr .logo { font-size:50px; margin-bottom:10px; }
  .hdr h1 { font-size:24px; font-weight:900; letter-spacing:2px; }
  .hdr p { opacity:.85; font-size:13px; margin-top:5px; }
  .body { background:white; padding:35px 30px; }
  .ftr { background:#1A1A2E; color:rgba(255,255,255,.6); text-align:center; padding:20px; font-size:12px; border-radius:0 0 16px 16px; }
  .ftr a { color:#FF6B35; text-decoration:none; }
  .btn { display:block; background:linear-gradient(135deg,#FF6B35,#FF8C42); color:white!important; text-decoration:none; padding:16px 30px; border-radius:30px; text-align:center; font-size:15px; font-weight:700; margin:25px auto; max-width:260px; }
  .id-box { background:#FFF8F5; border:2px dashed #FF6B35; border-radius:12px; padding:20px; text-align:center; margin:20px 0; }
  .id-box .lbl { font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .id-box .id { font-size:26px; font-weight:900; color:#FF6B35; letter-spacing:3px; }
  .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
  .info-table td { padding:10px 15px; border-bottom:1px solid #F3F4F6; font-size:14px; vertical-align:top; }
  .info-table td:first-child { font-weight:700; color:#999; font-size:12px; text-transform:uppercase; width:38%; }
  .info-table td:last-child { color:#1A1A2E; font-weight:600; }
  .status-box { border-radius:12px; padding:20px; text-align:center; margin:20px 0; }
  .status-box .ico { font-size:40px; margin-bottom:8px; display:block; }
  .status-box .st { font-size:20px; font-weight:900; }
  .status-box .loc { font-size:13px; opacity:.8; margin-top:5px; }
  .beertjie { background:linear-gradient(135deg,#FFF8F5,#FFF3E0); border-radius:12px; padding:20px; text-align:center; margin:20px 0; border:1px solid #FFE0CC; }
  .beertjie .dog { font-size:50px; margin-bottom:10px; }
  .beertjie p { font-style:italic; color:#666; font-size:14px; line-height:1.6; }
  .timeline-item { display:flex; gap:12px; margin-bottom:18px; align-items:flex-start; }
  .t-icon { font-size:18px; flex-shrink:0; }
  .t-status { font-weight:700; color:#1A1A2E; font-size:14px; }
  .t-loc { font-size:12px; color:#666; }
  .t-date { font-size:11px; color:#FF6B35; margin-top:2px; }
  .msg-box { background:#F9FAFB; border-radius:12px; padding:20px; margin:20px 0; border:1px solid #E5E7EB; }
  h2 { color:#1A1A2E; font-size:20px; margin-bottom:15px; }
  p { color:#444; line-height:1.7; font-size:14px; margin-bottom:12px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div class="logo">🐾</div>
    <h1>MOD DELIVERY</h1>
    <p>Midgets Out for Delivery — Powered by Beertjie</p>
  </div>
  <div class="body">${content}</div>
  <div class="ftr">
    <p>© ${new Date().getFullYear()} MOD — Midgets Out for Delivery</p>
    <p style="margin-top:5px;">Powered by Beertjie 🐾 | <a href="${BASE_URL}">Visit our website</a></p>
  </div>
</div>
</body>
</html>`;
}

function infoTable(pkg) {
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
  return `<table class="info-table">${rows.map(([l,v]) => `<tr><td>${l}</td><td>${v||'N/A'}</td></tr>`).join('')}</table>`;
}

function timelineHtml(pkg, limit = 5) {
  if (!pkg.timeline || pkg.timeline.length === 0) return '<p>No timeline events yet.</p>';
  return pkg.timeline.slice(-limit).reverse().map(t => `
    <div class="timeline-item">
      <div class="t-icon">${t.icon||'📍'}</div>
      <div>
        <div class="t-status">${t.status}</div>
        <div class="t-loc">📍 ${t.location}</div>
        <div class="t-date">🕐 ${t.date}</div>
        ${t.note ? `<div class="t-loc">💬 ${t.note}</div>` : ''}
      </div>
    </div>`).join('');
}

const STAGE_COLOR = {
  collected:'#6B7280', processing:'#6366F1', dispatched:'#3B82F6',
  in_transit:'#F59E0B', out_delivery:'#FF6B35', delivered:'#10B981',
  delayed:'#EF4444', held:'#8B5CF6', customs:'#EC4899', returned:'#DC2626'
};

async function sendTrackingEmail(pkg, type, customMsg, toEmail) {
  const transporter = createTransporter();
  if (!transporter) throw new Error('Email not configured — set EMAIL_USER and EMAIL_PASS in .env');
  const trackUrl = `${BASE_URL}/tracking?id=${pkg.id}`;
  const color = STAGE_COLOR[pkg.statusKey] || '#FF6B35';
  const lastEvent = pkg.timeline?.[pkg.timeline.length - 1] || {};
  let subject, html;

  if (type === 'confirmation') {
    subject = `📦 MOD Order Confirmed — ${pkg.id}`;
    html = baseEmailTemplate(`
      <h2>Hello ${pkg.recipientName}! 👋</h2>
      <p>Your package has been registered and Beertjie is ready to deliver!</p>
      <div class="id-box"><div class="lbl">Your Tracking Number</div><div class="id">${pkg.id}</div></div>
      ${infoTable(pkg)}
      <div class="beertjie"><div class="dog">🐕</div>
      <p>"Woof! I personally sniff-inspected your package and it passed! I promise to deliver it with maximum fluffiness and zero chewed corners!" — <strong>Beertjie</strong></p></div>
      <a href="${trackUrl}" class="btn">🔍 Track Your Package</a>
    `);
  } else if (type === 'update') {
    subject = `🔄 Package Update — ${pkg.id} — ${pkg.status}`;
    html = baseEmailTemplate(`
      <h2>Package Update, ${pkg.recipientName}!</h2>
      <p>Your MOD package has a new status update from Beertjie!</p>
      <div class="id-box"><div class="lbl">Tracking Number</div><div class="id">${pkg.id}</div></div>
      <div class="status-box" style="background:${color}22;border:2px solid ${color};">
        <span class="ico">${lastEvent.icon||'📦'}</span>
        <div class="st" style="color:${color};">${pkg.status}</div>
        <div class="loc">📍 ${pkg.lastLocation || lastEvent.location || 'N/A'}</div>
      </div>
      <h2>📋 Recent Timeline</h2>
      ${timelineHtml(pkg, 4)}
      ${infoTable(pkg)}
      <a href="${trackUrl}" class="btn">🔍 View Full Tracking</a>
    `);
  } else if (type === 'delivered') {
    subject = `✅ Package Delivered! — ${pkg.id}`;
    html = baseEmailTemplate(`
      <h2>Your Package Has Been Delivered! 🎉</h2>
      <p>Beertjie successfully completed his mission!</p>
      <div class="id-box"><div class="lbl">Delivered Package</div><div class="id">${pkg.id}</div></div>
      <div class="status-box" style="background:#D1FAE5;border:2px solid #10B981;">
        <span class="ico">✅</span>
        <div class="st" style="color:#10B981;">Successfully Delivered!</div>
        <div class="loc">📍 ${pkg.destination}</div>
      </div>
      <div class="beertjie"><div class="dog">🐕</div>
      <p>"WOOF WOOF! I did it! Package delivered safe and sound! It was an honour serving you. Please rate me 5 paw stars! 🐾🐾🐾🐾🐾" — <strong>Beertjie</strong></p></div>
      ${infoTable(pkg)}
      <a href="${trackUrl}" class="btn">📋 View Delivery Details</a>
    `);
  } else if (type === 'delay') {
    subject = `⚠️ Delivery Delay Notice — ${pkg.id}`;
    html = baseEmailTemplate(`
      <h2>Delivery Delay Notice — ${pkg.recipientName}</h2>
      <p>There has been a slight delay with your MOD delivery. Beertjie is doing his absolute best!</p>
      <div class="id-box"><div class="lbl">Affected Package</div><div class="id">${pkg.id}</div></div>
      <div class="status-box" style="background:#FEF3C7;border:2px solid #F59E0B;">
        <span class="ico">⚠️</span>
        <div class="st" style="color:#D97706;">Delivery Delayed</div>
        <div class="loc">📍 ${pkg.lastLocation || 'In transit'}</div>
      </div>
      ${customMsg ? `<div class="msg-box"><p><strong>Note:</strong> ${customMsg}</p></div>` : ''}
      ${infoTable(pkg)}
      <div class="beertjie"><div class="dog">😔</div>
      <p>"I am so sorry for the delay! My tiny legs are going as fast as they can! I won't stop until your package arrives safely." — <strong>Beertjie</strong></p></div>
      <a href="${trackUrl}" class="btn">🔍 Track Your Package</a>
    `);
  } else if (type === 'custom') {
    subject = `📬 Message from MOD Delivery — ${pkg.id}`;
    html = baseEmailTemplate(`
      <h2>Hello ${pkg.recipientName}! 🐾</h2>
      <div class="id-box"><div class="lbl">Regarding Package</div><div class="id">${pkg.id}</div></div>
      <div class="msg-box"><p style="white-space:pre-wrap;">${customMsg || 'No message provided.'}</p></div>
      ${infoTable(pkg)}
      <a href="${trackUrl}" class="btn">🔍 Track Your Package</a>
    `);
  }

  await transporter.sendMail({
    from: `"MOD Delivery 🐾" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html
  });
  console.log(`✅ ${type} email sent → ${toEmail} for ${pkg.id}`);
}

async function sendCustomEmail(to, subject, message, trackingId) {
  const transporter = createTransporter();
  if (!transporter) throw new Error('Email not configured — set EMAIL_USER and EMAIL_PASS in .env');
  const html = baseEmailTemplate(`
    <h2>Message from MOD Delivery 🐾</h2>
    ${trackingId ? `<div class="id-box"><div class="lbl">Regarding Package</div><div class="id">${trackingId}</div></div>` : ''}
    <div class="msg-box"><p style="white-space:pre-wrap;">${message}</p></div>
    ${trackingId ? `<a href="${BASE_URL}/tracking?id=${trackingId}" class="btn">🔍 Track Package</a>` : ''}
  `);
  await transporter.sendMail({
    from: `"MOD Delivery 🐾" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to, subject, html
  });
  console.log(`✅ Custom email sent → ${to}`);
}

// ===== STAGES =====
const STAGES = {
  collected:    { label:'Collected',           icon:'📦', color:0x6B7280 },
  processing:   { label:'Processing',          icon:'⚙️',  color:0x6366F1 },
  dispatched:   { label:'Dispatched',          icon:'🚀', color:0x3B82F6 },
  in_transit:   { label:'In Transit',          icon:'🚚', color:0xF59E0B },
  out_delivery: { label:'Out for Delivery',    icon:'🐾', color:0xFF6B35 },
  delivered:    { label:'Delivered',           icon:'✅', color:0x10B981 },
  delayed:      { label:'Delayed',             icon:'⚠️', color:0xEF4444 },
  held:         { label:'Held at Facility',    icon:'🏢', color:0x8B5CF6 },
  customs:      { label:'Customs Clearance',   icon:'🛃', color:0xEC4899 },
  returned:     { label:'Return to Sender',    icon:'↩️',  color:0xDC2626 }
};

// ===== ENV CHECKS =====
const OWNER_ID   = process.env.DISCORD_OWNER_ID;
const GUILD_ID   = process.env.DISCORD_GUILD_ID;
const CLIENT_ID  = process.env.DISCORD_CLIENT_ID;
const BOT_TOKEN  = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
  console.error('❌ DISCORD_BOT_TOKEN not set in .env — bot will not start');
  process.exit(0);
}
if (!OWNER_ID || OWNER_ID === 'your_discord_user_id_here') {
  console.error('❌ DISCORD_OWNER_ID not set in .env — set your Discord user ID');
  process.exit(0);
}
if (!CLIENT_ID || CLIENT_ID === 'your_client_id_here') {
  console.error('❌ DISCORD_CLIENT_ID not set in .env');
  process.exit(0);
}
if (!GUILD_ID || GUILD_ID === 'your_guild_id_here') {
  console.error('❌ DISCORD_GUILD_ID not set in .env');
  process.exit(0);
}

// ===== HELPERS =====
function isOwner(interaction) {
  return interaction.user.id === OWNER_ID;
}

function denyOwner(interaction) {
  return interaction.reply({
    content: '🐾 Only Beertjie\'s owner can use this command!',
    ephemeral: true
  });
}

function nowStr() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

// ===== COMMANDS =====
const commands = [
  // PUBLIC
  new SlashCommandBuilder()
    .setName('track')
    .setDescription('Track a MOD package by tracking number')
    .addStringOption(o =>
      o.setName('id').setDescription('Tracking number e.g. MOD-2024-0001').setRequired(true)),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all MOD bot commands'),

  // OWNER — PACKAGE MANAGEMENT
  new SlashCommandBuilder()
    .setName('create')
    .setDescription('[OWNER] Create a new package tracking number')
    .addStringOption(o => o.setName('sender_name').setDescription('Sender full name').setRequired(true))
    .addStringOption(o => o.setName('sender_location').setDescription('Sender city / country').setRequired(true))
    .addStringOption(o => o.setName('recipient_name').setDescription('Recipient full name').setRequired(true))
    .addStringOption(o => o.setName('recipient_email').setDescription('Recipient email address').setRequired(true))
    .addStringOption(o => o.setName('recipient_location').setDescription('Destination city / country').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Package description / contents').setRequired(true))
    .addStringOption(o => o.setName('weight').setDescription('Package weight e.g. 2.5kg').setRequired(true))
    .addStringOption(o => o.setName('service').setDescription('Service type').setRequired(true)
      .addChoices(
        { name: '🐾 Standard Paw Delivery', value: 'Standard Paw Delivery' },
        { name: '👃 Priority Sniff',         value: 'Priority Sniff' },
        { name: '⚡ Express Paw',            value: 'Express Paw' },
        { name: '🌍 International',          value: 'International' }
      ))
    .addStringOption(o => o.setName('custom_id').setDescription('Custom tracking ID (auto-generated if blank)').setRequired(false))
    .addStringOption(o => o.setName('est_delivery').setDescription('Estimated delivery date e.g. 2024-12-25').setRequired(false)),

  new SlashCommandBuilder()
    .setName('stage')
    .setDescription('[OWNER] Update a package stage / status')
    .addStringOption(o => o.setName('id').setDescription('Tracking number').setRequired(true))
    .addStringOption(o => o.setName('status').setDescription('New status').setRequired(true)
      .addChoices(...Object.entries(STAGES).map(([k,v]) => ({ name:`${v.icon} ${v.label}`, value:k }))))
    .addStringOption(o => o.setName('location').setDescription('Current location e.g. Johannesburg, South Africa').setRequired(true))
    .addStringOption(o => o.setName('note').setDescription('Optional note for this update').setRequired(false)),

  new SlashCommandBuilder()
    .setName('addnote')
    .setDescription('[OWNER] Add a custom timeline event to a package')
    .addStringOption(o => o.setName('id').setDescription('Tracking number').setRequired(true))
    .addStringOption(o => o.setName('event').setDescription('Event description').setRequired(true))
    .addStringOption(o => o.setName('location').setDescription('Location of the event').setRequired(true))
    .addStringOption(o => o.setName('icon').setDescription('Emoji icon for this event (default 📍)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('edit')
    .setDescription('[OWNER] Edit a field on an existing package')
    .addStringOption(o => o.setName('id').setDescription('Tracking number').setRequired(true))
    .addStringOption(o => o.setName('field').setDescription('Field to edit').setRequired(true)
      .addChoices(
        { name: 'Recipient Name',    value: 'recipientName' },
        { name: 'Recipient Email',   value: 'recipientEmail' },
        { name: 'Destination',       value: 'destination' },
        { name: 'Description',       value: 'description' },
        { name: 'Weight',            value: 'weight' },
        { name: 'Service Type',      value: 'serviceType' },
        { name: 'Estimated Delivery',value: 'estimatedDelivery' },
        { name: 'Sender Name',       value: 'sender' },
        { name: 'Sender Location',   value: 'senderLocation' }
      ))
    .addStringOption(o => o.setName('value').setDescription('New value for the field').setRequired(true)),

  new SlashCommandBuilder()
    .setName('info')
    .setDescription('[OWNER] Get full private details of a package')
    .addStringOption(o => o.setName('id').setDescription('Tracking number').setRequired(true)),

  new SlashCommandBuilder()
    .setName('list')
    .setDescription('[OWNER] List all packages with optional status filter')
    .addStringOption(o => o.setName('filter').setDescription('Filter by status (default: all)').setRequired(false)
      .addChoices(
        { name: '📦 All', value: 'all' },
        ...Object.entries(STAGES).map(([k,v]) => ({ name:`${v.icon} ${v.label}`, value:k }))
      )),

  new SlashCommandBuilder()
    .setName('delete')
    .setDescription('[OWNER] Delete a tracking entry permanently')
    .addStringOption(o => o.setName('id').setDescription('Tracking number').setRequired(true)),

  // OWNER — EMAIL
  new SlashCommandBuilder()
    .setName('sendemail')
    .setDescription('[OWNER] Send a tracking email to the recipient of a package')
    .addStringOption(o => o.setName('id').setDescription('Tracking number').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Email type to send').setRequired(true)
      .addChoices(
        { name: '📦 Order Confirmation', value: 'confirmation' },
        { name: '🔄 Status Update',      value: 'update' },
        { name: '✅ Delivered Notice',   value: 'delivered' },
        { name: '⚠️ Delay Notice',       value: 'delay' },
        { name: '💌 Custom Message',     value: 'custom' }
      ))
    .addStringOption(o => o.setName('message').setDescription('Custom message body (required for custom type, optional for others)').setRequired(false))
    .addStringOption(o => o.setName('override_email').setDescription('Send to a different email instead of the recipient on file').setRequired(false)),

  new SlashCommandBuilder()
    .setName('emailraw')
    .setDescription('[OWNER] Send a completely custom email to any address')
    .addStringOption(o => o.setName('to').setDescription('Recipient email address').setRequired(true))
    .addStringOption(o => o.setName('subject').setDescription('Email subject line').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Email body message').setRequired(true))
    .addStringOption(o => o.setName('tracking_id').setDescription('Optional tracking ID to include a tracking link').setRequired(false)),
];

// ===== CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

// ===== REGISTER COMMANDS =====
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands.map(c => c.toJSON())
    });
    console.log('✅ Slash commands registered!');
  } catch (err) {
    console.error('❌ Failed to register commands:', err.message);
  }
}

// ===== READY =====
client.once('ready', async () => {
  console.log(`🐾 MOD Bot online as ${client.user.tag}`);
  await registerCommands();
  client.user.setActivity('📦 Delivering worldwide!', { type: 3 });
});

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction.commandName;

  // ─── /track ───────────────────────────────────────────────
  if (cmd === 'track') {
    const id = interaction.options.getString('id').toUpperCase();
    const pkg = getPackage(id);

    if (!pkg) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('❌ Package Not Found')
          .setDescription(`No package found with ID \`${id}\`\nBeertjie is still sniffing around! 🐾`)
          .setFooter({ text: 'MOD — Midgets Out for Delivery' })
        ], ephemeral: true
      });
    }

    const stage = STAGES[pkg.statusKey] || { label: pkg.status || 'Unknown', icon: '📦', color: 0xFF6B35 };
    const last = pkg.timeline?.[pkg.timeline.length - 1];

    const embed = new EmbedBuilder()
      .setColor(stage.color)
      .setTitle(`${stage.icon} ${id}`)
      .setDescription(`**Status:** ${stage.icon} ${stage.label}`)
      .addFields(
        { name: '📤 From', value: `**${pkg.sender}**\n📍 ${pkg.senderLocation || 'N/A'}`, inline: true },
        { name: '📥 To',   value: `**${pkg.recipientName}**\n📍 ${pkg.destination}`,       inline: true },
        { name: '⚖️ Weight',    value: pkg.weight,      inline: true },
        { name: '🚀 Service',   value: pkg.serviceType, inline: true },
        { name: '📅 Est. Delivery', value: pkg.estimatedDelivery || 'TBD', inline: true },
        { name: '📝 Contents',  value: pkg.description, inline: false }
      )
      .setFooter({ text: `Track online → ${BASE_URL}` })
      .setTimestamp();

    if (last) {
      embed.addFields({
        name: '🕐 Latest Update',
        value: `${last.icon || '📍'} **${last.status}**\n📍 ${last.location} • 🕐 ${last.date}${last.note ? `\n💬 ${last.note}` : ''}`,
        inline: false
      });
    }

    embed.addFields({ name: '🔗 Track Online', value: `${BASE_URL}/tracking?id=${id}`, inline: false });
    return interaction.reply({ embeds: [embed] });
  }

  // ─── /help ────────────────────────────────────────────────
  if (cmd === 'help') {
    const own = isOwner(interaction);
    const embed = new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle('🐾 MOD Bot — Help')
      .setDescription('Midgets Out for Delivery — Command Reference')
      .addFields({
        name: '🌐 Public',
        value: '`/track [id]` — Track any package\n`/help` — This message',
        inline: false
      });

    if (own) {
      embed.addFields(
        {
          name: '📦 Package Management',
          value: [
            '`/create` — Create a new tracking number',
            '`/stage [id] [status] [location]` — Update stage',
            '`/addnote [id] [event] [location]` — Add timeline event',
            '`/edit [id] [field] [value]` — Edit a field',
            '`/info [id]` — Full package details',
            '`/list [filter]` — List all packages',
            '`/delete [id]` — Delete a package entry'
          ].join('\n'), inline: false
        },
        {
          name: '📧 Email',
          value: [
            '`/sendemail [id] [type]` — Email the recipient',
            '  → Types: `confirmation` `update` `delivered` `delay` `custom`',
            '`/emailraw [to] [subject] [message]` — Send any custom email'
          ].join('\n'), inline: false
        },
        {
          name: '📊 Stage Keys',
          value: Object.entries(STAGES).map(([k,v]) => `\`${k}\` ${v.icon} ${v.label}`).join('\n'),
          inline: false
        }
      );
    }

    embed.setFooter({ text: `MOD • ${BASE_URL}` }).setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ─── /create ──────────────────────────────────────────────
  if (cmd === 'create') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const customId    = interaction.options.getString('custom_id');
    const id          = customId ? customId.toUpperCase() : generateId();
    const estDelivery = interaction.options.getString('est_delivery')
      || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    if (getPackage(id)) {
      return interaction.reply({ content: `❌ ID \`${id}\` already exists!`, ephemeral: true });
    }

    const senderName     = interaction.options.getString('sender_name');
    const senderLocation = interaction.options.getString('sender_location');
    const recipientName  = interaction.options.getString('recipient_name');
    const recipientEmail = interaction.options.getString('recipient_email');
    const destination    = interaction.options.getString('recipient_location');
    const description    = interaction.options.getString('description');
    const weight         = interaction.options.getString('weight');
    const service        = interaction.options.getString('service');

    const pkg = {
      id,
      status:          'Collected',
      statusKey:       'collected',
      sender:          senderName,
      senderLocation,
      recipientName,
      recipientEmail,
      destination,
      weight,
      description,
      serviceType:     service,
      estimatedDelivery: estDelivery,
      createdAt:       new Date().toISOString(),
      lastUpdated:     new Date().toISOString(),
      lastLocation:    senderLocation,
      timeline: [{
        date:     nowStr(),
        status:   'Package Collected',
        location: senderLocation,
        icon:     '📦',
        note:     'Package collected and registered in MOD system'
      }]
    };

    createPackage(pkg);

    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('✅ Tracking Number Created!')
      .setDescription(`\`\`\`${id}\`\`\``)
      .addFields(
        { name: '📤 Sender',    value: `${senderName}\n📍 ${senderLocation}`,           inline: true },
        { name: '📥 Recipient', value: `${recipientName}\n📧 ${recipientEmail}\n📍 ${destination}`, inline: true },
        { name: '📝 Contents',  value: description,  inline: false },
        { name: '⚖️ Weight',    value: weight,        inline: true },
        { name: '🚀 Service',   value: service,       inline: true },
        { name: '📅 Est. Delivery', value: estDelivery, inline: true },
        { name: '🔗 Tracking Link', value: `${BASE_URL}/tracking?id=${id}`, inline: false }
      )
      .setFooter({ text: 'Use /stage to update • /sendemail to notify recipient' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // ─── /stage ───────────────────────────────────────────────
  if (cmd === 'stage') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const id        = interaction.options.getString('id').toUpperCase();
    const statusKey = interaction.options.getString('status');
    const location  = interaction.options.getString('location');
    const note      = interaction.options.getString('note') || '';

    const pkg = getPackage(id);
    if (!pkg) return interaction.reply({ content: `❌ Package \`${id}\` not found!`, ephemeral: true });

    const stage = STAGES[statusKey];

    addTimelineEvent(id, {
      date: nowStr(),
      status: stage.label,
      location,
      icon: stage.icon,
      note
    });

    updatePackage(id, {
      status:      stage.label,
      statusKey,
      lastUpdated: new Date().toISOString(),
      lastLocation: location
    });

    const embed = new EmbedBuilder()
      .setColor(stage.color)
      .setTitle(`${stage.icon} Stage Updated — ${id}`)
      .setDescription(`**${id}** is now **${stage.label}**`)
      .addFields(
        { name: '📍 Location', value: location,       inline: true },
        { name: '🕐 Time',     value: nowStr(),        inline: true },
        { name: '📝 Note',     value: note || 'None', inline: false },
        { name: '🔗 Track',    value: `${BASE_URL}/tracking?id=${id}`, inline: false }
      )
      .setFooter({ text: 'Use /sendemail to notify the recipient!' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // ─── /addnote ─────────────────────────────────────────────
  if (cmd === 'addnote') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const id       = interaction.options.getString('id').toUpperCase();
    const event    = interaction.options.getString('event');
    const location = interaction.options.getString('location');
    const icon     = interaction.options.getString('icon') || '📍';

    if (!getPackage(id)) return interaction.reply({ content: `❌ Package \`${id}\` not found!`, ephemeral: true });

    addTimelineEvent(id, { date: nowStr(), status: event, location, icon, note: '' });

    const embed = new EmbedBuilder()
      .setColor(0x6366F1)
      .setTitle('📝 Timeline Note Added')
      .setDescription(`Added to **${id}**`)
      .addFields(
        { name: `${icon} Event`,    value: event,    inline: false },
        { name: '📍 Location', value: location,  inline: true },
        { name: '🕐 Time',     value: nowStr(),   inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // ─── /edit ────────────────────────────────────────────────
  if (cmd === 'edit') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const id    = interaction.options.getString('id').toUpperCase();
    const field = interaction.options.getString('field');
    const value = interaction.options.getString('value');

    if (!getPackage(id)) return interaction.reply({ content: `❌ Package \`${id}\` not found!`, ephemeral: true });

    updatePackage(id, { [field]: value, lastUpdated: new Date().toISOString() });

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle('✏️ Package Updated')
        .setDescription(`**${id}**`)
        .addFields(
          { name: 'Field',     value: field, inline: true },
          { name: 'New Value', value: value, inline: true }
        )
        .setTimestamp()
      ]
    });
  }

  // ─── /info ────────────────────────────────────────────────
  if (cmd === 'info') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const id  = interaction.options.getString('id').toUpperCase();
    const pkg = getPackage(id);
    if (!pkg) return interaction.reply({ content: `❌ Package \`${id}\` not found!`, ephemeral: true });

    const stage = STAGES[pkg.statusKey] || { icon: '📦', label: pkg.status || 'Unknown', color: 0xFF6B35 };

    const embed = new EmbedBuilder()
      .setColor(stage.color)
      .setTitle(`${stage.icon} Full Info — ${id}`)
      .addFields(
        { name: '📤 Sender',    value: `${pkg.sender}\n📍 ${pkg.senderLocation || 'N/A'}`, inline: true },
        { name: '📥 Recipient', value: `${pkg.recipientName}\n📧 ${pkg.recipientEmail || 'N/A'}\n📍 ${pkg.destination}`, inline: true },
        { name: '📦 Status',    value: `${stage.icon} ${stage.label}`, inline: true },
        { name: '⚖️ Weight',    value: pkg.weight,       inline: true },
        { name: '🚀 Service',   value: pkg.serviceType,  inline: true },
        { name: '📅 Est. Delivery', value: pkg.estimatedDelivery || 'TBD', inline: true },
        { name: '📝 Description', value: pkg.description, inline: false },
        { name: '🕐 Created',   value: pkg.createdAt?.split('T')[0] || 'N/A', inline: true },
        { name: '🔄 Updated',   value: pkg.lastUpdated?.split('T')[0] || 'N/A', inline: true },
        { name: '📍 Last Location', value: pkg.lastLocation || 'N/A', inline: true }
      )
      .setTimestamp();

    if (pkg.timeline?.length) {
      const recent = pkg.timeline.slice(-5).reverse();
      embed.addFields({
        name: `📋 Timeline (last ${recent.length})`,
        value: recent.map(t =>
          `${t.icon||'📍'} **${t.status}** — 📍 ${t.location} — 🕐 ${t.date}${t.note ? `\n💬 ${t.note}` : ''}`
        ).join('\n\n'),
        inline: false
      });
    }

    embed.addFields({ name: '🔗 Public Link', value: `${BASE_URL}/tracking?id=${id}`, inline: false });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ─── /list ────────────────────────────────────────────────
  if (cmd === 'list') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const filter = interaction.options.getString('filter') || 'all';
    let pkgs = Object.values(loadPackages());
    if (filter !== 'all') pkgs = pkgs.filter(p => p.statusKey === filter);

    if (pkgs.length === 0) {
      return interaction.reply({
        content: `📭 No packages found${filter !== 'all' ? ` with status **${filter}**` : ''}.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle(`📦 MOD Packages — ${filter === 'all' ? 'All' : STAGES[filter]?.label || filter}`)
      .setDescription(`**${pkgs.length}** package${pkgs.length !== 1 ? 's' : ''} found`)
      .setTimestamp();

    pkgs.slice(0, 15).forEach(pkg => {
      const st = STAGES[pkg.statusKey] || { icon: '📦', label: pkg.status || '?' };
      embed.addFields({
        name: `${st.icon} ${pkg.id}`,
        value: `**To:** ${pkg.recipientName} — ${pkg.destination}\n**Status:** ${st.label} | **Created:** ${pkg.createdAt?.split('T')[0] || 'N/A'}`,
        inline: false
      });
    });

    if (pkgs.length > 15) embed.setFooter({ text: `Showing 15 of ${pkgs.length}. Use /info for full details.` });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ─── /delete ──────────────────────────────────────────────
  if (cmd === 'delete') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const id = interaction.options.getString('id').toUpperCase();
    const deleted = deletePackage(id);

    if (!deleted) return interaction.reply({ content: `❌ Package \`${id}\` not found!`, ephemeral: true });

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('🗑️ Package Deleted')
        .setDescription(`Tracking entry **${id}** has been permanently removed.`)
        .setTimestamp()
      ], ephemeral: true
    });
  }

  // ─── /sendemail ───────────────────────────────────────────
  if (cmd === 'sendemail') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const id            = interaction.options.getString('id').toUpperCase();
    const type          = interaction.options.getString('type');
    const message       = interaction.options.getString('message') || '';
    const overrideEmail = interaction.options.getString('override_email');

    const pkg = getPackage(id);
    if (!pkg) return interaction.reply({ content: `❌ Package \`${id}\` not found!`, ephemeral: true });

    const toEmail = overrideEmail || pkg.recipientEmail;
    if (!toEmail) return interaction.reply({ content: `❌ No email address on file for this package!\nUse \`override_email\` option to specify one.`, ephemeral: true });

    if (type === 'custom' && !message) {
      return interaction.reply({ content: `❌ Custom email type requires a \`message\`!`, ephemeral: true });
    }

    await interaction.deferReply();

    try {
      await sendTrackingEmail(pkg, type, message, toEmail);

      const typeLabel = {
        confirmation: '📦 Order Confirmation',
        update:       '🔄 Status Update',
        delivered:    '✅ Delivered Notice',
        delay:        '⚠️ Delay Notice',
        custom:       '💌 Custom Message'
      }[type];

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('📧 Email Sent!')
        .addFields(
          { name: '📬 Sent To',    value: toEmail,    inline: true },
          { name: '📦 Package',    value: id,         inline: true },
          { name: '📧 Type',       value: typeLabel,  inline: true },
          { name: '👤 Recipient',  value: pkg.recipientName, inline: true }
        )
        .setTimestamp();

      if (message) embed.addFields({ name: '💬 Message Included', value: message.substring(0, 300), inline: false });
      if (overrideEmail) embed.addFields({ name: '⚠️ Override Email Used', value: overrideEmail, inline: false });

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      return interaction.editReply({
        content: `❌ Email failed: **${err.message}**\n\nCheck EMAIL_USER and EMAIL_PASS in your .env file!`
      });
    }
  }

  // ─── /emailraw ────────────────────────────────────────────
  if (cmd === 'emailraw') {
    if (!isOwner(interaction)) return denyOwner(interaction);

    const to         = interaction.options.getString('to');
    const subject    = interaction.options.getString('subject');
    const message    = interaction.options.getString('message');
    const trackingId = interaction.options.getString('tracking_id');

    await interaction.deferReply();

    try {
      await sendCustomEmail(to, subject, message, trackingId);

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('📧 Custom Email Sent!')
        .addFields(
          { name: '📬 To',      value: to,      inline: true },
          { name: '📝 Subject', value: subject, inline: true },
          { name: '💬 Message', value: message.substring(0, 400), inline: false }
        )
        .setTimestamp();

      if (trackingId) embed.addFields({ name: '🔗 Tracking ID Included', value: trackingId, inline: true });

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      return interaction.editReply({
        content: `❌ Email failed: **${err.message}**`
      });
    }
  }
});

// ===== LOGIN =====
client.login(BOT_TOKEN).catch(err => {
  console.error('❌ Discord bot login failed:', err.message);
});

module.exports = client;
