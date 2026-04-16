const express = require('express');
const router = express.Router();
const { sendOrderConfirmation } = require('./email');
const { notifyDiscord } = require('./discord');

const orders = [];

// GET - All orders
router.get('/', (req, res) => {
  res.json({ success: true, orders, total: orders.length });
});

// POST - Place new order
router.post('/place', async (req, res) => {
  const {
    customerName,
    customerEmail,
    senderAddress,
    recipientName,
    recipientEmail,
    recipientAddress,
    packageWeight,
    packageDescription,
    serviceType,
    specialInstructions
  } = req.body;

  if (!customerName || !customerEmail || !recipientAddress || !packageWeight) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Beertjie needs all the details!'
    });
  }

  const orderId = `MOD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const order = {
    orderId,
    customerName,
    customerEmail,
    senderAddress,
    recipientName,
    recipientEmail,
    recipientAddress,
    packageWeight,
    packageDescription,
    serviceType: serviceType || 'Standard Paw Delivery',
    specialInstructions,
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    price: calculatePrice(packageWeight, serviceType)
  };

  orders.push(order);

  // Send confirmation email
  try {
    await sendOrderConfirmation(order);
  } catch (err) {
    console.log('Email notification failed:', err.message);
  }

  // Notify Discord
  try {
    await notifyDiscord(order);
  } catch (err) {
    console.log('Discord notification failed:', err.message);
  }

  res.json({
    success: true,
    order,
    message: `Order placed! Beertjie is already excited to deliver! 🐾📦`
  });
});

function calculatePrice(weight, serviceType) {
  const basePrice = 50;
  const weightPrice = parseFloat(weight) * 15;
  const serviceMultiplier = serviceType === 'Express Paw' ? 2 : serviceType === 'Priority Sniff' ? 1.5 : 1;
  return `R${((basePrice + weightPrice) * serviceMultiplier).toFixed(2)}`;
}

module.exports = router;
