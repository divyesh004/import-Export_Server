const axios = require('axios');

class MistralService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    this.systemPrompt = `
You are an AI pricing assistant. Based on the product and seller price, suggest the best price considering the following:
1. China's market data (min, max, average price).
2. Tariff rules for the target country (e.g., USA).
3. Ministry regulations (if applicable).
Your output should include:
- China Price Range
- Target Country Tariff
- Suggested Best Price based on analysis
`;
  }

  async analyzePricing(productData) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: "mistral-small", // Using Mistral's small model
          messages: [
            { role: "system", content: this.systemPrompt },
            { 
              role: "user", 
              content: `Analyze pricing for this product:\n
Product: ${productData.name}\nDescription: ${productData.description}\nCategory: ${productData.category}\nCurrent Price: $${productData.price}\nBrand: ${productData.brand}\nTarget Country: USA` 
            }
          ],
          temperature: 0.7,
          max_tokens: 500
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