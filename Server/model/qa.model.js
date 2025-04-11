const supabase = require('../config/supabase');

class QAModel {
  static async createQuestion(questionData, userId) {
    const { product_id, question } = questionData;

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    const { data: questionRecord, error } = await supabase
      .from('questions')
      .insert([{
        product_id,
        user_id: userId,
        question
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return questionRecord;
  }

  static async getProductQuestions(productId) {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*, users!questions_user_id_fkey(name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return questions;
  }

  static async createAnswer(questionId, sellerId, answerText) {
    // Verify question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*, products(*)')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      throw new Error('Question not found');
    }

    // Verify seller owns the product
    if (question.products.seller_id !== sellerId) {
      throw new Error('Unauthorized to answer this question');
    }

    const { data: answer, error } = await supabase
      .from('answers')
      .insert([{
        question_id: questionId,
        seller_id: sellerId,
        answer: answerText
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return answer;
  }

  static async getQuestionAnswers(questionId) {
    const { data: answers, error } = await supabase
      .from('answers')
      .select('*, users!answers_seller_id_fkey(name)')
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return answers;
  }

  static async getAllQuestions(userId, role, industry) {
    let query = supabase
      .from('questions')
      .select(`
        *,
        users!questions_user_id_fkey(name),
        products!inner(*)
      `)
      .order('created_at', { ascending: false });

    // If user is a seller, only show questions for their products
    if (role === 'seller') {
      query = query.eq('products.seller_id', userId);
    }
    
    // If user is a sub-admin, only show questions for their industry/category
    if (role === 'sub-admin' && industry) {
      query = query.eq('products.category', industry);
    }

    const { data: questions, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Get answers for all questions
    if (questions && questions.length > 0) {
      // Get all question IDs
      const questionIds = questions.map(q => q.id);
      
      // Fetch all answers for these questions in a single query
      const { data: allAnswers, error: answersError } = await supabase
        .from('answers')
        .select('*, users!answers_seller_id_fkey(name)')
        .in('question_id', questionIds)
        .order('created_at', { ascending: true });

      if (answersError) {
        console.error('Error fetching answers:', answersError);
      } else if (allAnswers && allAnswers.length > 0) {
        // Add the first answer to each question
        questions.forEach(question => {
          const questionAnswers = allAnswers.filter(a => a.question_id === question.id);
          if (questionAnswers.length > 0) {
            question.answer = questionAnswers[0].answer;
            question.answered_at = questionAnswers[0].created_at;
          }
        });
      }
    }

    return questions;
  }

  static async getUserQuestions(userId) {
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        *,
        users!questions_user_id_fkey(name),
        products(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return questions;
  }

  static async deleteQuestion(questionId, userId, role) {
    // Admin can delete any question
    if (role === 'admin') {
      // Admin can delete any question, proceed directly
    } 
    // Sub-admin can only delete questions from their industry
    else if (role === 'sub-admin') {
      // Get the question with product details
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('*, products!inner(*)')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        throw new Error('Question not found');
      }

      // Get sub-admin's industry from users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('industry')
        .eq('id', userId)
        .single();

      if (userError || !user || !user.industry) {
        throw new Error('Unable to verify sub-admin industry');
      }

      // Check if the question's product belongs to the sub-admin's industry
      if (question.products.category !== user.industry) {
        throw new Error('Unauthorized to delete this question - not in your industry');
      }
    } 
    // Regular users can only delete their own questions
    else {
      const { data: question } = await supabase
        .from('questions')
        .select('user_id')
        .eq('id', questionId)
        .single();

      if (!question || question.user_id !== userId) {
        throw new Error('Unauthorized to delete this question');
      }
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  static async deleteAnswer(answerId, userId, role) {
    // Only admin or the seller who answered can delete it
    if (role !== 'admin') {
      const { data: answer } = await supabase
        .from('answers')
        .select('seller_id')
        .eq('id', answerId)
        .single();

      if (!answer || answer.seller_id !== userId) {
        throw new Error('Unauthorized to delete this answer');
      }
    }

    const { error } = await supabase
      .from('answers')
      .delete()
      .eq('id', answerId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }
}

module.exports = QAModel;