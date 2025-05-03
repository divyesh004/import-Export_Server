const ProductRequestModel = require('../model/product_request.model');
const supabase = require('../config/supabase');


class ProductRequestController {
  // Create a new product request
  static async createRequest(req, res) {
    try {
      let { name, email, phone, product_name , product_details, industry } = req.body;
      let userEmail = email;
      
      // If user is logged in, get their information from the database
      if (req.user && req.user.id) {
        const UserModel = require('../model/user.model');
        const userInfo = await UserModel.findById(req.user.id);
        
        // Use logged-in user's email instead of form email
        if (userInfo && userInfo.email) {
          userEmail = userInfo.email;
        }
      }

      // Basic validation
      if (!name || !userEmail || !phone || !product_details || !product_name) {
        return res.status(400).json({ error: 'Name, email, phone, product name, and product details are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Get user ID if logged in
      const userId = req.user ? req.user.id : null;

      // Create the request with updated email if user is logged in
      const requestData = { ...req.body };
      if (userEmail !== email) {
        requestData.email = userEmail;
      }
      
      // Create the request
      const request = await ProductRequestModel.createRequest(requestData, userId);

      // Fetch admin and sub-admin emails to notify based on industry
      let query = supabase
        .from('users')
        .select('email, role, industry')
        .in('role', ['admin', 'sub-admin']);
      
      // If industry is provided, filter sub-admins by industry
      // Admins will always receive notifications regardless of industry
      if (industry) {
        // Get all admins and industry-specific sub-admins
        const { data: recipients, error: adminError } = await query;
        
        if (!adminError && recipients && recipients.length > 0) {
          // Filter recipients: all admins + industry-matching sub-admins
          const filteredRecipients = recipients.filter(user => 
            user.role === 'admin' || (user.role === 'sub-admin' && user.industry === industry)
          );
          
          // Log notification (email functionality removed)
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Would notify these recipients: ${filteredRecipients.map(r => r.email).join(', ')}`);
          }
        }
      } else {
        // If no industry specified, notify all admins
        const { data: admins, error: adminError } = await query.eq('role', 'admin');
        
        if (!adminError && admins && admins.length > 0) {
          // Log notification (email functionality removed)
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Would notify these admins: ${admins.map(a => a.email).join(', ')}`);
          }
        }
      }

      res.status(201).json({
        message: 'Product request submitted successfully',
        request_id: request.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get all product requests (Admin only)
  static async getAllRequests(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const industry = req.query.industry || null;

      // If user is sub-admin, filter by their industry
      let requests, total;
      if (req.user.role === 'sub-admin') {
        // Get sub-admin's industry from user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('industry')
          .eq('id', req.user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching sub-admin industry:', userError);
          // Don't return error, continue with empty industry
          // This allows sub-admin to see requests even if their industry is not set
        }
        
        // Log the userData for debugging
        if (process.env.NODE_ENV !== 'production') {
          console.log('Sub-admin user data:', userData);
        }
        
        // Get user industry if available, otherwise use null
        const userIndustry = userData && userData.industry ? userData.industry : null;
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('Filtering requests by industry:', userIndustry);
        }
        
        // Get requests by industry (if industry is null, will return all requests)
        ({ requests, total } = await ProductRequestModel.getRequestsByIndustry(userIndustry, page, limit));
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Found ${total} requests for industry: ${userIndustry || 'all'}`);
        }
      } else {
        // Admin can see all requests
        ({ requests, total } = await ProductRequestModel.getAllRequests(page, limit));
      }

      res.json({
        requests,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get a specific product request by ID (Admin only)
  static async getRequestById(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const request = await ProductRequestModel.getRequestById(req.params.id);
      res.json(request);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update product request status (Admin/Sub-admin only)
  static async updateStatus(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        return res.status(403).json({ error: 'Access denied. Admin or sub-admin only.' });
      }

      const { status } = req.body;
      
      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (pending, approved, or rejected) is required' });
      }

      const updatedRequest = await ProductRequestModel.updateStatus(req.params.id, status);
      res.json({
        message: 'Product request status updated successfully',
        request: updatedRequest
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get approved product requests (Seller only)
  static async getApprovedRequests(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'seller') {
        return res.status(403).json({ error: 'Access denied. Seller only.' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const { requests, total } = await ProductRequestModel.getApprovedRequests(page, limit);

      res.json({
        requests,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete a product request (Admin only)
  static async deleteRequest(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      await ProductRequestModel.deleteRequest(req.params.id);
      res.json({ message: 'Product request deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ProductRequestController;