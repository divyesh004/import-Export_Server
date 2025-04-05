const supabase = require('../config/supabase');

class OrderModel {
  static async createOrder(orderData, buyerId) {
    const { product_id, quantity } = orderData;

    // Verify product exists and is approved
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('status', 'approved')
      .single();

    if (productError || !product) {
      throw new Error('Product not found or not approved');
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          buyer_id: buyerId,
          product_id,
          quantity,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return order;
  }

  static async findById(id, userId, role) {
    let query = supabase
      .from('orders')
      .select('*, products(*), users!orders_buyer_id_fkey(name, email)')
      .eq('id', id);

    // Apply role-based filters
    if (role === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else if (role === 'seller') {
      query = query.eq('products.seller_id', userId);
    }

    const { data: order, error } = await query.single();

    if (error) {
      return null;
    }

    return order;
  }

  static async findAll(userId, role, filters = {}) {
    let query = supabase
      .from('orders')
      .select('*, products(*), users!orders_buyer_id_fkey(name, email)');

    // Apply role-based filters
    if (role === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else if (role === 'seller') {
      query = query.eq('products.seller_id', userId);
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return orders;
  }

  static async updateStatus(id, status, userId, role) {
    // Verify order exists and user has permission
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('id', id)
      .single();

    if (findError || !existingOrder) {
      throw new Error('Order not found');
    }

    // Check permissions
    if (role === 'seller' && existingOrder.products.seller_id !== userId) {
      throw new Error('Unauthorized to update this order');
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return order;
  }

  static async getOrderStatistics() {
    const { data, error } = await supabase
      .from('orders')
      .select('status, quantity');

    if (error) {
      throw new Error(error.message);
    }

    const statistics = {
      total: data.length,
      pending: data.filter(order => order.status === 'pending').length,
      shipped: data.filter(order => order.status === 'shipped').length,
      delivered: data.filter(order => order.status === 'delivered').length,
      cancelled: data.filter(order => order.status === 'cancelled').length,
      totalQuantity: data.reduce((sum, order) => sum + order.quantity, 0)
    };

    return statistics;
  }
}

module.exports = OrderModel;