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

// Get users by role (Admin and Sub-Admin)
router.get('/role/:role', 
  authenticateToken, 
  authorizeRoles('admin', 'sub-admin'), 
  AuthController.getUsersByRole
);

// Approve seller account (Admin and Sub-Admin)
router.patch('/approve/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'sub-admin'), 
  AuthController.approveSeller
);

// Ban/unban user (Admin and Sub-Admin)
router.patch('/ban/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'sub-admin'), 
  AuthController.toggleUserBan
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

// Restrict sub-admin from creating/removing admins
router.use('/role/change/:id', (req, res, next) => {
  // If user is sub-admin and trying to create an admin, block it
  if (req.user && req.user.role === 'sub-admin' && req.body.role === 'admin') {
    return res.status(403).json({ error: 'Sub-admins cannot create or modify admin accounts' });
  }
  next();
});

// Change user role (Admin and Sub-Admin)
router.patch('/role/change/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  AuthController.changeUserRole
);

// Verify token and get user info
router.get('/verify',
  authenticateToken,
  AuthController.getCurrentUser
);

module.exports = router;