const express = require('express');
const router = express.Router();
const ProductController = require('../controller/product.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest, productValidationRules } = require('../middleware/validate');

// ============ PUBLIC ROUTES ============

// Get all products (public can only see approved products)
router.get('/', ProductController.getAllProducts);

// Get product by ID (public can only see approved products)
router.get('/:id', ProductController.getProductById);

// Public route for approved products
router.get('/approved', ProductController.getApprovedProducts);

// Check product status (Public) - For real-time status updates
router.post('/check-status', ProductController.checkProductStatus);

// ============ SELLER ROUTES ============

// Add new product (Seller only)
router.post('/', 
  authenticateToken,
  authorizeRoles('seller'),
  productValidationRules.create,
  validateRequest,
  ProductController.createProduct
);

// Update product (Seller only)
router.patch('/:id',
  authenticateToken,
  authorizeRoles('seller'),
  productValidationRules.update,
  validateRequest,
  ProductController.updateProduct
);

// Seller route for their approved products
router.get('/seller/approved', 
  authenticateToken, 
  authorizeRoles('seller'), 
  ProductController.getSellerApprovedProducts
);

// ============ ADMIN & SUB-ADMIN ROUTES ============

// Admin routes for pending products (Admin, Sub-Admin, Seller)
router.get('/pending', 
  authenticateToken, 
  authorizeRoles('admin', 'seller', 'sub-admin'), 
  ProductController.getPendingProducts
);

// Admin routes for rejected products (Admin, Sub-Admin)
router.get('/rejected', 
  authenticateToken, 
  authorizeRoles('admin', 'sub-admin'), 
  ProductController.getRejectedProducts
);

// Sub-Admin route for industry-specific approved products
router.get('/industry/approved', 
  authenticateToken, 
  authorizeRoles('sub-admin'), 
  ProductController.getSubAdminApprovedProducts
);

// Sub-Admin route for industry-specific pending products
router.get('/industry/pending', 
  authenticateToken, 
  authorizeRoles('sub-admin'), 
  ProductController.getPendingProducts
);

// Approve/Deny product (Admin and Sub-Admin)
router.patch('/approve/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  ProductController.updateProductStatus
);

// ============ COMMON AUTHENTICATED ROUTES ============

// Delete product (Seller/Admin/Sub-Admin)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('seller', 'admin', 'sub-admin'),
  ProductController.deleteProduct
);

module.exports = router;