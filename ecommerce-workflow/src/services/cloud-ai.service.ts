// Cloud AI service for production deployment
// This replaces Ollama when deploying to cloud platforms with limited resources

import OpenAI from 'openai';
import { logger } from '../config/logger';

export class CloudAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateUpsellSuggestions(
    cartItems: Array<{ name: string; price: number; category?: string }>,
    availableProducts: Array<{ id: string; name: string; price: number; category?: string }>
  ): Promise<Array<{ productId: string; reason: string }>> {
    try {
      const prompt = this.buildUpsellPrompt(cartItems, availableProducts);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI sales assistant. Suggest relevant products based on cart contents. Return JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error('OpenAI upsell generation failed:', error);
      return [];
    }
  }

  private buildUpsellPrompt(
    cartItems: Array<{ name: string; price: number; category?: string }>,
    availableProducts: Array<{ id: string; name: string; price: number; category?: string }>
  ): string {
    const cartSummary = cartItems.map(item => 
      `${item.name} ($${item.price})`
    ).join(', ');

    const productList = availableProducts.map(product => 
      `{"id": "${product.id}", "name": "${product.name}", "price": ${product.price}}`
    ).join(',\n');

    return `
Cart contains: ${cartSummary}

Available products:
${productList}

Suggest 1-2 complementary products as JSON array:
[{"productId": "id", "reason": "why this complements the cart"}]

Focus on:
- Complementary items
- Similar price range
- Logical combinations
- Clear reasoning
    `.trim();
  }

  async healthCheck(): Promise<{ healthy: boolean; model: string }> {
    try {
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1
      });
      
      return { healthy: true, model: 'gpt-3.5-turbo' };
    } catch (error) {
      logger.error('OpenAI health check failed:', error);
      return { healthy: false, model: 'gpt-3.5-turbo' };
    }
  }
}

export const cloudAI = new CloudAIService();
