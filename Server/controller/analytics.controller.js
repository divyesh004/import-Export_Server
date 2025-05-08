const AnalyticsModel = require('../model/analytics.model');

class AnalyticsController {
  // Get sales analytics
  static async getSalesAnalytics(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        seller_id: req.query.seller_id,
        industry: req.query.industry
      };
      const analytics = await AnalyticsModel.getAnalytics(filters);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get product performance analytics
  static async getProductAnalytics(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        product_id: req.query.product_id,
        seller_id: req.query.seller_id,
        industry: req.query.industry
      };
      const analytics = await AnalyticsModel.getAnalytics(filters);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get seller performance analytics
  static async getSellerAnalytics(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        seller_id: req.query.seller_id,
        industry: req.query.industry
      };
      const analytics = await AnalyticsModel.getSellerAnalytics(filters);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get user analytics
  static async getUserAnalytics(req, res) {
    try {
      const filters = {
        period: req.query.period || 'month',
        industry: req.query.industry
      };
      const analytics = await AnalyticsModel.getUserAnalytics(filters);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get platform overview analytics (Admin only)
  static async getPlatformAnalytics(req, res) {
    try {
      const filters = {
        period: req.query.period || 'month',
        industry: req.query.industry
      };
      
      const analytics = await AnalyticsModel.getPlatformAnalytics(filters);

      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get dashboard statistics for admin dashboard
  static async getDashboardStats(req, res) {
    try {
      // Check if user is sub-admin and has industry assigned
      let industry = null;
      if (req.user.role === 'sub-admin' && req.user.industry) {
        industry = req.user.industry;
      }
      
      const stats = await AnalyticsModel.getDashboardStats(industry);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard statistics' });
    }
  }

  // Get recent activities for admin dashboard
  static async getRecentActivities(req, res) {
    try {
      // Check if user is sub-admin and has industry assigned
      let industry = null;
      if (req.user.role === 'sub-admin' && req.user.industry) {
        industry = req.user.industry;
      }
      
      const activities = await AnalyticsModel.getRecentActivities(industry);
      res.json({ activities });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch recent activities' });
    }
  }

  // Get industry breakdown analytics
  static async getIndustryBreakdown(req, res) {
    try {
      const filters = {
        period: req.query.period || 'month',
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        industry: req.query.industry
      };
      
      const industryData = await AnalyticsModel.getIndustryBreakdown(filters);
      res.json(industryData);
    } catch (error) {
      console.error('Error fetching industry breakdown:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AnalyticsController;