const express = require('express');
const router = express.Router();
const PriceController = require('../controller/price.controller');
const { authenticateToken } = require('../middleware/auth');

// Route to analyze product pricing using Mistral AI
router.get('/analyze/:product_id', 
  authenticateToken, 
  PriceController.analyzeProductPrice
);

module.exports = router;