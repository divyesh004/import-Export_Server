const QAModel = require('../model/qa.model');

class QAController {
  // Get all questions (Admin/Seller/Sub-Admin only)
  static async getAllQuestions(req, res) {
    try {
      const questions = await QAModel.getAllQuestions(req.user.id, req.user.role, req.user.industry);
      res.json(questions);
    } catch (error) {
      console.error('Error getting all questions:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Submit a question (Buyer only)
  static async createQuestion(req, res) {
    try {
      const question = await QAModel.createQuestion(req.body, req.user.id);
      res.status(201).json(question);
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
      res.status(201).json(answer);
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

  // Get user's own questions (Customer only)
  static async getUserQuestions(req, res) {
    try {
      const questions = await QAModel.getUserQuestions(req.user.id);
      res.json(questions);
    } catch (error) {
      console.error('Error getting user questions:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = QAController;