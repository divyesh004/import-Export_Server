const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controller/analytics.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get dashboard statistics for admin dashboard
router.get('/dashboard',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  AnalyticsController.getDashboardStats
);

// Get recent activities for admin dashboard
router.get('/activities',
  authenticateToken,
  authorizeRoles('admin', 'sub-admin'),
  AnalyticsController.getRecentActivities
);

// Get sales analytics
router.get('/sales',
  authenticateToken,
  authorizeRoles('admin'),
  AnalyticsController.getSalesAnalytics
);

// Get user analytics
router.get('/users',
  authenticateToken,
  authorizeRoles('admin'),
  AnalyticsController.getUserAnalytics
);

// Get seller analytics
router.get('/sellers',
  authenticateToken,
  authorizeRoles('admin'),
  AnalyticsController.getSellerAnalytics
);

// Get platform analytics
router.get('/platform',
  authenticateToken,
  authorizeRoles('admin'),
  AnalyticsController.getPlatformAnalytics
);

// Get revenue analytics (Admin only)
router.get('/revenue',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('status', 'completed');

      const revenue = {
        total: orders.reduce((sum, order) => sum + order.total_amount, 0),
        monthly: {},
        daily: {}
      };

      // Calculate monthly and daily revenue
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const dayKey = date.toISOString().split('T')[0];

        revenue.monthly[monthKey] = (revenue.monthly[monthKey] || 0) + order.total_amount;
        revenue.daily[dayKey] = (revenue.daily[dayKey] || 0) + order.total_amount;
      });

      res.json({
        success: true,
        data: revenue
      });
    } catch (error) {
      console.error('Error fetching revenue:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
});

// Get total sales report (Admin only)
router.get('/sales',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const statistics = await OrderModel.getOrderStatistics();
      if (!statistics) {
        return res.status(404).json({
          success: false,
          error: 'Sales statistics not found'
        });
      }

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching sales statistics:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
});

// Get user statistics (Admin only)
router.get('/users',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const buyers = await UserModel.findByRole('buyer');
      const sellers = await UserModel.findByRole('seller');

      if (!buyers || !sellers) {
        return res.status(404).json({
          success: false,
          error: 'User data not found'
        });
      }

      const statistics = {
        total_users: buyers.length + sellers.length,
        total_buyers: buyers.length,
        total_sellers: sellers.length,
        active_buyers: buyers.filter(user => !user.is_banned).length,
        active_sellers: sellers.filter(user => !user.is_banned && user.status === 'approved').length
      };

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
});

// Get revenue details (Admin only)
router.get('/revenue',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, products(price)')
        .eq('status', 'delivered');

      if (error) {
        console.error('Supabase query error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch revenue data'
        });
      }

      if (!orders || !Array.isArray(orders)) {
        return res.status(404).json({
          success: false,
          error: 'No revenue data found'
        });
      }

      const revenue = orders.reduce((total, order) => {
        if (!order.products || !order.products.price || !order.quantity) {
          console.warn('Invalid order data:', order);
          return total;
        }
        return total + (order.products.price * order.quantity);
      }, 0);

      const statistics = {
        total_revenue: revenue,
        total_completed_orders: orders.length,
        average_order_value: orders.length > 0 ? revenue / orders.length : 0
      };

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error calculating revenue:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
});

module.exports = router;