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

// Seller route for their own approved products
router.get('/seller/approved', 
  authenticateToken,
  authorizeRoles('seller'),
  ProductController.getSellerApprovedProducts
);

// Admin routes for pending and rejected products
router.get('/pending', authenticateToken, authorizeRoles('admin', 'seller'), ProductController.getPendingProducts);
router.get('/rejected', authenticateToken, authorizeRoles('admin'), ProductController.getRejectedProducts);

// Sub-Admin routes for industry-specific products
router.get('/industry/approved', authenticateToken, authorizeRoles('sub-admin'), ProductController.getIndustryApprovedProducts);
router.get('/industry/pending', authenticateToken, authorizeRoles('sub-admin'), ProductController.getIndustryPendingProducts);
router.get('/industry/rejected', authenticateToken, authorizeRoles('sub-admin'), ProductController.getIndustryRejectedProducts);

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

// Approve/Deny product (Admin and Sub-Admin)
router.patch('/approve/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  ProductController.updateProductStatus
);

// Check product status (Public) - For real-time status updates
router.post('/check-status', ProductController.checkProductStatus);

module.exports = router;