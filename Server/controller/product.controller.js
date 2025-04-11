const ProductModel = require('../model/product.model');
const supabase = require('../config/supabase');

class ProductController {
  // Get approved products (Public)
  static async getApprovedProducts(req, res) {
    try {
      const products = await ProductModel.findAll({ status: 'approved' });
      res.json(products);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get pending products (Admin only)
  static async getPendingProducts(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'seller' && req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Admin or seller only.' });
      }

      const filters = { status: 'pending' };
      if (req.user.role === 'seller') {
        filters.seller_id = req.user.id;
      }

      console.log('Fetching pending products with filters:', filters);
      const products = await ProductModel.findAll(filters);
      
      if (!products || products.length === 0) {
        console.log('No pending products found');
        return res.json([]);
      }

      console.log(`Found ${products.length} pending products`);
      res.json(products);
    } catch (error) {
      console.error('Error in getPendingProducts:', error);
      res.status(500).json({ error: 'Failed to fetch pending products' });
    }
  }

  // Get rejected products (Admin only)
  static async getRejectedProducts(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }
      const products = await ProductModel.findAll({ status: 'rejected' });
      res.json(products);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  // Add new product (Seller only)
  static async createProduct(req, res) {
    try {
      // Validate user authentication and role
      if (!req.user?.id || req.user.role !== 'seller') {
        console.error('Unauthorized product creation attempt:', { userId: req.user?.id, role: req.user?.role });
        return res.status(401).json({ error: 'Only sellers can create products' });
      }

      // Extract and validate required fields
      const { name, description, price, imageUrls, category, availability, brand, key_features, specification } = req.body;

      // Validate basic required fields
      if (!name || !description || !category || name.toString().length === 0 || description.toString().length === 0 || category.toString().length === 0) {
        console.error('Missing required fields:', { name, description, category });
        return res.status(400).json({ error: 'Name, description and category are required' });
      }

      // Validate category
      const validCategories = ['clothing', 'accessories', 'footwear', 'electronics', 'home', 'beauty'];
      if (!validCategories.includes(category.toString().toLowerCase())) {
        console.error('Invalid category:', category);
        return res.status(400).json({
          error: 'Invalid category. Please select a valid category',
          validCategories
        });
      }

      // Validate and parse price
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        console.error('Invalid price:', price);
        return res.status(400).json({ error: 'value must be a positive number' });
      }

      // Validate image URLs
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.error('Invalid image URLs:', imageUrls);
        return res.status(400).json({ error: 'Please provide at least one valid image URL' });
      }

      // Process and validate each image URL
      const validatedImageUrls = imageUrls
        .map(url => url?.toString())
        .filter(url => {
          if (!url) return false;
          try {
            new URL(url);
            return url.startsWith('http');
          } catch {
            return false;
          }
        });

      if (validatedImageUrls.length === 0) {
        console.error('No valid image URLs provided');
        return res.status(400).json({ error: 'Please provide at least one valid image URL' });
      }
      
      // Validate availability
      if (!availability) {
        console.error('Missing availability');
        return res.status(400).json({ error: 'Availability is required' });
      }
      
      // Validate brand
      if (!brand) {
        console.error('Missing brand');
        return res.status(400).json({ error: 'brand is required' });
      }
      
      // Validate key_features
      if (!key_features) {
        console.error('Missing key_features');
        return res.status(400).json({ error: 'Key features are required' });
      }
      
      // Validate specification
      if (!specification) {
        console.error('Missing specification');
        return res.status(400).json({ error: 'specification required' });
      }

      // Prepare product data
      const productData = {
        name: name.toString(),
        description: description.toString(),
        price: parsedPrice,
        industry: category.toString().toLowerCase(), // Changed from category to industry to match model expectation
        image_url: validatedImageUrls, // Changed from imageUrls to image_url to match model expectation
        seller_id: req.user.id,
        availability: availability,
        brand: brand,
        key_features: key_features,
        specification: specification
      };

      // Create the product
      const product = await ProductModel.createProduct(productData, req.user.id);
      console.log('Product created successfully:', { productId: product.id, sellerId: req.user.id });
      
