const QAModel = require('../model/qa.model');

class QAController {
  // Get all questions (Admin/Seller/Sub-Admin only)
  static async getAllQuestions(req, res) {
    try {
      // Default to showing all questions for admins, but can filter by status
      const status = req.query.status || null;
      
      // For sellers, only show approved questions regardless of the status query parameter
      const effectiveStatus = (req.user.role === 'seller') ? 'approved' : status;
      
      const questions = await QAModel.getAllQuestions(req.user.id, req.user.role, req.user.industry, effectiveStatus);
      
      // Add informational message for sellers
      if (req.user.role === 'seller') {
        return res.json({
          message: 'Showing only questions that have been approved by administrators.',
          questions: questions
        });
      }
      
      res.json(questions);
    } catch (error) {
      console.error('Error getting all questions:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }
  
  // Get pending questions for moderation (Admin/Sub-Admin only)
  static async getPendingQuestions(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Admin or sub-admin only.' });
      }

      const questions = await QAModel.getPendingQuestions(req.user.id, req.user.role, req.user.industry);
      res.json(questions);
    } catch (error) {
      console.error('Error getting pending questions:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }
  
  // Get pending answers for moderation (Admin/Sub-Admin only)
  static async getPendingAnswers(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Admin or sub-admin only.' });
      }

      const answers = await QAModel.getPendingAnswers(req.user.id, req.user.role, req.user.industry);
      res.json(answers);
    } catch (error) {
      console.error('Error getting pending answers:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Submit a question (Buyer only)
  static async createQuestion(req, res) {
    try {
      const question = await QAModel.createQuestion(req.body, req.user.id);
      res.status(201).json({
        ...question,
        message: 'Your question has been submitted and is pending approval by an administrator. Once approved, it will be visible to the seller.'
      });
    } catch (error) {
      console.error('Error creating question:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Get all questions for a product
  static async getProductQuestions(req, res) {
    try {
      const questions = await QAModel.getProductQuestions(req.params.productId);
      res.json(questions);
    } catch (error) {
      console.error('Error getting product questions:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Answer a question (Seller/Admin only)
  static async createAnswer(req, res) {
    try {
      const answer = await QAModel.createAnswer(req.params.questionId, req.user.id, req.body.answer);
      res.status(201).json({
        ...answer,
        message: 'Your answer has been submitted and is pending approval by an administrator. Once approved, it will be visible to the customer.'
      });
    } catch (error) {
      console.error('Error creating answer:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Get answers for a question
  static async getQuestionAnswers(req, res) {
    try {
      const answers = await QAModel.getQuestionAnswers(req.params.questionId);
      res.json(answers);
    } catch (error) {
      console.error('Error getting question answers:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Delete a question (Admin only)
  static async deleteQuestion(req, res) {
    try {
      await QAModel.deleteQuestion(req.params.id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting question:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Delete an answer (Admin only)
  static async deleteAnswer(req, res) {
    try {
      await QAModel.deleteAnswer(req.params.id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting answer:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Approve or reject a question (Admin/Sub-Admin only)
  static async updateQuestionStatus(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Admin or sub-admin only.' });
      }

      const { status } = req.body;
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
      }

      const updatedQuestion = await QAModel.updateQuestionStatus(
        req.params.id, 
        status, 
        req.user.id, 
        req.user.role, 
        req.user.industry
      );
      
      let message = `Question ${status === 'approved' ? 'approved' : 'rejected'} successfully`;
      if (status === 'approved') {
        message += '. The question is now visible to the seller.';
      }
      
      res.json({
        message,
        question: updatedQuestion
      });
    } catch (error) {
      console.error('Error updating question status:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Approve or reject an answer (Admin/Sub-Admin only)
  static async updateAnswerStatus(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Admin or sub-admin only.' });
      }

      const { status } = req.body;
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
      }

      const updatedAnswer = await QAModel.updateAnswerStatus(
        req.params.id, 
        status, 
        req.user.id, 
        req.user.role, 
        req.user.industry
      );
      
      let message = `Answer ${status === 'approved' ? 'approved' : 'rejected'} successfully`;
      if (status === 'approved') {
        message += '. The answer is now visible to the customer.';
      }
      
      res.json({
        message,
        answer: updatedAnswer
      });
    } catch (error) {
      console.error('Error updating answer status:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Get user's own questions (Customer only)
  static async getUserQuestions(req, res) {
    try {
      // By default, only show approved questions to customers
      // But allow them to see all their questions (including pending/rejected) if requested
      const includeAllStatuses = req.query.all === 'true';
      const questions = await QAModel.getUserQuestions(req.user.id, includeAllStatuses);
      res.json(questions);
    } catch (error) {
      console.error('Error getting user questions:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = QAController;