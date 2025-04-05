const OrderModel = require('../model/order.model');

class OrderController {
  // Create new order
  static async createOrder(req, res) {
    try {
      const order = await OrderModel.createOrder(req.body, req.user.id);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get all orders (Admin only)
  static async getAllOrders(req, res) {
    try {
      const filters = {
        status: req.query.status,
        seller_id: req.query.seller_id,
        buyer_id: req.query.buyer_id
      };
      const orders = await OrderModel.findAll(filters);
      res.json(orders);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get user's orders (Buyer/Seller)
  static async getUserOrders(req, res) {
    try {
      const orders = await OrderModel.findAll(req.user.id, req.user.role);
      res.json(orders);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get order by ID
  static async getOrderById(req, res) {
    try {
      const order = await OrderModel.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update order status (Seller/Admin)
  static async updateOrderStatus(req, res) {
    try {
      const order = await OrderModel.updateStatus(req.params.id, req.body.status, req.user.id);
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cancel order (Buyer/Admin)
  static async cancelOrder(req, res) {
    try {
      const order = await OrderModel.cancelOrder(req.params.id, req.user.id, req.user.role);
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get order analytics (Admin only)
  static async getOrderAnalytics(req, res) {
    try {
      const analytics = await OrderModel.getAnalytics(req.query);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = OrderController;