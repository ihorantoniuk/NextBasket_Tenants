import { ProductService } from '../../src/services/product.service';
import { ProductRepository } from '../../src/repositories/product.repository';
import { CartRepository } from '../../src/repositories/cart.repository';
import { Product } from '../../src/types';

// Mock the repositories
jest.mock('../../src/repositories/product.repository');
jest.mock('../../src/repositories/cart.repository');
jest.mock('../../src/middleware/logger');

describe('ProductService - Available Stock Functionality', () => {
  let productService: ProductService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockCartRepository: jest.Mocked<CartRepository>;

  beforeEach(() => {
    mockProductRepository = new ProductRepository() as jest.Mocked<ProductRepository>;
    mockCartRepository = new CartRepository() as jest.Mocked<CartRepository>;
    productService = new ProductService(mockProductRepository);
    
    // Inject cart repository (since it's created in constructor)
    (productService as any).cartRepository = mockCartRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Available Stock Calculation - Core Issue #5: Button State Management', () => {
    it('should return correct available stock when no items are pending', async () => {
      const productId = 'prod-1';
      const tenantId = 'tenant-demo';

      const mockProduct: Product = {
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

      const mockProduct: Product = {
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
      mockCartRepository.getPendingStockForProduct.mockResolvedValue(53); // 53 items pending

      const availableStock = await productService.getAvailableStock(productId, tenantId);

      expect(availableStock).toBe(22); // 75 - 53 = 22
      expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenantId);
    });

    it('should return 0 when all stock is pending in carts', async () => {
      const productId = 'prod-1';
      const tenantId = 'tenant-demo';

      const mockProduct: Product = {
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
      mockCartRepository.getPendingStockForProduct.mockResolvedValue(75); // All 75 items pending

      const availableStock = await productService.getAvailableStock(productId, tenantId);

      expect(availableStock).toBe(0);
      expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenantId);
    });

    it('should return 0 when pending stock exceeds total stock', async () => {
      const productId = 'prod-1';
      const tenantId = 'tenant-demo';

      const mockProduct: Product = {
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
      mockCartRepository.getPendingStockForProduct.mockResolvedValue(100); // More than total stock

      const availableStock = await productService.getAvailableStock(productId, tenantId);

      expect(availableStock).toBe(0); // Should not go negative
      expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenantId);
    });

    it('should throw error for non-existent product', async () => {
      const productId = 'invalid-product';
      const tenantId = 'tenant-demo';

      mockProductRepository.findById.mockResolvedValue(null);

      await expect(
        productService.getAvailableStock(productId, tenantId)
      ).rejects.toThrow('Product not found');

      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId, tenantId);
    });
  });

  describe('Stock Check Integration - Multi-Cart Scenario', () => {
    it('should validate stock correctly across multiple carts', async () => {
      const productId = 'prod-1';
      const tenantId = 'tenant-demo';

      const mockProduct: Product = {
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
      mockCartRepository.getPendingStockForProduct.mockResolvedValue(70); // 70 items in other carts

      // Should pass when requesting 5 items (70 + 5 = 75, exactly at limit)
      const canAdd5 = await productService.checkStock(productId, tenantId, 5);
      expect(canAdd5).toBe(true);

      // Should fail when requesting 6 items (70 + 6 = 76, exceeds 75)
      const canAdd6 = await productService.checkStock(productId, tenantId, 6);
      expect(canAdd6).toBe(false);
    });
  });

  describe('Tenant Isolation - Core Issue #6: Multi-tenant Support', () => {
    it('should respect tenant boundaries for stock calculations', async () => {
      const productId = 'prod-1';
      const tenant1 = 'tenant-demo';
      const tenant2 = 'tenant-retail';

      const mockProduct1: Product = {
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

      const mockProduct2: Product = {
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

      // Mock different products for different tenants
      mockProductRepository.findById
        .mockImplementation((id: string, tenantId: string) => {
          if (tenantId === tenant1) return Promise.resolve(mockProduct1);
          if (tenantId === tenant2) return Promise.resolve(mockProduct2);
          return Promise.resolve(null);
        });

      // Mock different pending stock for different tenants
      mockCartRepository.getPendingStockForProduct
        .mockImplementation((id: string, tenantId: string) => {
          if (tenantId === tenant1) return Promise.resolve(10); // 10 pending for demo
          if (tenantId === tenant2) return Promise.resolve(25); // 25 pending for retail
          return Promise.resolve(0);
        });

      const availableStock1 = await productService.getAvailableStock(productId, tenant1);
      const availableStock2 = await productService.getAvailableStock(productId, tenant2);

      expect(availableStock1).toBe(40); // 50 - 10 = 40
      expect(availableStock2).toBe(75); // 100 - 25 = 75

      // Verify tenant isolation in calls
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId, tenant1);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId, tenant2);
      expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenant1);
      expect(mockCartRepository.getPendingStockForProduct).toHaveBeenCalledWith(productId, tenant2);
    });
  });
});
