const { OrderModel, ORDER_STATUS } = require('../model/order.model');

class OrderController {
  // Create new order (Buyer)
  static async createOrder(req, res) {
    try {
      // Validate required fields
      const { product_id, quantity, shipping_address } = req.body;
      if (!product_id || !quantity || !shipping_address) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const order = await OrderModel.createOrder(req.body, req.user.id);
      res.status(201).json({
        order,
        message: 'Order placed successfully. It is pending approval from admin.'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get all orders (Admin/Sub-Admin)
  static async getAllOrders(req, res) {
    try {
      // Check if user is admin or sub-admin
      if (!['admin', 'sub_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }

      const filters = {
        status: req.query.status,
        seller_id: req.query.seller_id,
        buyer_id: req.query.buyer_id,
        role: req.user.role,
        userId: req.user.id
      };

      // If sub-admin, add industry filter
      if (req.user.role === 'sub_admin' && req.user.industry_id) {
        filters.industry_id = req.user.industry_id;
      }

      const orders = await OrderModel.findAll(filters);
      res.json(orders);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get user's orders (Buyer/Seller)
  static async getUserOrders(req, res) {
    try {
      const filters = {
        role: req.user.role,
        userId: req.user.id,
        status: req.query.status
      };

      const orders = await OrderModel.findAll(filters);
      res.json(orders);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get order by ID
  static async getOrderById(req, res) {
    try {
      const order = await OrderModel.findById(req.params.id, req.user.id, req.user.role);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update order status (Seller/Admin/Buyer)
  static async updateOrderStatus(req, res) {
    try {
      const { status, fulfillment_details } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const order = await OrderModel.updateStatus(
        req.params.id, 
        status, 
        req.user.id, 
        req.user.role, 
        fulfillment_details
      );

      res.json({
        order,
        message: `Order status updated to ${status}`
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cancel order (Buyer/Admin)
  static async cancelOrder(req, res) {
    try {
      // Only allow cancellation if order is in a cancellable state
      const order = await OrderModel.updateStatus(
        req.params.id, 
        ORDER_STATUS.CANCELLED, 
        req.user.id, 
        req.user.role,
        null,
        req.body.reason
      );

      res.json({
        order,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get order analytics (Admin only)
  static async getOrderAnalytics(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }

      const analytics = await OrderModel.getOrderStatistics();
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Approve or reject order (Admin/Sub-Admin only)
  static async approveRejectOrder(req, res) {
    try {
      const { status, reason } = req.body;
      
      if (![ORDER_STATUS.APPROVED, ORDER_STATUS.REJECTED].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
      }

      // Check if user is admin or sub-admin
      if (!['admin', 'sub_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized: Admin or Sub-Admin access required' });
      }

      const order = await OrderModel.approveRejectOrder(
        req.params.id,
        status,
        req.user.id,
        req.user.role,
        reason
      );

      const message = status === ORDER_STATUS.APPROVED 
        ? 'Order approved successfully' 
        : 'Order rejected';

      res.json({
        order,
        message
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Seller confirm order and add fulfillment details
  static async confirmOrder(req, res) {
    try {
      // Check if user is a seller
      if (req.user.role !== 'seller') {
        return res.status(403).json({ error: 'Unauthorized: Seller access required' });
      }

      const { fulfillment_details } = req.body;
      if (!fulfillment_details) {
        return res.status(400).json({ error: 'Fulfillment details are required' });
      }

      const order = await OrderModel.confirmOrder(
        req.params.id,
        req.user.id,
        fulfillment_details
      );

      res.json({
        order,
        message: 'Order confirmed successfully'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = OrderController;