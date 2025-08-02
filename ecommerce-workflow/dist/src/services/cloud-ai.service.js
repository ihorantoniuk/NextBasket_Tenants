"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudAI = exports.CloudAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../config/logger");
class CloudAIService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async generateUpsellSuggestions(cartItems, availableProducts) {
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
        }
        catch (error) {
            logger_1.logger.error('OpenAI upsell generation failed:', error);
            return [];
        }
    }
    buildUpsellPrompt(cartItems, availableProducts) {
        const cartSummary = cartItems.map(item => `${item.name} ($${item.price})`).join(', ');
        const productList = availableProducts.map(product => `{"id": "${product.id}", "name": "${product.name}", "price": ${product.price}}`).join(',\n');
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
    async healthCheck() {
        try {
            await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 1
            });
            return { healthy: true, model: 'gpt-3.5-turbo' };
        }
        catch (error) {
            logger_1.logger.error('OpenAI health check failed:', error);
            return { healthy: false, model: 'gpt-3.5-turbo' };
        }
    }
}
exports.CloudAIService = CloudAIService;
exports.cloudAI = new CloudAIService();
//# sourceMappingURL=cloud-ai.service.js.map