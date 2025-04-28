const supabase = require('../config/supabase');

// Order status constants
const ORDER_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

class OrderModel {
  static async createOrder(orderData, buyerId) {
    const { product_id, quantity, shipping_address } = orderData;

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
          shipping_address,
          status: ORDER_STATUS.PENDING_APPROVAL,
          fulfillment_details: null
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

    // Apply role-based filters and visibility rules
    if (role === 'buyer') {
      // Buyers can only see their own orders that have been confirmed or later
      query = query.eq('buyer_id', userId)
        .in('status', [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.IN_PROGRESS,
          ORDER_STATUS.DISPATCHED,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.CANCELLED
        ]);
    } else if (role === 'seller') {
      // Sellers can see approved orders and later status orders for their products
      query = query.eq('products.seller_id', userId)
        .in('status', [
          ORDER_STATUS.APPROVED,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.IN_PROGRESS,
          ORDER_STATUS.DISPATCHED,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.CANCELLED
        ]);
    } else if (role === 'sub_admin') {
      // Sub-admins can see orders from their assigned industry
      // This requires a join with products and industries tables
      // For now, we'll assume sub-admins can see all orders, but this should be refined
    }
    // Admins can see all orders

    const { data: order, error } = await query.single();

    if (error) {
      return null;
    }

    return order;
  }

