const express = require('express');
const router = express.Router();
const OrderController = require('../controller/order.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest, orderValidationRules } = require('../middleware/validate');

// Create new order
router.post('/',
  authenticateToken,
  orderValidationRules.create,
  validateRequest,
  OrderController.createOrder
);

// Get all orders (Admin and Sub-Admin)
router.get('/all',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  OrderController.getAllOrders
);

// Get user's orders (Buyer/Seller)
router.get('/',
  authenticateToken,
  OrderController.getUserOrders
);

// Get order by ID
router.get('/:id',
  authenticateToken,
  OrderController.getOrderById
);

// Update order status (Seller/Admin/Sub-Admin)
router.patch('/:id/status',
  authenticateToken,
  authorizeRoles('seller', 'admin', 'sub-admin'),
  OrderController.updateOrderStatus
);

// Cancel order (Buyer/Admin/Sub-Admin)
router.patch('/:id/cancel',
  authenticateToken,
  authorizeRoles('buyer', 'admin', 'sub-admin'),
  OrderController.cancelOrder
);

// Get order analytics (Admin and Sub-Admin)
router.get('/analytics',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  OrderController.getOrderAnalytics
);

module.exports = router;