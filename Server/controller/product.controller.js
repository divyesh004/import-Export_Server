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

  // Get pending products (Admin, Sub-Admin, Seller)
  static async getPendingProducts(req, res) {
    try {
      if (!req.user) {
        console.error('Unauthorized access attempt: No user found');
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'seller' && req.user.role !== 'sub-admin') {
        console.error(`Access denied for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Access denied. Admin, Sub-Admin or seller only.' });
      }

      // Sub-Admin can only see products where category matches their industry
      if (req.user.role === 'sub-admin' && req.user.industry) {
        console.log(`Fetching pending products for sub-admin with industry: ${req.user.industry}`);
        
        // Get all pending products
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'pending');
          
        if (error) {
          console.error('Error fetching products for sub-admin:', error);
          return res.status(500).json({ error: 'Failed to fetch products' });
        }
        
        // Filter products where category matches sub-admin's industry
        const filteredProducts = products.filter(product => {
          return product.category && product.category.toLowerCase() === req.user.industry.toLowerCase();
        });
        
        console.log(`Found ${filteredProducts.length} pending products where category matches industry: ${req.user.industry}`);
        return res.json(filteredProducts);
      }
      
      // For admin and seller
      const filters = { status: 'pending' };
      
      // Seller can only see their own products
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

  // Get seller's approved products (Seller only)
  static async getSellerApprovedProducts(req, res) {
    try {
      if (!req.user || req.user.role !== 'seller') {
        return res.status(403).json({ error: 'Access denied. Seller only.' });
      }
      const products = await ProductModel.findAll({ 
        status: 'approved',
        seller_id: req.user.id 
      });
      res.json(products);
    } catch (error) {
      console.error('Error getting seller approved products:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Get sub-admin's industry-specific approved products (Sub-Admin only)
  static async getSubAdminApprovedProducts(req, res) {
    try {
      if (!req.user || req.user.role !== 'sub-admin') {
        return res.status(403).json({ error: 'Access denied. Sub-Admin only.' });
      }
      
      if (!req.user.industry) {
        return res.status(400).json({ error: 'No industry assigned to this Sub-Admin.' });
      }
      
      // Get all approved products
      const allApprovedProducts = await ProductModel.findAll({ 
        status: 'approved'
      });
      
      // Filter products where category matches sub-admin's industry
      const filteredProducts = allApprovedProducts.filter(product => {
        return product.category && product.category.toLowerCase() === req.user.industry.toLowerCase();
      });
      
      console.log(`Found ${filteredProducts.length} approved products where category matches industry: ${req.user.industry}`);
      res.json(filteredProducts);
    } catch (error) {
      console.error('Error getting industry-specific approved products:', error);
      res.status(400).json({ error: error.message });
    }
  }
  // Add new product (Seller only)
  static async createProduct(req, res) {
    try {
      // Validate user authentication and role
      if (!req.user?.id || req.user.role !== 'seller') {
        console.error('Unauthorized product creation attempt:', { userId: req.user?.id, role: req.user?.role });
        return res.status(401).json({ error: 'केवल विक्रेता ही प्रोडक्ट बना सकते हैं' });
      }

      // Extract and validate required fields
      const { name, description, price, imageUrls, category } = req.body;

      // Validate basic required fields
      if (!name?.trim() || !description?.trim() || !category?.trim()) {
        console.error('Missing required fields:', { name, description, category });
        return res.status(400).json({ error: 'नाम, विवरण और श्रेणी आवश्यक हैं' });
      }

      // Validate category
      const validCategories = ['clothing', 'accessories', 'footwear', 'electronics', 'home', 'beauty'];
      if (!validCategories.includes(category.trim().toLowerCase())) {
        console.error('Invalid category:', category);
        return res.status(400).json({
          error: 'अमान्य श्रेणी। कृपया एक मान्य श्रेणी चुनें',
          validCategories
        });
      }

      // Validate and parse price
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        console.error('Invalid price:', price);
        return res.status(400).json({ error: 'मूल्य एक धनात्मक संख्या होनी चाहिए' });
      }

      // Validate image URLs
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.error('Invalid image URLs:', imageUrls);
        return res.status(400).json({ error: 'कृपया कम से कम एक मान्य इमेज URL प्रदान करें' });
      }

      // Process and validate each image URL
      const validatedImageUrls = imageUrls
        .map(url => url?.trim())
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
        return res.status(400).json({ error: 'कृपया कम से कम एक मान्य इमेज URL प्रदान करें' });
      }

      // Prepare product data
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: category.trim().toLowerCase(),
        image_url: validatedImageUrls, // Changed from imageUrls to image_url to match model expectation
        seller_id: req.user.id
      };

      // Create the product
      const product = await ProductModel.createProduct(productData, req.user.id);
      console.log('Product created successfully:', { productId: product.id, sellerId: req.user.id });
      
      res.status(201).json({
        message: 'प्रोडक्ट सफलतापूर्वक बनाया गया',
        product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(error.status || 400).json({
        error: error.message || 'प्रोडक्ट बनाने में त्रुटि हुई',
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

  // Update product (Seller/Admin/Sub-Admin)
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Sellers can only update their own products
      if (req.user.role === 'seller' && product.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only update your own products.' });
      }
      const updatedProduct = await ProductModel.update(id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete product (Seller/Admin/Sub-Admin)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Sellers can only delete their own products
      if (req.user.role === 'seller' && product.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only delete your own products.' });
      }
      
      // Sub-Admin can only delete products from their assigned industry
      if (req.user.role === 'sub-admin' && req.user.industry && product.industry !== req.user.industry) {
        return res.status(403).json({ 
          error: 'Access denied. Sub-Admins can only delete products from their assigned industry.' 
        });
      }

      await ProductModel.delete(id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Approve/Deny product (Admin and Sub-Admin)
  static async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
      }

      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Check if Sub-Admin has access to this product's industry
      if (req.user.role === 'sub-admin' && req.user.industry && product.industry !== req.user.industry) {
        return res.status(403).json({ 
          error: 'Access denied. Sub-Admins can only manage products from their assigned industry.' 
        });
      }

      const updatedProduct = await ProductModel.updateStatus(id, status, reason);
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
}

module.exports = ProductController;