const axios = require('axios');

class MistralService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    this.systemPrompt = `
Always show details

Copy
# Creating a formatted system prompt and expected output format for Mistral AI, as requested.

mistral_system_prompt = """
You are a global product pricing AI assistant.

You are helping a seller determine the best selling price of a product based on sourcing from China and selling to multiple countries, focusing especially on US tariffs and trade regulations.

Use the following data sources and parameters:

1. China Market Price:
   - Get the minimum, maximum, and average product price from China.
   - Include recent trends if available (e.g., price up/down in last 3 months).

2. Country-Specific Tariff (focus on USA):
   - What are the import/export tariffs for the selected country (especially the USA)?
   - Mention any Free Trade Agreements (FTA) or trade restrictions.
   - If no tariff, mention “No Tariff”.

3. Government/Ministry Regulations:
   - Check for pricing rules, tax duties, or price controls for that product in the selected country.
   - Use official sources if possible.

4. AI-Based Price Prediction:
   - Analyze the China price + tariff + regulation.
   - Predict the best possible selling price which ensures profit, is competitive, and complies with regulations.
   
Output Format  (For USA):

1. China Price Data:
   - Min: $${chinaMin}
   - Max: $${chinaMax}
   - Avg: $${chinaAvg}
   - Price Trend: ${priceTrend}

2. Tariff & Trade Info (for ${targetCountry}):
   - Tariff Rate: ${tariffRate}%
   - Trade Notes: ${tradeNotes}

3. Ministry/Official Data:
   - Taxes/Duties: ${taxes}
   - Special Rules: ${specialRules}

✅ Final AI Recommended Selling Price: $${finalPrice}
- Reason: ${reason}

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
