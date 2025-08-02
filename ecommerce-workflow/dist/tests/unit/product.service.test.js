"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const product_service_1 = require("../../src/services/product.service");
const product_repository_1 = require("../../src/repositories/product.repository");
jest.mock('../../src/repositories/product.repository');
jest.mock('../../src/middleware/logger');
describe('ProductService', () => {
    let productService;
    let mockProductRepository;
    beforeEach(() => {
        mockProductRepository = new product_repository_1.ProductRepository();
        productService = new product_service_1.ProductService(mockProductRepository);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createProduct', () => {
        it('should create a product with valid data', async () => {
            const tenantId = 'tenant-123';
            const productData = {
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics', 'gadget'],
                price: 99.99,
                stock: 10
            };
            const expectedProduct = {
                id: 'product-123',
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics', 'gadget'],
                price: 99.99,
                stock: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.create.mockResolvedValue(expectedProduct);
            const result = await productService.createProduct(tenantId, productData);
            expect(mockProductRepository.create).toHaveBeenCalledWith(tenantId, expect.objectContaining({
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics', 'gadget'],
                price: 99.99,
                stock: 10
            }));
            expect(result).toEqual(expectedProduct);
        });
        it('should throw error for empty product name', async () => {
            const tenantId = 'tenant-123';
            const productData = {
                name: '',
                description: 'Test Description',
                tags: ['electronics'],
                price: 99.99,
                stock: 10
            };
            await expect(productService.createProduct(tenantId, productData))
                .rejects.toThrow('Product name is required');
            expect(mockProductRepository.create).not.toHaveBeenCalled();
        });
        it('should throw error for negative price', async () => {
            const tenantId = 'tenant-123';
            const productData = {
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: -10,
                stock: 10
            };
            await expect(productService.createProduct(tenantId, productData))
                .rejects.toThrow('Product price must be greater than 0');
            expect(mockProductRepository.create).not.toHaveBeenCalled();
        });
        it('should throw error for negative stock', async () => {
            const tenantId = 'tenant-123';
            const productData = {
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: 99.99,
                stock: -5
            };
            await expect(productService.createProduct(tenantId, productData))
                .rejects.toThrow('Product stock cannot be negative');
            expect(mockProductRepository.create).not.toHaveBeenCalled();
        });
        it('should sanitize tags and round price', async () => {
            const tenantId = 'tenant-123';
            const productData = {
                name: '  Test Product  ',
                description: '  Test Description  ',
                tags: ['  Electronics  ', 'GADGET', ''],
                price: 99.999,
                stock: 10.7
            };
            const expectedProduct = {
                id: 'product-123',
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics', 'gadget'],
                price: 100.00,
                stock: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.create.mockResolvedValue(expectedProduct);
            await productService.createProduct(tenantId, productData);
            expect(mockProductRepository.create).toHaveBeenCalledWith(tenantId, expect.objectContaining({
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics', 'gadget'],
                price: 100.00,
                stock: 10
            }));
        });
    });
    describe('getProduct', () => {
        it('should return product when found', async () => {
            const productId = 'product-123';
            const tenantId = 'tenant-123';
            const expectedProduct = {
                id: productId,
                tenantId,
                name: 'Test Product',
                description: 'Test Description',
                tags: ['electronics'],
                price: 99.99,
                stock: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockProductRepository.findById.mockResolvedValue(expectedProduct);
            const result = await productService.getProduct(productId, tenantId);
            expect(mockProductRepository.findById).toHaveBeenCalledWith(productId, tenantId);
            expect(result).toEqual(expectedProduct);
        });
        it('should return null when product not found', async () => {
            const productId = 'product-123';
            const tenantId = 'tenant-123';
            mockProductRepository.findById.mockResolvedValue(null);
            const result = await productService.getProduct(productId, tenantId);
            expect(result).toBeNull();
        });
        it('should throw error for missing parameters', async () => {
            await expect(productService.getProduct('', 'tenant-123'))
                .rejects.toThrow('Product ID and tenant ID are required');
            await expect(productService.getProduct('product-123', ''))
                .rejects.toThrow('Product ID and tenant ID are required');
        });
    });
    describe('reserveStock', () => {
        it('should reserve stock successfully', async () => {
            const productId = 'product-123';
            const tenantId = 'tenant-123';
            const quantity = 5;
            mockProductRepository.updateStock.mockResolvedValue(true);
            const result = await productService.reserveStock(productId, tenantId, quantity);
            expect(mockProductRepository.updateStock).toHaveBeenCalledWith(productId, tenantId, quantity, 'reserve');
            expect(result).toBe(true);
        });
        it('should throw error for invalid quantity', async () => {
            const productId = 'product-123';
            const tenantId = 'tenant-123';
            await expect(productService.reserveStock(productId, tenantId, 0))
                .rejects.toThrow('Quantity must be greater than 0');
            await expect(productService.reserveStock(productId, tenantId, -5))
                .rejects.toThrow('Quantity must be greater than 0');
            expect(mockProductRepository.updateStock).not.toHaveBeenCalled();
        });
    });
    describe('searchProducts', () => {
        it('should search products by name', async () => {
            const tenantId = 'tenant-123';
            const searchTerm = 'wireless';
            const products = [
                {
                    id: 'product-1',
                    tenantId,
                    name: 'Wireless Headphones',
                    description: 'Great sound quality',
                    tags: ['electronics', 'audio'],
                    price: 99.99,
                    stock: 10,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'product-2',
                    tenantId,
                    name: 'Wired Headphones',
                    description: 'Traditional wired headphones',
                    tags: ['electronics', 'audio'],
                    price: 49.99,
                    stock: 5,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
            mockProductRepository.findAll.mockResolvedValue({
                data: products,
                pagination: {
                    page: 1,
                    limit: 1000,
                    total: 2,
                    totalPages: 1
                }
            });
            const result = await productService.searchProducts(tenantId, searchTerm);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Wireless Headphones');
        });
    });
});
//# sourceMappingURL=product.service.test.js.map