const CartModel = require('../model/cart.model');

class CartController {
  // Add item to cart
  static async addToCart(req, res) {
    try {
      const cartItem = await CartModel.addToCart(req.user.id, req.body);
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get user's cart
  static async getUserCart(req, res) {
    try {
      const cartItems = await CartModel.getUserCart(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Remove item from cart
  static async removeFromCart(req, res) {
    try {
      await CartModel.removeFromCart(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update cart item quantity
  static async updateQuantity(req, res) {
    try {
      const cartItem = await CartModel.updateQuantity(req.params.id, req.user.id, req.body.quantity);
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Checkout process
  static async checkout(req, res) {
    try {
      // Get user's cart
      const cartItems = await CartModel.getUserCart(req.user.id);
      if (!cartItems.length) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Create orders for each cart item
      const OrderModel = require('../model/order.model');
      const orders = [];

      for (const item of cartItems) {
        const order = await OrderModel.createOrder({
          product_id: item.product_id,
          quantity: item.quantity
        }, req.user.id);
        orders.push(order);
      }

      // Clear the cart
      await CartModel.clearCart(req.user.id);

      res.status(201).json({
        message: 'Checkout successful',
        orders
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = CartController;