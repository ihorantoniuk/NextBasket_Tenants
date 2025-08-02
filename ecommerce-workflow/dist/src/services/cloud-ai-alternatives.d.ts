export declare class OpenAIUpsellService {
    private openai;
    constructor();
    generateUpsellSuggestions(cartItems: any[], allProducts: any[]): Promise<UpsellSuggestion[]>;
}
export declare class AzureOpenAIUpsellService {
    generateUpsellSuggestions(cartItems: any[], allProducts: any[]): Promise<UpsellSuggestion[]>;
}
//# sourceMappingURL=cloud-ai-alternatives.d.ts.map