const mongoose = require('mongoose');

const ShopifyOrderSchema = new mongoose.Schema({
  shopifyOrderId: { type: String, required: true, unique: true },
  data: { type: Object, required: true }, // Commande brute Shopify
  dateReception: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShopifyOrder', ShopifyOrderSchema); 