  static async findAll(filters = {}) {
    let query = supabase
      .from('orders')
      .select('*, products(*), users!orders_buyer_id_fkey(name, email)');

    // Apply role-based filters and visibility rules
    if (filters.role === 'buyer' && filters.userId) {
      // Buyers can only see their own orders that have been confirmed or later
      query = query.eq('buyer_id', filters.userId)
        .in('status', [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.IN_PROGRESS,
          ORDER_STATUS.DISPATCHED,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.CANCELLED
        ]);
    } else if (filters.role === 'seller' && filters.userId) {
      // Sellers can see approved orders and later status orders for their products
      query = query.eq('products.seller_id', filters.userId)
        .in('status', [
          ORDER_STATUS.APPROVED,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.IN_PROGRESS,
          ORDER_STATUS.DISPATCHED,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.CANCELLED
        ]);
    } else if (filters.role === 'sub_admin' && filters.industry_id) {
      // Sub-admins can see orders from their assigned industry
      // This requires a join with products and industries tables
      query = query.eq('products.industry_id', filters.industry_id);
    }
    // Admins can see all orders

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply seller filter
    if (filters.seller_id) {
      query = query.eq('products.seller_id', filters.seller_id);
    }

    // Apply buyer filter
    if (filters.buyer_id) {
      query = query.eq('buyer_id', filters.buyer_id);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return orders;
  }

  static async updateStatus(id, status, userId, role, fulfillmentDetails = null) {
    // Verify order exists and user has permission
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('id', id)
      .single();

    if (findError || !existingOrder) {
      throw new Error('Order not found');
    }

    // Validate status transition based on role
    if (!this.isValidStatusTransition(existingOrder.status, status, role)) {
      throw new Error(`Invalid status transition from ${existingOrder.status} to ${status} for ${role}`);
    }

    // Check permissions
    if (role === 'seller' && existingOrder.products.seller_id !== userId) {
      throw new Error('Unauthorized to update this order');
    } else if (role === 'sub_admin') {
      // Check if sub-admin has permission for this industry
      // This would require a join with products and industries tables
      // For now, we'll assume sub-admins can update all orders, but this should be refined
    } else if (role === 'buyer' && existingOrder.buyer_id !== userId) {
      throw new Error('Unauthorized to update this order');
    }

    // Prepare update data
    const updateData = { status };
    
    // Add fulfillment details if provided (for seller confirmation)
    if (fulfillmentDetails && (status === ORDER_STATUS.CONFIRMED || status === ORDER_STATUS.IN_PROGRESS)) {
      updateData.fulfillment_details = fulfillmentDetails;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
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
      pendingApproval: data.filter(order => order.status === ORDER_STATUS.PENDING_APPROVAL).length,
      approved: data.filter(order => order.status === ORDER_STATUS.APPROVED).length,
      rejected: data.filter(order => order.status === ORDER_STATUS.REJECTED).length,
      confirmed: data.filter(order => order.status === ORDER_STATUS.CONFIRMED).length,
      inProgress: data.filter(order => order.status === ORDER_STATUS.IN_PROGRESS).length,
      dispatched: data.filter(order => order.status === ORDER_STATUS.DISPATCHED).length,
      delivered: data.filter(order => order.status === ORDER_STATUS.DELIVERED).length,
      cancelled: data.filter(order => order.status === ORDER_STATUS.CANCELLED).length,
      totalQuantity: data.reduce((sum, order) => sum + order.quantity, 0)
    };

    return statistics;
  }

  // Helper method to validate status transitions
  static isValidStatusTransition(currentStatus, newStatus, role) {
    // Define valid transitions for each role
    const validTransitions = {
      admin: {
        [ORDER_STATUS.PENDING_APPROVAL]: [ORDER_STATUS.APPROVED, ORDER_STATUS.REJECTED],
        [ORDER_STATUS.APPROVED]: [ORDER_STATUS.REJECTED, ORDER_STATUS.CONFIRMED],
        [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.DISPATCHED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.DISPATCHED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
        // Admin can change any status
        '*': Object.values(ORDER_STATUS)
      },
      sub_admin: {
        [ORDER_STATUS.PENDING_APPROVAL]: [ORDER_STATUS.APPROVED, ORDER_STATUS.REJECTED],
        // Sub-admin can only approve/reject pending orders
      },
      seller: {
        [ORDER_STATUS.APPROVED]: [ORDER_STATUS.CONFIRMED],
        [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.IN_PROGRESS],
        [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.DISPATCHED],
        // Seller can only update status in this flow
      },
      buyer: {
        [ORDER_STATUS.DISPATCHED]: [ORDER_STATUS.DELIVERED],
        [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.CANCELLED],
        // Buyer can only confirm delivery or cancel before dispatch
      }
    };

    // Admin can change to any status
    if (role === 'admin' && validTransitions.admin['*'].includes(newStatus)) {
      return true;
    }

    // For other roles, check specific transitions
    return validTransitions[role]?.[currentStatus]?.includes(newStatus) || false;
  }

  // Method to approve or reject an order (Admin/Sub-Admin only)
  static async approveRejectOrder(id, status, userId, role, reason = null) {
    if (![ORDER_STATUS.APPROVED, ORDER_STATUS.REJECTED].includes(status)) {
      throw new Error('Invalid status for approval/rejection');
    }

    if (!['admin', 'sub_admin'].includes(role)) {
      throw new Error('Unauthorized: Only admins and sub-admins can approve/reject orders');
    }

    // Verify order exists and is in pending approval state
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('id', id)
      .single();

    if (findError || !existingOrder) {
      throw new Error('Order not found');
    }

    if (existingOrder.status !== ORDER_STATUS.PENDING_APPROVAL) {
      throw new Error('Order is not in pending approval state');
    }

    // If sub-admin, check if they have permission for this industry
    if (role === 'sub_admin') {
      // This would require a join with products and industries tables
      // For now, we'll assume sub-admins can approve all orders, but this should be refined
    }

    // Update order status
    const updateData = { 
      status,
      admin_notes: reason
    };

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return order;
  }

  // Method for seller to confirm and add fulfillment details
  static async confirmOrder(id, sellerId, fulfillmentDetails) {
    // Verify order exists, is approved, and belongs to this seller
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('id', id)
      .eq('status', ORDER_STATUS.APPROVED)
      .single();

    if (findError || !existingOrder) {
      throw new Error('Order not found or not in approved state');
    }

    if (existingOrder.products.seller_id !== sellerId) {
      throw new Error('Unauthorized: This order does not belong to you');
    }

    // Update order status and add fulfillment details
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.CONFIRMED,
        fulfillment_details: fulfillmentDetails
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return order;
  }
}

module.exports = { OrderModel, ORDER_STATUS };