export declare class CloudAIService {
    private openai;
    constructor();
    generateUpsellSuggestions(cartItems: Array<{
        name: string;
        price: number;
        category?: string;
    }>, availableProducts: Array<{
        id: string;
        name: string;
        price: number;
        category?: string;
    }>): Promise<Array<{
        productId: string;
        reason: string;
    }>>;
    private buildUpsellPrompt;
    healthCheck(): Promise<{
        healthy: boolean;
        model: string;
    }>;
}
export declare const cloudAI: CloudAIService;
//# sourceMappingURL=cloud-ai.service.d.ts.map