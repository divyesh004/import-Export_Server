const express = require('express');
const router = express.Router();
const AuthController = require('../controller/auth.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest, userValidationRules } = require('../middleware/validate');

// Register new user
router.post('/signup', 
  userValidationRules.signup, 
  validateRequest, 
  AuthController.signup
);

// Login user
router.post('/login', 
  userValidationRules.login, 
  validateRequest, 
  AuthController.login
);

// Get current user
router.get('/profile', 
  authenticateToken, 
  AuthController.getCurrentUser
);

// Update user profile
router.patch('/update', 
  authenticateToken, 
  userValidationRules.updateProfile,
  validateRequest,
  AuthController.updateProfile
);

// Get users by role (Admin only)
router.get('/role/:role', 
  authenticateToken, 
  authorizeRoles('admin'), 
  AuthController.getUsersByRole
);

// Approve seller account (Admin only)
router.patch('/approve/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  AuthController.approveSeller
);

// Forgot password
router.post('/forgot-password',
  userValidationRules.forgotPassword,
  validateRequest,
  AuthController.forgotPassword
);

// Reset password with token
router.post('/reset-password',
  userValidationRules.resetPassword,
  validateRequest,
  AuthController.resetPassword
);

// Change user role (Admin only)
router.patch('/role/change/:id',
  authenticateToken,
  authorizeRoles('admin'),
  AuthController.changeUserRole
);

// Verify token and get user info
router.get('/verify',
  authenticateToken,
  AuthController.getCurrentUser
);

module.exports = router;