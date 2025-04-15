const MistralService = require('../services/mistral.service');
const ProductModel = require('../model/product.model');

class PriceController {
  // Analyze product pricing using Mistral AI
  static async analyzeProductPrice(req, res) {
    try {
      const { product_id } = req.params;
      
      if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      // Get product details
      const product = await ProductModel.findById(product_id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if user is authorized to view this product's pricing
      // If user is not admin or the seller of this product
      if (req.user.role !== 'admin' && req.user.id !== product.seller_id) {
        return res.status(403).json({ error: 'Unauthorized to analyze this product' });
      }

      // Call Mistral AI service for price analysis
      const analysis = await MistralService.analyzePricing(product);
      
      if (!analysis.success) {
        return res.status(500).json({ error: analysis.error || 'Failed to analyze pricing' });
      }

      // Return the analysis
      return res.status(200).json({
        product_id: product.id,
        product_name: product.name,
        current_price: product.price,
        analysis: analysis.analysis
      });
    } catch (error) {
      console.error('Error in price analysis:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = PriceController;