      res.status(201).json({
        message: 'Product successfully created',
        product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(error.status || 400).json({
        error: error.message || 'There was an error creating the product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get all products
  static async getAllProducts(req, res) {
    try {
      const filters = {
        seller_id: req.query.seller_id,
        status: req.query.status // Allow filtering by status for admin
      };
      
      // Non-admin users can only see approved products
      if (!req.user || req.user.role !== 'admin') {
        filters.status = 'approved';
      }
      
      const products = await ProductModel.findAll(filters);
      res.json(products);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update product (Seller/Admin)
  static async updateProduct(req, res) {
    try {
      const product = await ProductModel.updateProduct(req.params.id, req.body, req.user.id);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete product (Seller/Admin)
  static async deleteProduct(req, res) {
    try {
      await ProductModel.deleteProduct(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Approve/Deny product (Admin and Sub-Admin)
  static async updateProductStatus(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      // Get the product to check its industry
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // For sub-admin, check if product belongs to their industry
      if (req.user.role === 'sub-admin') {
        if (product.category !== req.user.industry) {
          return res.status(403).json({ error: 'You can only manage products from your assigned industry' });
        }
      }

      // Update the product status
      const updatedProduct = await ProductModel.updateStatus(req.params.id, req.body.status);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Check product status - For real-time status updates
  static async checkProductStatus(req, res) {
    try {
      const { productIds } = req.body;
      
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: 'Invalid product IDs' });
      }
      
      // Get status of all products in a single query
      const products = await ProductModel.findByIds(productIds);
      
      // Find products that are rejected or no longer exist
      const rejectedIds = [];
      
      // Check which products are rejected or missing
      for (const productId of productIds) {
        const product = products.find(p => p.id === productId);
        
        // If product doesn't exist or is rejected, add to rejectedIds
        if (!product || product.status === 'rejected') {
          rejectedIds.push(productId);
        }
      }
      
      res.json({ rejectedIds });
    } catch (error) {
      console.error('Error checking product status:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Get seller's approved products (Seller only)
  static async getSellerApprovedProducts(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'unauthorized access' });
      }

      if (req.user.role !== 'seller') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. For seller only।' });
      }

      const filters = { 
        status: 'approved',
        seller_id: req.user.id 
      };

      console.log('Fetching seller\'s approved products with filters:', filters);
      const products = await ProductModel.findAll(filters);
      
      if (!products || products.length === 0) {
        console.log('No approved products found for this seller');
        return res.json([]);
      }

      console.log(`Found ${products.length} approved products for seller ${req.user.id}`);
      res.json(products);
    } catch (error) {
      console.error('Error in getSellerApprovedProducts:', error);
      res.status(500).json({ error: 'Failure to receive vendors approved products' });
    }
  }

  // Get industry-specific approved products (Sub-Admin only)
  static async getIndustryApprovedProducts(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Sub-admin only.' });
      }

      // Get the sub-admin's industry
      const industry = req.user.industry;
      if (!industry) {
        return res.status(400).json({ error: 'No industry assigned to this sub-admin' });
      }

      // Use ProductModel to find products by category and status
      const products = await ProductModel.findAll({ 
        category: industry, // Filter by category matching sub-admin's industry
        status: 'approved' 
      });

      console.log(`Found ${products.length} approved products for industry ${industry}`);
      res.json(products);
    } catch (error) {
      console.error('Error in getIndustryApprovedProducts:', error);
      res.status(500).json({ error: 'Failed to fetch industry approved products' });
    }
  }

  // Get industry-specific pending products (Sub-Admin only)
  static async getIndustryPendingProducts(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Sub-admin only.' });
      }

      // Get the sub-admin's industry
      const industry = req.user.industry;
      if (!industry) {
        return res.status(400).json({ error: 'No industry assigned to this sub-admin' });
      }

      // Use ProductModel to find products by category and status
      const products = await ProductModel.findAll({ 
        category: industry, // Filter by category matching sub-admin's industry
        status: 'pending' 
      });

      console.log(`Found ${products.length} pending products for industry ${industry}`);
      res.json(products);
    } catch (error) {
      console.error('Error in getIndustryPendingProducts:', error);
      res.status(500).json({ error: 'Failed to fetch industry pending products' });
    }
  }

  // Get industry-specific rejected products (Sub-Admin only)
  static async getIndustryRejectedProducts(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Sub-admin only.' });
      }

      // Get the sub-admin's industry
      const industry = req.user.industry;
      if (!industry) {
        return res.status(400).json({ error: 'No industry assigned to this sub-admin' });
      }

      // Use ProductModel to find products by category and status
      const products = await ProductModel.findAll({ 
        category: industry, // Filter by category matching sub-admin's industry
        status: 'rejected' 
      });

      console.log(`Found ${products.length} rejected products for industry ${industry}`);
      res.json(products);
    } catch (error) {
      console.error('Error in getIndustryRejectedProducts:', error);
      res.status(500).json({ error: 'Failed to fetch industry rejected products' });
    }
  }
}

module.exports = ProductController;