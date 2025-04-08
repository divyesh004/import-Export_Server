const express = require('express');
const router = express.Router();
const QAController = require('../controller/qa.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest, qaValidationRules } = require('../middleware/validate');

// Submit a question (Buyer only)
router.post('/questions',
  authenticateToken,
  authorizeRoles('customer'),
  qaValidationRules.question,
  validateRequest,
  QAController.createQuestion
);

// Get user's own questions (Customer only)
router.get('/questions',
  authenticateToken,
  authorizeRoles('customer'),
  QAController.getUserQuestions
);

// Get all questions (Admin/Sub-Admin/Seller only)
router.get('/questions/all',
  authenticateToken,
  authorizeRoles('seller', 'admin', 'sub-admin'),
  QAController.getAllQuestions
);

// Get all questions for a product
router.get('/questions/:productId', QAController.getProductQuestions);

// Answer a question (Seller/Admin/Sub-Admin only)
router.post('/answers/:questionId',
  authenticateToken,
  authorizeRoles('seller', 'admin', 'sub-admin'),
  qaValidationRules.answer,
  validateRequest,
  QAController.createAnswer
);

// Get answers for a question
router.get('/answers/:questionId', QAController.getQuestionAnswers);

// Delete a question (Admin and Sub-Admin only)
router.delete('/questions/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.deleteQuestion
);

// Delete an answer (Admin and Sub-Admin only)
router.delete('/answers/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.deleteAnswer
);

module.exports = router;