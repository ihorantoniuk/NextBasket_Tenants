import { CartService } from '../../src/services/cart.service';
import { CartRepository } from '../../src/repositories/cart.repository';
import { ProductService } from '../../src/services/product.service';
import { ValidationError } from '../../src/middleware/errorHandler';
import { Cart, AddToCartRequest, Product } from '../../src/types';

// Mock dependencies
jest.mock('../../src/repositories/cart.repository');
jest.mock('../../src/services/product.service');
jest.mock('../../src/middleware/logger');

describe('CartService - Comprehensive Test Suite', () => {
  let cartService: CartService;
  let mockCartRepository: jest.Mocked<CartRepository>;
  let mockProductService: jest.Mocked<ProductService>;

  beforeEach(() => {
    mockCartRepository = new CartRepository() as jest.Mocked<CartRepository>;
    mockProductService = new ProductService(null as any) as jest.Mocked<ProductService>;
    cartService = new CartService(mockCartRepository, mockProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Stock Validation - Core Issue #1: Prevent Overselling', () => {
    it('should prevent adding more items than available stock', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 10
      };

      const mockProduct: Product = {
        id: 'prod-1',
        tenantId: 'tenant-demo',
        name: 'Test Product',
        description: 'Test Description',
        tags: ['electronics'],
        price: 29.99,
        stock: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock product exists but insufficient stock
      mockProductService.getProduct.mockResolvedValue(mockProduct);
      mockProductService.checkStock.mockResolvedValue(false);
      mockCartRepository.getPendingStockForProduct.mockResolvedValue(0);

      await expect(
        cartService.addToCart(cartId, tenantId, addToCartRequest)
      ).rejects.toThrow(ValidationError);

      expect(mockProductService.checkStock).toHaveBeenCalledWith(
        'prod-1',
        tenantId,
        10
      );
    });

    it('should allow adding items when sufficient stock is available', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 5
      };

      const mockProduct: Product = {
        id: 'prod-1',
        tenantId: 'tenant-demo',
        name: 'Test Product',
        description: 'Test Description',
        tags: ['electronics'],
        price: 29.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockCart: Cart = {
        id: cartId,
        tenantId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockProductService.getProduct.mockResolvedValue(mockProduct);
      mockProductService.checkStock.mockResolvedValue(true);
      mockCartRepository.findById.mockResolvedValue(mockCart);
      mockCartRepository.addItem.mockResolvedValue(undefined);

      await cartService.addToCart(cartId, tenantId, addToCartRequest);

      expect(mockProductService.checkStock).toHaveBeenCalledWith(
        'prod-1',
        tenantId,
        5
      );
      expect(mockCartRepository.addItem).toHaveBeenCalled();
    });
  });

  describe('Pending Stock Tracking - Core Issue #2', () => {
    it('should consider items in other carts when checking stock', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 3
      };

      const mockProduct: Product = {
        id: 'prod-1',
        tenantId: 'tenant-demo',
        name: 'Test Product',
        description: 'Test Description',
        tags: ['electronics'],
        price: 29.99,
        stock: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock that stock check fails due to pending items in other carts
      mockProductService.getProduct.mockResolvedValue(mockProduct);
      mockProductService.checkStock.mockResolvedValue(false);
      mockCartRepository.getPendingStockForProduct.mockResolvedValue(3); // 3 items pending in other carts

      await expect(
        cartService.addToCart(cartId, tenantId, addToCartRequest)
      ).rejects.toThrow('Insufficient stock available. Only 2 items available.');

      expect(mockProductService.checkStock).toHaveBeenCalledWith(
        'prod-1',
        tenantId,
        3
      );
    });
  });

  describe('Error Handling - Core Issue #3: Specific Error Messages', () => {
    it('should throw ValidationError with specific message for stock issues', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 100
      };

      const mockProduct: Product = {
        id: 'prod-1',
        tenantId: 'tenant-demo',
        name: 'Test Product',
        description: 'Test Description',
        tags: ['electronics'],
        price: 29.99,
        stock: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockProductService.getProduct.mockResolvedValue(mockProduct);
      mockProductService.checkStock.mockResolvedValue(false);
      mockCartRepository.getPendingStockForProduct.mockResolvedValue(0);

      try {
        await cartService.addToCart(cartId, tenantId, addToCartRequest);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('Insufficient stock available. Only 5 items available.');
        expect(error.message).not.toBe('Internal Server Error');
      }
    });

    it('should throw Error with specific message for missing product', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'invalid-product',
        quantity: 1
      };

      mockProductService.getProduct.mockResolvedValue(null);

      await expect(
        cartService.addToCart(cartId, tenantId, addToCartRequest)
      ).rejects.toThrow('Product not found');
    });

    it('should throw Error with specific message for missing cart', async () => {
      const cartId = 'invalid-cart';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 1
      };

      const mockProduct: Product = {
        id: 'prod-1',
        tenantId: 'tenant-demo',
        name: 'Test Product',
        description: 'Test Description',
        tags: ['electronics'],
        price: 29.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockProductService.getProduct.mockResolvedValue(mockProduct);
      mockProductService.checkStock.mockResolvedValue(true);
      mockCartRepository.findById.mockResolvedValue(null);
      mockCartRepository.addItem.mockRejectedValue(new Error('Cart not found or access denied'));

      await expect(
        cartService.addToCart(cartId, tenantId, addToCartRequest)
      ).rejects.toThrow('Cart not found or access denied');
    });
  });

  describe('Input Validation', () => {
    it('should validate positive quantity', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: -1
      };

      await expect(
        cartService.addToCart(cartId, tenantId, addToCartRequest)
      ).rejects.toThrow('Valid product ID and positive quantity are required');
    });

    it('should validate zero quantity', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 0
      };

      await expect(
        cartService.addToCart(cartId, tenantId, addToCartRequest)
      ).rejects.toThrow('Valid product ID and positive quantity are required');
    });

    it('should validate required parameters', async () => {
      const addToCartRequest: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 1
      };

      await expect(
        cartService.addToCart('', 'tenant-demo', addToCartRequest)
      ).rejects.toThrow('Cart ID and tenant ID are required');

      await expect(
        cartService.addToCart('cart-123', '', addToCartRequest)
      ).rejects.toThrow('Cart ID and tenant ID are required');
    });
  });

  describe('Cart Operations', () => {
    it('should clear cart successfully', async () => {
      const cartId = 'cart-123';
      const tenantId = 'tenant-demo';

      const mockCart: Cart = {
        id: cartId,
        tenantId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCartRepository.findById.mockResolvedValue(mockCart);
      mockCartRepository.clear.mockResolvedValue(undefined);

      await cartService.clearCart(cartId, tenantId);

      expect(mockCartRepository.clear).toHaveBeenCalledWith(cartId, tenantId);
    });

    it('should handle tenant isolation correctly', async () => {
      const cartId = 'cart-123';
      const tenantId1 = 'tenant-demo';
      const tenantId2 = 'tenant-retail';

      mockCartRepository.findById.mockResolvedValue(null);

      await expect(
        cartService.getCart(cartId, tenantId2)
      ).resolves.toBeNull();

      expect(mockCartRepository.findById).toHaveBeenCalledWith(cartId, tenantId2);
    });
  });
});
