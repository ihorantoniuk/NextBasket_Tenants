"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAIUpsellService = exports.OpenAIUpsellService = void 0;
class OpenAIUpsellService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async generateUpsellSuggestions(cartItems, allProducts) {
        const prompt = this.buildPrompt(cartItems, allProducts);
        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 500
        });
        return this.parseResponse(response.choices[0].message.content, allProducts);
    }
}
exports.OpenAIUpsellService = OpenAIUpsellService;
class AzureOpenAIUpsellService {
    async generateUpsellSuggestions(cartItems, allProducts) {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
    }
}
exports.AzureOpenAIUpsellService = AzureOpenAIUpsellService;
//# sourceMappingURL=cloud-ai-alternatives.js.map