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

// Get all orders (Admin/Sub-Admin)
router.get('/all',
  authenticateToken,
  authorizeRoles('admin', 'sub_admin'),
  OrderController.getAllOrders
);

// Get user's orders (Buyer/Seller)
router.get('/',
  authenticateToken,
  OrderController.getUserOrders
);

// Get order analytics (Admin only)
router.get('/analytics',
  authenticateToken,
  authorizeRoles('admin'),
  OrderController.getOrderAnalytics
);

// Get order by ID
router.get('/:id',
  authenticateToken,
  OrderController.getOrderById
);

// Update order status (Seller/Admin/Buyer)
router.patch('/:id',
  authenticateToken,
  authorizeRoles('seller', 'admin'),
  orderValidationRules.updateStatus,
  validateRequest,
  OrderController.updateOrderStatus
);

// Approve or reject order (Admin/Sub-Admin only)
router.patch('/:id/approve-reject',
  authenticateToken,
  authorizeRoles('admin', 'sub_admin'),
  orderValidationRules.approveReject,
  validateRequest,
  OrderController.approveRejectOrder
);

// Seller confirm order and add fulfillment details
router.patch('/:id/confirm',
  authenticateToken,
  authorizeRoles('seller'),
  orderValidationRules.confirmOrder,
  validateRequest,
  OrderController.confirmOrder
);

// Cancel order (Buyer/Admin)
router.patch('/:id/cancel',
  authenticateToken,
  authorizeRoles('buyer', 'admin'),
  orderValidationRules.cancelOrder,
  validateRequest,
  OrderController.cancelOrder
);

module.exports = router;