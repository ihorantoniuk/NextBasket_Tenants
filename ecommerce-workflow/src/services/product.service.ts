import { ProductRepository } from '../repositories/product.repository';
import { CartRepository } from '../repositories/cart.repository';
import { Product, CreateProductRequest, UpdateProductRequest, PaginationParams, PaginatedResponse } from '../types';
import { logger } from '../middleware/logger';

export class ProductService {
  private cartRepository: CartRepository;
  
  constructor(private productRepository: ProductRepository) {
    this.cartRepository = new CartRepository();
  }

  async createProduct(tenantId: string, productData: CreateProductRequest): Promise<Product> {
    // Validate input
    if (!productData.name || productData.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (productData.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    if (productData.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }

    // Sanitize tags
    const sanitizedTags = productData.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    const sanitizedProductData: CreateProductRequest = {
      ...productData,
      name: productData.name.trim(),
      description: productData.description?.trim() || '',
      tags: sanitizedTags,
      price: Math.round(productData.price * 100) / 100, // Round to 2 decimal places
      stock: Math.floor(productData.stock)
    };

    return this.productRepository.create(tenantId, sanitizedProductData);
  }

  async getProduct(id: string, tenantId: string): Promise<Product | null> {
    if (!id || !tenantId) {
      throw new Error('Product ID and tenant ID are required');
    }

    return this.productRepository.findById(id, tenantId);
  }

  async getProducts(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validate pagination
    const validatedPagination = {
      page: Math.max(1, pagination?.page || 1),
      limit: Math.min(Math.max(1, pagination?.limit || 10), 100) // Max 100 items per page
    };

    return this.productRepository.findAll(tenantId, validatedPagination);
  }

  async updateProduct(id: string, tenantId: string, updates: UpdateProductRequest): Promise<Product | null> {
    if (!id || !tenantId) {
      throw new Error('Product ID and tenant ID are required');
    }

    // Validate updates
    const sanitizedUpdates: UpdateProductRequest = {};

    if (updates.name !== undefined) {
      if (updates.name.trim().length === 0) {
        throw new Error('Product name cannot be empty');
      }
      sanitizedUpdates.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      sanitizedUpdates.description = updates.description.trim();
    }

    if (updates.tags !== undefined) {
      sanitizedUpdates.tags = updates.tags
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);
    }

    if (updates.price !== undefined) {
      if (updates.price <= 0) {
        throw new Error('Product price must be greater than 0');
      }
      sanitizedUpdates.price = Math.round(updates.price * 100) / 100;
    }

    if (updates.stock !== undefined) {
      if (updates.stock < 0) {
        throw new Error('Product stock cannot be negative');
      }
      sanitizedUpdates.stock = Math.floor(updates.stock);
    }

    return this.productRepository.update(id, tenantId, sanitizedUpdates);
  }

  async deleteProduct(id: string, tenantId: string): Promise<boolean> {
    if (!id || !tenantId) {
      throw new Error('Product ID and tenant ID are required');
    }

    return this.productRepository.delete(id, tenantId);
  }

  async checkStock(productId: string, tenantId: string, requiredQuantity: number): Promise<boolean> {
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Get pending stock that's already in carts
    const pendingStock = await this.cartRepository.getPendingStockForProduct(productId, tenantId);
    
    // Available stock = total stock - pending stock in carts
    const availableStock = product.stock - pendingStock;
    
    logger.info(`Stock check for product ${productId}: total=${product.stock}, pending=${pendingStock}, available=${availableStock}, required=${requiredQuantity}`);
    
    return availableStock >= requiredQuantity;
  }

  async getAvailableStock(productId: string, tenantId: string): Promise<number> {
    const product = await this.productRepository.findById(productId, tenantId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Get pending stock that's already in carts
    const pendingStock = await this.cartRepository.getPendingStockForProduct(productId, tenantId);
    
    // Available stock = total stock - pending stock in carts
    const availableStock = Math.max(0, product.stock - pendingStock);
    
    return availableStock;
  }

  async reserveStock(productId: string, tenantId: string, quantity: number): Promise<boolean> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const success = await this.productRepository.updateStock(productId, tenantId, quantity, 'reserve');
    
    if (success) {
      logger.info(`Stock reserved: ${quantity} units for product ${productId}`);
    } else {
      logger.warn(`Failed to reserve stock: ${quantity} units for product ${productId}`);
    }

    return success;
  }

  async releaseStock(productId: string, tenantId: string, quantity: number): Promise<boolean> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const success = await this.productRepository.updateStock(productId, tenantId, quantity, 'release');
    
    if (success) {
      logger.info(`Stock released: ${quantity} units for product ${productId}`);
    }

    return success;
  }

  async getProductsByIds(productIds: string[], tenantId: string): Promise<Product[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (productIds.length === 0) {
      return [];
    }

    return this.productRepository.findByIds(productIds, tenantId);
  }

  async searchProducts(tenantId: string, searchTerm: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // For now, this is a simple implementation
    // In a real system, you might want to use a proper search engine like Elasticsearch
    const allProducts = await this.productRepository.findAll(tenantId, { page: 1, limit: 1000 });
    
    const filteredProducts = allProducts.data.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });

    // Apply pagination to filtered results
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.min(Math.max(1, pagination?.limit || 10), 100);
    const offset = (page - 1) * limit;

    const paginatedData = filteredProducts.slice(offset, offset + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      }
    };
  }
}
