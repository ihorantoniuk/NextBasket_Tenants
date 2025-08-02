"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const cart_repository_1 = require("../repositories/cart.repository");
const logger_1 = require("../middleware/logger");
class ProductService {
    constructor(productRepository) {
        this.productRepository = productRepository;
        this.cartRepository = new cart_repository_1.CartRepository();
    }
    async createProduct(tenantId, productData) {
        if (!productData.name || productData.name.trim().length === 0) {
            throw new Error('Product name is required');
        }
        if (productData.price <= 0) {
            throw new Error('Product price must be greater than 0');
        }
        if (productData.stock < 0) {
            throw new Error('Product stock cannot be negative');
        }
        const sanitizedTags = productData.tags
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);
        const sanitizedProductData = {
            ...productData,
            name: productData.name.trim(),
            description: productData.description?.trim() || '',
            tags: sanitizedTags,
            price: Math.round(productData.price * 100) / 100,
            stock: Math.floor(productData.stock)
        };
        return this.productRepository.create(tenantId, sanitizedProductData);
    }
    async getProduct(id, tenantId) {
        if (!id || !tenantId) {
            throw new Error('Product ID and tenant ID are required');
        }
        return this.productRepository.findById(id, tenantId);
    }
    async getProducts(tenantId, pagination) {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        const validatedPagination = {
            page: Math.max(1, pagination?.page || 1),
            limit: Math.min(Math.max(1, pagination?.limit || 10), 100)
        };
        return this.productRepository.findAll(tenantId, validatedPagination);
    }
    async updateProduct(id, tenantId, updates) {
        if (!id || !tenantId) {
            throw new Error('Product ID and tenant ID are required');
        }
        const sanitizedUpdates = {};
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
    async deleteProduct(id, tenantId) {
        if (!id || !tenantId) {
            throw new Error('Product ID and tenant ID are required');
        }
        return this.productRepository.delete(id, tenantId);
    }
    async checkStock(productId, tenantId, requiredQuantity) {
        const product = await this.productRepository.findById(productId, tenantId);
        if (!product) {
            throw new Error('Product not found');
        }
        const pendingStock = await this.cartRepository.getPendingStockForProduct(productId, tenantId);
        const availableStock = product.stock - pendingStock;
        logger_1.logger.info(`Stock check for product ${productId}: total=${product.stock}, pending=${pendingStock}, available=${availableStock}, required=${requiredQuantity}`);
        return availableStock >= requiredQuantity;
    }
    async getAvailableStock(productId, tenantId) {
        const product = await this.productRepository.findById(productId, tenantId);
        if (!product) {
            throw new Error('Product not found');
        }
        const pendingStock = await this.cartRepository.getPendingStockForProduct(productId, tenantId);
        const availableStock = Math.max(0, product.stock - pendingStock);
        return availableStock;
    }
    async reserveStock(productId, tenantId, quantity) {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        const success = await this.productRepository.updateStock(productId, tenantId, quantity, 'reserve');
        if (success) {
            logger_1.logger.info(`Stock reserved: ${quantity} units for product ${productId}`);
        }
        else {
            logger_1.logger.warn(`Failed to reserve stock: ${quantity} units for product ${productId}`);
        }
        return success;
    }
    async releaseStock(productId, tenantId, quantity) {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        const success = await this.productRepository.updateStock(productId, tenantId, quantity, 'release');
        if (success) {
            logger_1.logger.info(`Stock released: ${quantity} units for product ${productId}`);
        }
        return success;
    }
    async getProductsByIds(productIds, tenantId) {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        if (productIds.length === 0) {
            return [];
        }
        return this.productRepository.findByIds(productIds, tenantId);
    }
    async searchProducts(tenantId, searchTerm, pagination) {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        const allProducts = await this.productRepository.findAll(tenantId, { page: 1, limit: 1000 });
        const filteredProducts = allProducts.data.filter(product => {
            const searchLower = searchTerm.toLowerCase();
            return (product.name.toLowerCase().includes(searchLower) ||
                product.description.toLowerCase().includes(searchLower) ||
                product.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        });
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
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map