const express = require('express');
const router = express.Router();
const CartController = require('../controller/cart.controller');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, cartValidationRules } = require('../middleware/validate');

// Add item to cart
router.post('/',
  authenticateToken,
  cartValidationRules.addItem,
  validateRequest,
  CartController.addToCart
);

// Get user's cart
router.get('/',
  authenticateToken,
  CartController.getUserCart
);

// Remove item from cart
router.delete('/:id',
  authenticateToken,
  CartController.removeFromCart
);

// Update cart item quantity
router.patch('/:id',
  authenticateToken,
  CartController.updateQuantity
);

// Checkout process
router.post('/checkout',
  authenticateToken,
  CartController.checkout
);

module.exports = router;