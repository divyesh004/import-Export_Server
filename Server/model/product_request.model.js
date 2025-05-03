const supabase = require('../config/supabase');

class ProductRequestModel {
  static async createRequest(requestData, userId = null) {
    const { name, email, phone, product_details, industry, product_name } = requestData;

    // Create product request in Supabase
    const { data: request, error } = await supabase
      .from('product_requests')
      .insert([{
        name,
        email,
        phone,
        product_details,
        industry, // Added industry field
        product_name, // Added product_name field
        user_id: userId, // This can be null for non-logged in users
        status: 'pending' // Default status is pending
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return request;
  }

  static async getAllRequests(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { data: requests, error, count } = await supabase
      .from('product_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return { requests, total: count };
  }
  
  static async getRequestsByIndustry(industry, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Check if industry is null or empty, return all requests in that case
    if (!industry) {
      return this.getAllRequests(page, limit);
    }

    // Use ilike for case-insensitive matching and handle null industry values
    const { data: requests, error, count } = await supabase
      .from('product_requests')
      .select('*', { count: 'exact' })
      .or(`industry.ilike.%${industry}%,industry.is.null`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return { requests, total: count };
  }

  static async getRequestById(requestId) {
    const { data: request, error } = await supabase
      .from('product_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return request;
  }

  static async updateStatus(requestId, status) {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new Error('Invalid status. Status must be pending, approved, or rejected');
    }

    const { data: request, error } = await supabase
      .from('product_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return request;
  }

  static async getApprovedRequests(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { data: requests, error, count } = await supabase
      .from('product_requests')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return { requests, total: count };
  }

  static async deleteRequest(requestId) {
    const { error } = await supabase
      .from('product_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }
}

module.exports = ProductRequestModel;