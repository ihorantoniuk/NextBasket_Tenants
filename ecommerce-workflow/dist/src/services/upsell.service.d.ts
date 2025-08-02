import { Product, UpsellSuggestion } from '../types';
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
export declare class UpsellService {
    private readonly ollamaBaseUrl;
    private readonly model;
    private readonly maxRetries;
    private readonly timeoutMs;
    constructor();
    generateUpsellSuggestions(request: UpsellRequest): Promise<UpsellResponse>;
    private buildPrompt;
    private callOllama;
    private parseResponse;
    private parseFallbackResponse;
    private generateFallbackSuggestions;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=upsell.service.d.ts.map