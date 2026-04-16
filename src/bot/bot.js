require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client, GatewayIntentBits } = require('discord.js');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

console.log("===== DISCORD DEBUG MODE =====");
console.log("Token exists:", !!BOT_TOKEN);
console.log("Token length:", BOT_TOKEN ? BOT_TOKEN.length : 0);
console.log("==============================");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  ws: {
    handshakeTimeout: 15000
  }
});

// 🔥 FORCE ALL ERRORS TO PRINT
client.on('error', (err) => {
  console.error("❌ CLIENT ERROR:", err);
});

client.on('shardError', (err) => {
  console.error("❌ SHARD ERROR:", err);
});

client.on('shardDisconnect', (event, id) => {
  console.error("❌ SHARD DISCONNECTED:", event, "Shard:", id);
});

client.on('shardReconnecting', (id) => {
  console.log("⚠️ SHARD RECONNECTING:", id);
});

client.on('shardReady', (id) => {
  console.log("✅ SHARD READY:", id);
});

client.on('debug', (info) => {
  console.log("🐛 DEBUG:", info);
});

process.on('unhandledRejection', (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});

process.on('uncaughtException', (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

client.once('ready', () => {
  console.log(`✅ BOT ONLINE AS ${client.user.tag}`);
});

console.log("🔌 Attempting Discord login...");
client.login(BOT_TOKEN).catch(err => {
  console.error("❌ LOGIN FAILED:", err);
});

module.exports = client;
