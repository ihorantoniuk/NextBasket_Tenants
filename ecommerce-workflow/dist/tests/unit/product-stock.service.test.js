"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const product_service_1 = require("../../src/services/product.service");
const product_repository_1 = require("../../src/repositories/product.repository");
const cart_repository_1 = require("../../src/repositories/cart.repository");
jest.mock('../../src/repositories/product.repository');
jest.mock('../../src/repositories/cart.repository');
jest.mock('../../src/middleware/logger');
describe('ProductService - Available Stock Functionality', () => {
    let productService;
    let mockProductRepository;
    let mockCartRepository;
    beforeEach(() => {
        mockProductRepository = new product_repository_1.ProductRepository();
        mockCartRepository = new cart_repository_1.CartRepository();
        productService = new product_service_1.ProductService(mockProductRepository);
        productService.cartRepository = mockCartRepository;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Available Stock Calculation - Core Issue #5: Button State Management', () => {
        it('should return correct available stock when no items are pending', async () => {
            const productId = 'prod-1';
            const tenantId = 'tenant-demo';
            const mockProduct = {
                id: productId,
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: 29.99,
                stock: 75,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCartRepository.getPendingStockForProduct.mockResolvedValue(0);
            const availableStock = await productService.getAvailableStock(productId, tenantId);
            expect(availableStock).toBe(75);
            expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenantId);
        });
        it('should return correct available stock when items are pending in carts', async () => {
            const productId = 'prod-1';
            const tenantId = 'tenant-demo';
            const mockProduct = {
                id: productId,
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: 29.99,
                stock: 75,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCartRepository.getPendingStockForProduct.mockResolvedValue(53);
            const availableStock = await productService.getAvailableStock(productId, tenantId);
            expect(availableStock).toBe(22);
            expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenantId);
        });
        it('should return 0 when all stock is pending in carts', async () => {
            const productId = 'prod-1';
            const tenantId = 'tenant-demo';
            const mockProduct = {
                id: productId,
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: 29.99,
                stock: 75,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCartRepository.getPendingStockForProduct.mockResolvedValue(75);
            const availableStock = await productService.getAvailableStock(productId, tenantId);
            expect(availableStock).toBe(0);
            expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenantId);
        });
        it('should return 0 when pending stock exceeds total stock', async () => {
            const productId = 'prod-1';
            const tenantId = 'tenant-demo';
            const mockProduct = {
                id: productId,
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: 29.99,
                stock: 75,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCartRepository.getPendingStockForProduct.mockResolvedValue(100);
            const availableStock = await productService.getAvailableStock(productId, tenantId);
            expect(availableStock).toBe(0);
            expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenantId);
        });
        it('should throw error for non-existent product', async () => {
            const productId = 'invalid-product';
            const tenantId = 'tenant-demo';
            mockProductRepository.findById.mockResolvedValue(null);
            await expect(productService.getAvailableStock(productId, tenantId)).rejects.toThrow('Product not found');
            expect(mockProductRepository.findById).toHaveBeenCalledWith(productId, tenantId);
        });
    });
    describe('Stock Check Integration - Multi-Cart Scenario', () => {
        it('should validate stock correctly across multiple carts', async () => {
            const productId = 'prod-1';
            const tenantId = 'tenant-demo';
            const mockProduct = {
                id: productId,
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: 29.99,
                stock: 75,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.findById.mockResolvedValue(mockProduct);
            mockCartRepository.getPendingStockForProduct.mockResolvedValue(70);
            const canAdd5 = await productService.checkStock(productId, tenantId, 5);
            expect(canAdd5).toBe(true);
            const canAdd6 = await productService.checkStock(productId, tenantId, 6);
            expect(canAdd6).toBe(false);
        });
    });
    describe('Tenant Isolation - Core Issue #6: Multi-tenant Support', () => {
        it('should respect tenant boundaries for stock calculations', async () => {
            const productId = 'prod-1';
            const tenant1 = 'tenant-demo';
            const tenant2 = 'tenant-retail';
            const mockProduct1 = {
                id: productId,
                tenantId: tenant1,
                name: 'Demo Product',
                description: 'Demo Description',
                tags: ['electronics'],
                price: 29.99,
                stock: 50,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const mockProduct2 = {
                id: productId,
                tenantId: tenant2,
                name: 'Retail Product',
                description: 'Retail Description',
                tags: ['electronics'],
                price: 29.99,
                stock: 100,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.findById
                .mockImplementation((id, tenantId) => {
                if (tenantId === tenant1)
                    return Promise.resolve(mockProduct1);
                if (tenantId === tenant2)
                    return Promise.resolve(mockProduct2);
                return Promise.resolve(null);
            });
            mockCartRepository.getPendingStockForProduct
                .mockImplementation((id, tenantId) => {
                if (tenantId === tenant1)
                    return Promise.resolve(10);
                if (tenantId === tenant2)
                    return Promise.resolve(25);
                return Promise.resolve(0);
            });
            const availableStock1 = await productService.getAvailableStock(productId, tenant1);
            const availableStock2 = await productService.getAvailableStock(productId, tenant2);
            expect(availableStock1).toBe(40);
            expect(availableStock2).toBe(75);
            expect(mockProductRepository.findById).toHaveBeenCalledWith(productId, tenant1);
            expect(mockProductRepository.findById).toHaveBeenCalledWith(productId, tenant2);
            expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenant1);
            expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenant2);
        });
    });
});
//# sourceMappingURL=product-stock.service.test.js.map