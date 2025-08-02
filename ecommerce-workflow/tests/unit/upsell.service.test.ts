import { UpsellService } from '../../src/services/upsell.service';
import { Product, UpsellSuggestion } from '../../src/types';
import axios from 'axios';

// Mock axios and config
jest.mock('axios');
jest.mock('../../src/config', () => ({
  config: {
    features: {
      upsellEnabled: true
    },
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'mistral'
    }
  }
}));
jest.mock('../../src/middleware/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UpsellService', () => {
  let upsellService: UpsellService;

  beforeEach(() => {
    upsellService = new UpsellService();
    jest.clearAllMocks();
  });

  describe('generateUpsellSuggestions', () => {
    const cartItems = [
      {
        productId: 'prod-1',
        productName: 'Wireless Headphones',
        quantity: 1,
        price: 199.99,
        tags: ['electronics', 'audio', 'wireless']
      }
    ];

    const availableProducts: Product[] = [
      {
        id: 'prod-2',
        tenantId: 'tenant-1',
        name: 'Wireless Charger',
        description: 'Fast wireless charging pad',
        tags: ['electronics', 'charging', 'wireless'],
        price: 49.99,
        stock: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prod-3',
        tenantId: 'tenant-1',
        name: 'Bluetooth Speaker',
        description: 'Portable speaker',
        tags: ['electronics', 'audio', 'portable'],
        price: 89.99,
        stock: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should generate upsell suggestions successfully', async () => {
      const aiResponse = {
        data: {
          response: JSON.stringify({
            suggestions: [
              {
                productId: 'prod-2',
                reason: 'Perfect complement for your wireless setup',
                confidence: 0.85
              }
            ]
          })
        }
      };

      // Add a small delay to simulate processing time
      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(aiResponse), 10))
      );

      const result = await upsellService.generateUpsellSuggestions({
        cartItems,
        availableProducts,
        maxSuggestions: 3
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toEqual({
        productId: 'prod-2',
        productName: 'Wireless Charger',
        reason: 'Perfect complement for your wireless setup',
        confidence: 0.85
      });
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should return fallback suggestions when AI fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('AI service unavailable'));

      const result = await upsellService.generateUpsellSuggestions({
        cartItems,
        availableProducts,
        maxSuggestions: 3
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.reasoning).toBe('AI service unavailable, using fallback logic');
      expect(result.suggestions[0].reason).toContain('Related to your');
    });

    it('should return empty suggestions when feature is disabled', async () => {
      // Mock config directly
      const configMock = require('../../src/config');
      const originalFeatures = configMock.config.features;
      configMock.config.features = { ...originalFeatures, upsellEnabled: false };

      try {
        const result = await upsellService.generateUpsellSuggestions({
          cartItems,
          availableProducts,
          maxSuggestions: 3
        });

        expect(result.suggestions).toHaveLength(0);
        expect(result.reasoning).toBe('Upsell feature is disabled');
      } finally {
        // Restore original config
        configMock.config.features = originalFeatures;
      }
    });

    it('should handle malformed AI response gracefully', async () => {
      const aiResponse = {
        data: {
          response: 'Invalid JSON response from AI. Consider prod-2 and prod-3 for wireless setup.'
        }
      };

      // Add delay to simulate processing time
      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(aiResponse), 10))
      );

      const result = await upsellService.generateUpsellSuggestions({
        cartItems,
        availableProducts,
        maxSuggestions: 3
      });

      // Should fall back to rule-based suggestions
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.reasoning).toContain('Invalid JSON response from AI');
    });

    it('should limit suggestions to maxSuggestions', async () => {
      const aiResponse = {
        data: {
          response: JSON.stringify({
            suggestions: [
              { productId: 'prod-2', reason: 'Reason 1', confidence: 0.9 },
              { productId: 'prod-3', reason: 'Reason 2', confidence: 0.8 },
              { productId: 'prod-4', reason: 'Reason 3', confidence: 0.7 },
              { productId: 'prod-5', reason: 'Reason 4', confidence: 0.6 }
            ]
          })
        }
      };

      mockedAxios.post.mockResolvedValue(aiResponse);

      const result = await upsellService.generateUpsellSuggestions({
        cartItems,
        availableProducts,
        maxSuggestions: 2
      });

      expect(result.suggestions).toHaveLength(2);
    });
  });

  describe('healthCheck', () => {
    it('should return true when Ollama is healthy', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await upsellService.healthCheck();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        { timeout: 5000 }
      );
    });

    it('should return false when Ollama is unhealthy', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection failed'));

      const result = await upsellService.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('generateFallbackSuggestions', () => {
    it('should generate suggestions based on tag similarity', async () => {
      const cartItems = [
        {
          productId: 'prod-1',
          productName: 'Wireless Headphones',
          quantity: 1,
          price: 199.99,
          tags: ['electronics', 'audio']
        }
      ];

      const availableProducts: Product[] = [
        {
          id: 'prod-2',
          tenantId: 'tenant-1',
          name: 'Bluetooth Speaker',
          description: 'Portable speaker',
          tags: ['electronics', 'audio'],
          price: 89.99,
          stock: 15,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'prod-3',
          tenantId: 'tenant-1',
          name: 'Kitchen Knife',
          description: 'Sharp knife',
          tags: ['kitchen', 'cooking'],
          price: 29.99,
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Force AI to fail to test fallback
      mockedAxios.post.mockRejectedValue(new Error('AI service down'));

      const result = await upsellService.generateUpsellSuggestions({
        cartItems,
        availableProducts,
        maxSuggestions: 3
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].productId).toBe('prod-2');
      expect(result.suggestions[0].reason).toContain('electronics, audio');
    });
  });
});
