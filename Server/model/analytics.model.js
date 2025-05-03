const supabase = require('../config/supabase');

class AnalyticsModel {
  static async getAnalytics(filters = {}) {
    const { start_date, end_date, seller_id } = filters;
    let query = supabase
      .from('orders')
      .select('*, products(*)')
      .eq('status', 'completed');

    if (seller_id) {
      query = query.eq('products.seller_id', seller_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.products.price * order.quantity), 0),
      averageOrderValue: orders.length > 0 ? 
        orders.reduce((sum, order) => sum + (order.products.price * order.quantity), 0) / orders.length : 0
    };

    return analytics;
  }

  static async getSellerAnalytics(filters = {}) {
    const { start_date, end_date, seller_id } = filters;
    
    let query = supabase
      .from('orders')
      .select('*, products(*)')
      .eq('status', 'completed');

    if (seller_id) {
      query = query.eq('products.seller_id', seller_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.products.price * order.quantity), 0),
      averageOrderValue: orders.length > 0 ?
        orders.reduce((sum, order) => sum + (order.products.price * order.quantity), 0) / orders.length : 0,
      productsSold: orders.reduce((sum, order) => sum + order.quantity, 0)
    };

    return analytics;
  }

  static async getUserAnalytics(filters = {}) {
    const { period = 'month' } = filters;
    
    // Get current date and date for comparison
    const now = new Date();
    const periodStart = new Date();
    if (period === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      periodStart.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      periodStart.setFullYear(now.getFullYear() - 1);
    }

    // Get all users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');

    if (userError) {
      throw new Error(userError.message);
    }

    // Get active users (users who placed orders in the period)
    const { data: activeUsers, error: orderError } = await supabase
      .from('orders')
      .select('buyer_id')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', now.toISOString());

    if (orderError) {
      throw new Error(orderError.message);
    }

    const uniqueActiveUsers = new Set(activeUsers.map(order => order.buyer_id));

    return {
      totalUsers: users.length,
      activeUsers: uniqueActiveUsers.size,
      newUsers: users.filter(user => new Date(user.created_at) >= periodStart).length,
      userTypes: {
        buyers: users.filter(user => user.role === 'buyer').length,
        sellers: users.filter(user => user.role === 'seller').length
      }
    };
  }

  static async getPlatformAnalytics(filters = {}) {
    const { period = 'month' } = filters;
    
    // Get current date and date for comparison
    const now = new Date();
    const periodStart = new Date();
    if (period === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      periodStart.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      periodStart.setFullYear(now.getFullYear() - 1);
    }

    // Get orders in the period
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('status', 'completed')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', now.toISOString());

    if (orderError) {
      throw new Error(orderError.message);
    }

    // Get user statistics
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');

    if (userError) {
      throw new Error(userError.message);
    }

    const newUsers = users.filter(user => new Date(user.created_at) >= periodStart).length;
    const totalUsers = users.length;
    const userGrowthRate = totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;

    const newSellers = users.filter(user => 
      user.role === 'seller' && new Date(user.created_at) >= periodStart
    ).length;
    const totalSellers = users.filter(user => user.role === 'seller').length;
    const sellerGrowthRate = totalSellers > 0 ? (newSellers / totalSellers) * 100 : 0;

    return {
      totalRevenue: orders.reduce((sum, order) => sum + (order.products.price * order.quantity), 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ?
        orders.reduce((sum, order) => sum + (order.products.price * order.quantity), 0) / orders.length : 0,
      userGrowthRate,
      sellerGrowthRate
    };
  }

  static async getDashboardStats(industry = null) {
    try {
      // Get user statistics
      let userQuery = supabase.from('users').select('*');
      
      // Filter users by industry if specified (for sub-admin)
      if (industry) {
        userQuery = userQuery.eq('industry', industry);
      }
      
      const { data: users, error: userError } = await userQuery;

      if (userError) {
        throw new Error(userError.message);
      }

      const totalCustomers = users.filter(user => user.role === 'customer').length;
      const totalSellers = users.filter(user => user.role === 'seller').length;

      // Get order statistics
      let orderQuery = supabase.from('orders').select('*, products(*)');
      
      // For sub-admin, only get orders related to their industry
      if (industry) {
        // Join with products and filter by industry (stored in category column)
        orderQuery = orderQuery.eq('products.category', industry);
      }
      
      const { data: orders, error: orderError } = await orderQuery;

      if (orderError) {
        throw new Error(orderError.message);
      }

      const totalOrders = orders.length;

      // Calculate monthly income (from orders in the current month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyOrders = orders.filter(order => 
        new Date(order.created_at) >= firstDayOfMonth && 
        order.status === 'completed'
      );
      
      const monthlyIncome = monthlyOrders.reduce((sum, order) => {
        return sum + (order.products?.price * order.quantity || 0);
      }, 0);

      // Get all questions
      let questionQuery = supabase.from('questions').select('id, products(category)');
      
      // Filter questions by industry if specified (for sub-admin)
      if (industry) {
        questionQuery = questionQuery.eq('products.category', industry);
      }
      
      const { data: allQuestions, error: questionError } = await questionQuery;

      if (questionError) {
        throw new Error(questionError.message);
      }

      // Get all answers
      const { data: allAnswers, error: answerError } = await supabase
        .from('answers')
        .select('question_id');

      if (answerError) {
        throw new Error(answerError.message);
      }

      // Find questions without answers
      const answeredQuestionIds = new Set(allAnswers.map(answer => answer.question_id));
      const pendingQuestions = allQuestions.filter(question => !answeredQuestionIds.has(question.id)).length;
      
      // Get pending products
      let productQuery = supabase
        .from('products')
        .select('id')
        .eq('status', 'pending');
      
      // Filter products by industry/category if specified (for sub-admin)
      if (industry) {
        productQuery = productQuery.eq('category', industry);
      }
        
      const { data: pendingProductsData, error: productError } = await productQuery;
        
      if (productError) {
        throw new Error(productError.message);
      }
      
      const pendingProducts = pendingProductsData.length;

      return {
        totalCustomers,
        totalSellers,
        totalOrders,
        monthlyIncome,
        pendingQuestions,
        pendingProducts
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  static async getRecentActivities(industry = null) {
    try {
      // Get recent orders
      let orderQuery = supabase
        .from('orders')
        .select('*, users!orders_buyer_id_fkey(name), products(name, category)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Filter by industry if specified (for sub-admin)
      if (industry) {
        orderQuery = orderQuery.eq('products.category', industry);
      }
      
      const { data: recentOrders, error: orderError } = await orderQuery;

      if (orderError) {
        throw new Error(orderError.message);
      }

      // Get recent questions
      let questionQuery = supabase
        .from('questions')
        .select('*, users(name), products(name, category)')
        .order('created_at', { ascending: false })
        .limit(5);
        
      // Filter by industry if specified (for sub-admin)
      if (industry) {
        questionQuery = questionQuery.eq('products.category', industry);
      }
      
      const { data: recentQuestions, error: questionError } = await questionQuery;

      if (questionError) {
        throw new Error(questionError.message);
      }

      // Get recent user registrations
      let userQuery = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      // Filter by industry if specified (for sub-admin)
      if (industry) {
        userQuery = userQuery.eq('industry', industry);
      }
      
      const { data: recentUsers, error: userError } = await userQuery;

      if (userError) {
        throw new Error(userError.message);
      }

      // Combine and format activities
      const activities = [
        ...recentOrders.filter(order => order.users && order.products).map(order => ({
          id: `order-${order.id}`,
          text: `${order.users?.name || 'A user'} placed an order for ${order.products?.name || 'a product'}`,
          time: new Date(order.created_at).toLocaleString(),
          type: 'order'
        })),
        ...recentQuestions.filter(question => question.users && question.products).map(question => ({
          id: `question-${question.id}`,
          text: `${question.users?.name || 'A user'} asked a question about ${question.products?.name || 'a product'}`,
          time: new Date(question.created_at).toLocaleString(),
          type: 'question'
        })),
        ...recentUsers.map(user => ({
          id: `user-${user.id}`,
          text: `${user.name || 'A user'} joined as a ${user.role || 'member'}`,
          time: new Date(user.created_at).toLocaleString(),
          type: 'user'
        }))
      ];

      // Sort by time (newest first)
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      // Return top 10 activities
      return activities.slice(0, 10);
    } catch (error) {
      console.error('Error getting recent activities:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsModel;