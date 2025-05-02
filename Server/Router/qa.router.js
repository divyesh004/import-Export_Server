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

// Get all questions (Admin/Sub-Admin only)
router.get('/questions/all',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.getAllQuestions
);

// Get approved questions (Seller only)
router.get('/questions/approved',
  authenticateToken,
  authorizeRoles('seller'),
  QAController.getAllQuestions
);

// Get pending questions for moderation (Admin/Sub-Admin only)
router.get('/questions/pending',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.getPendingQuestions
);

// Get pending answers for moderation (Admin/Sub-Admin only)
router.get('/answers/pending',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.getPendingAnswers
);

// Approve or reject a question (Admin/Sub-Admin only)
router.patch('/questions/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.updateQuestionStatus
);

// Approve or reject an answer (Admin/Sub-Admin only)
router.patch('/answers/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.updateAnswerStatus
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

// Delete a question (Admin and Sub-Admin)
router.delete('/questions/:id',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  QAController.deleteQuestion
);

// Delete an answer (Admin only)
router.delete('/answers/:id',
  authenticateToken,
  authorizeRoles('admin'),
  QAController.deleteAnswer
);

module.exports = router;