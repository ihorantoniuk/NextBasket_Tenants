"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cart_service_1 = require("../../src/services/cart.service");
const cart_repository_1 = require("../../src/repositories/cart.repository");
const product_service_1 = require("../../src/services/product.service");
const errorHandler_1 = require("../../src/middleware/errorHandler");
jest.mock('../../src/repositories/cart.repository');
jest.mock('../../src/services/product.service');
jest.mock('../../src/middleware/logger');
describe('CartService - Comprehensive Test Suite', () => {
    let cartService;
    let mockCartRepository;
    let mockProductService;
    beforeEach(() => {
        mockCartRepository = new cart_repository_1.CartRepository();
        mockProductService = new product_service_1.ProductService(null);
        cartService = new cart_service_1.CartService(mockCartRepository, mockProductService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Stock Validation - Core Issue #1: Prevent Overselling', () => {
        it('should prevent adding more items than available stock', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: 10
            };
            const mockProduct = {
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
            await expect(cartService.addToCart(cartId, tenantId, addToCartRequest)).rejects.toThrow(errorHandler_1.ValidationError);
            expect(mockProductService.checkStock).toHaveBeenCalledWith('prod-1', tenantId, 10);
        });
        it('should allow adding items when sufficient stock is available', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: 5
            };
            const mockProduct = {
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
            const mockCart = {
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
            expect(mockProductService.checkStock).toHaveBeenCalledWith('prod-1', tenantId, 5);
            expect(mockCartRepository.addItem).toHaveBeenCalled();
        });
    });
    describe('Pending Stock Tracking - Core Issue #2', () => {
        it('should consider items in other carts when checking stock', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: 3
            };
            const mockProduct = {
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
            mockCartRepository.getPendingStockForProduct.mockResolvedValue(3);
            await expect(cartService.addToCart(cartId, tenantId, addToCartRequest)).rejects.toThrow('Insufficient stock available. Only 2 items available.');
            expect(mockProductService.checkStock).toHaveBeenCalledWith('prod-1', tenantId, 3);
        });
    });
    describe('Error Handling - Core Issue #3: Specific Error Messages', () => {
        it('should throw ValidationError with specific message for stock issues', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: 100
            };
            const mockProduct = {
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
            }
            catch (error) {
                expect(error).toBeInstanceOf(errorHandler_1.ValidationError);
                expect(error.message).toContain('Insufficient stock available. Only 5 items available.');
                expect(error.message).not.toBe('Internal Server Error');
            }
        });
        it('should throw Error with specific message for missing product', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'invalid-product',
                quantity: 1
            };
            mockProductService.getProduct.mockResolvedValue(null);
            await expect(cartService.addToCart(cartId, tenantId, addToCartRequest)).rejects.toThrow('Product not found');
        });
        it('should throw Error with specific message for missing cart', async () => {
            const cartId = 'invalid-cart';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: 1
            };
            const mockProduct = {
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
            await expect(cartService.addToCart(cartId, tenantId, addToCartRequest)).rejects.toThrow('Cart not found or access denied');
        });
    });
    describe('Input Validation', () => {
        it('should validate positive quantity', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: -1
            };
            await expect(cartService.addToCart(cartId, tenantId, addToCartRequest)).rejects.toThrow('Valid product ID and positive quantity are required');
        });
        it('should validate zero quantity', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: 0
            };
            await expect(cartService.addToCart(cartId, tenantId, addToCartRequest)).rejects.toThrow('Valid product ID and positive quantity are required');
        });
        it('should validate required parameters', async () => {
            const addToCartRequest = {
                productId: 'prod-1',
                quantity: 1
            };
            await expect(cartService.addToCart('', 'tenant-demo', addToCartRequest)).rejects.toThrow('Cart ID and tenant ID are required');
            await expect(cartService.addToCart('cart-123', '', addToCartRequest)).rejects.toThrow('Cart ID and tenant ID are required');
        });
    });
    describe('Cart Operations', () => {
        it('should clear cart successfully', async () => {
            const cartId = 'cart-123';
            const tenantId = 'tenant-demo';
            const mockCart = {
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
            await expect(cartService.getCart(cartId, tenantId2)).resolves.toBeNull();
            expect(mockCartRepository.findById).toHaveBeenCalledWith(cartId, tenantId2);
        });
    });
});
//# sourceMappingURL=cart.service.test.js.map