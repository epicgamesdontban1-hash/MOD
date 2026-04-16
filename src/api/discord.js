const express = require('express');
const router = express.Router();
const axios = require('axios');

// Notify Discord via webhook
async function notifyDiscord(order) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl === 'your_webhook_url_here') {
    console.log('Discord webhook not configured, skipping...');
    return;
  }

  const embed = {
    username: "Beertjie MOD Bot 🐾",
    avatar_url: "https://i.imgur.com/placeholder.png",
    embeds: [{
      title: "📦 New MOD Delivery Order!",
      description: `Beertjie has a new package to deliver! 🐕`,
      color: 0xFF6B35,
      fields: [
        { name: "🆔 Order ID", value: order.orderId, inline: true },
        { name: "👤 Customer", value: order.customerName, inline: true },
        { name: "📍 Destination", value: order.recipientAddress, inline: false },
        { name: "⚖️ Weight", value: `${order.packageWeight}kg`, inline: true },
        { name: "🚀 Service", value: order.serviceType, inline: true },
        { name: "💰 Price", value: order.price, inline: true },
        { name: "📅 Est. Delivery", value: order.estimatedDelivery, inline: true },
        { name: "📝 Description", value: order.packageDescription || "No description", inline: false }
      ],
      footer: {
        text: "MOD - Midgets Out for Delivery | Powered by Beertjie 🐾",
        icon_url: "https://i.imgur.com/placeholder.png"
      },
      timestamp: new Date().toISOString(),
      thumbnail: { url: "https://i.imgur.com/placeholder.png" }
    }]
  };

  await axios.post(webhookUrl, embed);
  console.log(`✅ Discord notified for order ${order.orderId}`);
}

// POST - Manual Discord notification
router.post('/notify', async (req, res) => {
  try {
    await notifyDiscord(req.body);
    res.json({ success: true, message: 'Discord notified! Beertjie barked! 🐾' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST - Send custom message to Discord
router.post('/message', async (req, res) => {
  const { message, title } = req.body;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'your_webhook_url_here') {
    return res.status(400).json({ success: false, message: 'Discord webhook not configured' });
  }

  try {
    await axios.post(webhookUrl, {
      username: "Beertjie MOD Bot 🐾",
      embeds: [{
        title: title || "MOD Update",
        description: message,
        color: 0xFF6B35,
        footer: { text: "MOD - Midgets Out for Delivery" },
        timestamp: new Date().toISOString()
      }]
    });
    res.json({ success: true, message: 'Message sent to Discord! 🐾' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
module.exports.notifyDiscord = notifyDiscord;
