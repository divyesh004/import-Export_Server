const QAModel = require('../model/qa.model');
const ProductModel = require('../model/product.model');
const supabase = require('../config/supabase');

class QAController {
  // Get all questions (Admin/Seller only)
  static async getAllQuestions(req, res) {
    try {
      const questions = await QAModel.getAllQuestions(req.user.id, req.user.role);
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

  // Answer a question (Seller/Admin/Sub-Admin)
  static async answerQuestion(req, res) {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      // Get question details from database
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (questionError || !question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Get the product to check permissions
      const product = await ProductModel.findById(question.product_id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Permission checks based on role
      if (req.user.role === 'seller' && product.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Sellers can only answer questions for their own products' });
      }
      
      // Sub-Admin can only answer questions for products from their assigned industry
      if (req.user.role === 'sub-admin' && req.user.industry && product.industry !== req.user.industry) {
        return res.status(403).json({ 
          error: 'Sub-Admins can only answer questions for products from their assigned industry' 
        });
      }

      // Update the question with an answer
      const { data: updatedQuestion, error: updateError } = await supabase
        .from('questions')
        .update({ answer, answered_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      res.json(updatedQuestion);
    } catch (error) {
      console.error('Error answering question:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  // Answer a question (Seller/Admin/Sub-Admin)
  static async createAnswer(req, res) {
    try {
      const { questionId } = req.params;
      const { answer } = req.body;
      
      const result = await QAModel.createAnswer(questionId, req.user.id, answer);
      res.status(201).json(result);
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