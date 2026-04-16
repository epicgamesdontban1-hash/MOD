require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Import routes
const trackingRouter = require('./src/api/tracking');
const emailRouter = require('./src/api/email');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/tracking', trackingRouter);
app.use('/api/email', emailRouter);
app.use('/api/admin', require('./src/api/admin'));
app.use('/api/admin', require('./src/api/admin'));

// Serve SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐾 MOD Website running → http://localhost:${PORT}`);
});

// Start Discord Bot
try {
  console.log(`🤖 MOD Discord Bot starting...`);
} catch (err) {
  console.log(`⚠️  Bot not started: ${err.message}`);
}

module.exports = app;
