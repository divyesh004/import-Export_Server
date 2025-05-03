const express = require('express');
const router = express.Router();
const ProductRequestController = require('../controller/product_request.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { body } = require('express-validator');

// Validation rules for product requests
const productRequestValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('product_name').notEmpty().withMessage('Product name are required'),
  body('product_details').notEmpty().withMessage('Product details are required'),
  body('industry').optional().isString().withMessage('Industry must be a string')
];

// Create a new product request (Public route - no authentication required)
router.post('/', 
  productRequestValidationRules,
  validateRequest,
  ProductRequestController.createRequest
);

// Get all product requests (Admin only)
router.get('/',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  ProductRequestController.getAllRequests
);

// Get approved product requests (Seller only)
router.get('/approved',
  authenticateToken,
  authorizeRoles('seller'),
  ProductRequestController.getApprovedRequests
);

// Get product request by ID (Admin only)
router.get('/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  ProductRequestController.getRequestById
);

// Update product request status (Admin/Sub-admin only)
router.patch('/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
  validateRequest,
  ProductRequestController.updateStatus
);

// Delete product request (Admin only)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  ProductRequestController.deleteRequest
);

module.exports = router;