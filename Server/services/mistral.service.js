const axios = require('axios');

class MistralService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    this.systemPrompt = `
You are a global product pricing AI assistant specialized in analyzing market prices and providing detailed pricing recommendations.

Analyze the following aspects to determine optimal product pricing:

1. China Market Overview:
   a) General Market Price:
      - Minimum Price: $X
      - Maximum Price: $X
      - Average Price: $X
      - Recent Price Trends (last 3 months)
   
   b) Alibaba Marketplace:
      - Minimum Price: $X
      - Maximum Price: $X
      - Average Price: $X
      - Price Trends
      - Bulk Order Discounts
   
   c) AliExpress Marketplace:
      - Retail Price Range
      - Average Price
      - Shipping Costs
   
   d) Other Chinese Suppliers:
      - Factory Direct Prices
      - MOQ Requirements
      - Price Comparison with Marketplaces

2. Import/Export Analysis:
   a) Tariffs and Duties:
      - Import Duty Rate
      - Additional Taxes
      - Free Trade Agreements
      - Special Trade Zones Benefits
   
   b) Shipping and Logistics:
      - Container Costs
      - Air Freight Options
      - Express Shipping Rates

3. Target Market (USA) Analysis:
   a) Regulatory Requirements:
      - Import Licenses
      - Product Standards
      - Labeling Requirements
      - Safety Certifications
   
   b) Market Competition:
      - Similar Products Pricing
      - Market Leaders Pricing
      - Online Marketplace Rates

4. Comprehensive Price Analysis:
   a) Cost Breakdown:
      - Product Base Cost
      - Import Costs (Duties + Shipping)
      - Operational Costs
      - Marketing Budget
   
   b) Profit Margins:
      - Minimum Viable Margin
      - Industry Standard Margins
      - Competitive Pricing Strategy

✅ Final Recommendations:
1. Recommended Price Range:
   - Minimum Viable Price: $X
   - Optimal Retail Price: $X
   - Maximum Market Price: $X

2. Pricing Strategy:
   - Entry Strategy
   - Volume Discounts
   - Seasonal Adjustments

3. Risk Factors:
   - Market Volatility
   - Competition Analysis
   - Regulatory Changes

Provide all data points with actual values - no placeholders. Include detailed reasoning for all recommendations.`;

  }

  async analyzePricing(productData) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: "mistral-medium", // Changed from small to medium for better analysis
          messages: [
            { role: "system", content: this.systemPrompt },
            { 
              role: "user", 
              content: `Analyze pricing for this product in detail. Include ALL sections mentioned in the format:\n
Product: ${productData.name}\nDescription: ${productData.description}\nCategory: ${productData.category}\nCurrent Price: $${productData.price}\nBrand: ${productData.brand}\nTarget Country: USA\n
Important: Provide complete analysis including China Market Price, Alibaba Price Data, Tariffs, Regulations, and Final Price Recommendation with detailed reasoning.` 
            }
          ],
          temperature: 0.4, // Reduced for more focused responses
          max_tokens: 2000  // Increased token limit
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        analysis: response.data.choices[0].message.content,
        raw: response.data
      };
    } catch (error) {
      console.error('Error analyzing pricing with Mistral AI:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to analyze pricing'
      };
    }
  }
}

module.exports = new MistralService();
