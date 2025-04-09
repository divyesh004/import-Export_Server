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

// Get all questions (Admin/Seller/Sub-Admin only)
router.get('/questions/all',
  authenticateToken,
  authorizeRoles('seller', 'admin', 'sub-admin'),
  QAController.getAllQuestions
);

// Get industry-specific questions (Sub-Admin only)
router.get('/questions/industry',
  authenticateToken,
  authorizeRoles('sub-admin'),
  QAController.getAllQuestions
);

// Get all questions for a product
router.get('/questions/:productId', QAController.getProductQuestions);

// Answer a question (Seller/Admin only)
router.post('/answers/:questionId',
  authenticateToken,
  authorizeRoles('seller', 'admin'),
  qaValidationRules.answer,
  validateRequest,
  QAController.createAnswer
);

// Get answers for a question
router.get('/answers/:questionId', QAController.getQuestionAnswers);

// Delete a question (Admin only)
router.delete('/questions/:id',
  authenticateToken,
  authorizeRoles('admin'),
  QAController.deleteQuestion
);

// Delete an answer (Admin only)
router.delete('/answers/:id',
  authenticateToken,
  authorizeRoles('admin'),
  QAController.deleteAnswer
);

module.exports = router;