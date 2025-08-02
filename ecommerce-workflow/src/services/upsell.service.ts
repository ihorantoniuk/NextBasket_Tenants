import axios from 'axios';
import { config } from '../config';
import { Product, Cart, UpsellSuggestion } from '../types';
import { logger } from '../middleware/logger';

export interface UpsellRequest {
  cartItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    tags: string[];
  }>;
  availableProducts: Product[];
  maxSuggestions?: number;
}

export interface UpsellResponse {
  suggestions: UpsellSuggestion[];
  reasoning?: string;
  processingTime: number;
}

export class UpsellService {
  private readonly ollamaBaseUrl: string;
  private readonly model: string;
  private readonly maxRetries: number = 3;
  private readonly timeoutMs: number = 10000; // 10 seconds

  constructor() {
    this.ollamaBaseUrl = config.ollama.baseUrl;
    this.model = config.ollama.model;
  }

  async generateUpsellSuggestions(request: UpsellRequest): Promise<UpsellResponse> {
    if (!config.features.upsellEnabled) {
      logger.info('Upsell feature is disabled');
      return {
        suggestions: [],
        reasoning: 'Upsell feature is disabled',
        processingTime: 0
      };
    }

    const startTime = Date.now();
    const maxSuggestions = Math.min(request.maxSuggestions || 3, 3);

    try {
      logger.info(`Generating upsell suggestions for cart with ${request.cartItems.length} items`);

      const prompt = this.buildPrompt(request, maxSuggestions);
      logger.info('Upsell prompt:', { prompt });

      const response = await this.callOllama(prompt);
      logger.info('Upsell raw response:', { response });

      const suggestions = this.parseResponse(response, request.availableProducts);
      const processingTime = Date.now() - startTime;

      logger.info(`Generated ${suggestions.length} upsell suggestions in ${processingTime}ms`);

      return {
        suggestions: suggestions.slice(0, maxSuggestions),
        reasoning: response,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Failed to generate upsell suggestions:', error);

      // Return fallback suggestions in case of AI failure
      const fallbackSuggestions = this.generateFallbackSuggestions(request, maxSuggestions);
      
      return {
        suggestions: fallbackSuggestions,
        reasoning: 'AI service unavailable, using fallback logic',
        processingTime
      };
    }
  }

  private buildPrompt(request: UpsellRequest, maxSuggestions: number): string {
    const cartDescription = request.cartItems.map(item => 
      `- ${item.productName} (${item.quantity}x, $${item.price}, tags: ${item.tags.join(', ')})`
    ).join('\n');

    const availableProducts = request.availableProducts
      .filter(p => !request.cartItems.some(item => item.productId === p.id))
      .slice(0, 20) // Limit to prevent prompt from being too long
      .map(p => `- ${p.name} (ID: ${p.id}, $${p.price}, tags: ${p.tags.join(', ')})`)
      .join('\n');

    return `You are an expert e-commerce recommendation engine. Analyze the customer's current cart and suggest complementary products.

CURRENT CART:
${cartDescription}

AVAILABLE PRODUCTS:
${availableProducts}

TASK: Suggest up to ${maxSuggestions} complementary products that would enhance the customer's purchase. Focus on:
1. Products that naturally complement the cart items
2. Items that solve related problems or needs
3. Accessories or related products

RESPONSE FORMAT (JSON only, no other text):
{
  "suggestions": [
    {
      "productId": "product-id",
      "reason": "Brief explanation why this complements the cart",
      "confidence": 0.85
    }
  ]
}

Rules:
- Only suggest products from the available list
- Confidence should be between 0.1 and 1.0
- Reasons should be concise (under 50 words)
- Order suggestions by relevance/confidence
- Return valid JSON only`;
  }

  private async callOllama(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Calling Ollama API (attempt ${attempt}/${this.maxRetries})`);

        const response = await axios.post(
          `${this.ollamaBaseUrl}/api/generate`,
          {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 1000
            }
          },
          {
            timeout: this.timeoutMs,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.response) {
          return response.data.response;
        } else {
          throw new Error('Invalid response format from Ollama');
        }
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Ollama API call failed (attempt ${attempt}/${this.maxRetries}):`, error);
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to call Ollama API after retries');
  }

  private parseResponse(response: string, availableProducts: Product[]): UpsellSuggestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No JSON found in AI response, using fallback parsing');
        return this.parseFallbackResponse(response, availableProducts);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        logger.warn('Invalid suggestions format in AI response');
        return [];
      }

      const suggestions: UpsellSuggestion[] = [];

      for (const suggestion of parsed.suggestions) {
        const product = availableProducts.find(p => p.id === suggestion.productId);
        
        if (product && suggestion.reason && typeof suggestion.confidence === 'number') {
          suggestions.push({
            productId: product.id,
            productName: product.name,
            reason: suggestion.reason,
            confidence: Math.max(0.1, Math.min(1.0, suggestion.confidence))
          });
        }
      }

      return suggestions;
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return this.parseFallbackResponse(response, availableProducts);
    }
  }

  private parseFallbackResponse(response: string, availableProducts: Product[]): UpsellSuggestion[] {
    // Simple fallback parsing for when JSON parsing fails
    const suggestions: UpsellSuggestion[] = [];
    const productIds = availableProducts.map(p => p.id);

    // Look for product IDs mentioned in the response
    for (const productId of productIds) {
      if (response.includes(productId)) {
        const product = availableProducts.find(p => p.id === productId);
        if (product) {
          suggestions.push({
            productId: product.id,
            productName: product.name,
            reason: 'Recommended by AI analysis',
            confidence: 0.5
          });

          if (suggestions.length >= 3) break;
        }
      }
    }

    return suggestions;
  }

  private generateFallbackSuggestions(request: UpsellRequest, maxSuggestions: number): UpsellSuggestion[] {
    logger.info('Generating fallback upsell suggestions');

    const cartTags = new Set<string>();
    request.cartItems.forEach(item => {
      item.tags.forEach(tag => cartTags.add(tag.toLowerCase()));
    });

    const cartProductIds = new Set(request.cartItems.map(item => item.productId));

    // Find products with similar tags
    const scoredProducts = request.availableProducts
      .filter(product => !cartProductIds.has(product.id))
      .map(product => {
        const productTags = product.tags.map(tag => tag.toLowerCase());
        const commonTags = productTags.filter(tag => cartTags.has(tag));
        const score = commonTags.length / Math.max(productTags.length, 1);

        return {
          product,
          score,
          commonTags
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);

    return scoredProducts.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      reason: `Related to your ${item.commonTags.join(', ')} items`,
      confidence: Math.min(0.8, 0.3 + item.score * 0.5)
    }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ollamaBaseUrl}/api/tags`, {
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      logger.error('Ollama health check failed:', error);
      return false;
    }
  }
}
