const express = require('express');
const router = express.Router();

// Discord interaction webhook (for slash commands)
router.post('/discord', (req, res) => {
  const { type, data } = req.body;

  // Discord ping verification
  if (type === 1) {
    return res.json({ type: 1 });
  }

  // Handle slash commands
  if (type === 2) {
    const commandName = data.name;

    if (commandName === 'track') {
      const packageId = data.options?.[0]?.value;
      return res.json({
        type: 4,
        data: {
          content: `🐾 Tracking package **${packageId}**... Beertjie is on it! Check: ${process.env.BASE_URL}/tracking?id=${packageId}`
        }
      });
    }

    if (commandName === 'order') {
      return res.json({
        type: 4,
        data: {
          content: `📦 Ready to place an order? Visit: ${process.env.BASE_URL}/order\nBeertjie is ready to deliver! 🐕`
        }
      });
    }
  }

  res.status(400).json({ error: 'Unknown interaction type' });
});

module.exports = router;
