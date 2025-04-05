const express = require('express');
const router = express.Router();
const ProductController = require('../controller/product.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest, productValidationRules } = require('../middleware/validate');

// Add new product (Seller only)
router.post('/', 
  authenticateToken,
  authorizeRoles('seller'),
  productValidationRules.create,
  validateRequest,
  ProductController.createProduct
);

// Public route for approved products
router.get('/approved', ProductController.getApprovedProducts);

// Admin routes for pending and rejected products
router.get('/pending', authenticateToken, authorizeRoles('admin', 'seller'), ProductController.getPendingProducts);
router.get('/rejected', authenticateToken, authorizeRoles('admin'), ProductController.getRejectedProducts);

// Get all products
router.get('/', ProductController.getAllProducts);

// Get product by ID
router.get('/:id', ProductController.getProductById);

// Update product (Seller/Admin)
router.patch('/:id',
  authenticateToken,
  authorizeRoles('seller', 'admin'),
  productValidationRules.update,
  validateRequest,
  ProductController.updateProduct
);

// Delete product (Seller/Admin)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('seller', 'admin'),
  ProductController.deleteProduct
);

// Approve/Deny product (Admin only)
router.patch('/approve/:id',
  authenticateToken,
  authorizeRoles('admin'),
  ProductController.updateProductStatus
);

// Check product status (Public) - For real-time status updates
router.post('/check-status', ProductController.checkProductStatus);

module.exports = router;