"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../middleware/logger");
class CartService {
    constructor(cartRepository, productService) {
        this.cartRepository = cartRepository;
        this.productService = productService;
    }
    async createCart(tenantId) {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        return this.cartRepository.create(tenantId);
    }
    async getCart(cartId, tenantId) {
        if (!cartId || !tenantId) {
            throw new Error('Cart ID and tenant ID are required');
        }
        return this.cartRepository.findById(cartId, tenantId);
    }
    async addToCart(cartId, tenantId, item) {
        if (!cartId || !tenantId) {
            throw new Error('Cart ID and tenant ID are required');
        }
        if (!item.productId || item.quantity <= 0) {
            throw new Error('Valid product ID and positive quantity are required');
        }
        const product = await this.productService.getProduct(item.productId, tenantId);
        if (!product) {
            throw new Error('Product not found');
        }
        const hasStock = await this.productService.checkStock(item.productId, tenantId, item.quantity);
        if (!hasStock) {
            const pendingStock = await this.cartRepository.getPendingStockForProduct(item.productId, tenantId);
            const availableStock = Math.max(0, product.stock - pendingStock);
            throw new errorHandler_1.ValidationError(`Insufficient stock available. Only ${availableStock} items available.`);
        }
        await this.cartRepository.addItem(cartId, tenantId, item, product.price);
        logger_1.logger.info(`Added ${item.quantity}x ${product.name} to cart ${cartId}`);
    }
    async updateCartItem(cartId, tenantId, update) {
        if (!cartId || !tenantId) {
            throw new Error('Cart ID and tenant ID are required');
        }
        if (!update.productId) {
            throw new Error('Product ID is required');
        }
        if (update.quantity < 0) {
            throw new Error('Quantity cannot be negative');
        }
        if (update.quantity > 0) {
            const product = await this.productService.getProduct(update.productId, tenantId);
            if (!product) {
                throw new Error('Product not found');
            }
            const hasStock = await this.productService.checkStock(update.productId, tenantId, update.quantity);
            if (!hasStock) {
                throw new Error('Insufficient stock');
            }
        }
        await this.cartRepository.updateItem(cartId, tenantId, update.productId, update.quantity);
        if (update.quantity === 0) {
            logger_1.logger.info(`Removed product ${update.productId} from cart ${cartId}`);
        }
        else {
            logger_1.logger.info(`Updated cart ${cartId}: product ${update.productId} quantity to ${update.quantity}`);
        }
    }
    async removeFromCart(cartId, tenantId, productId) {
        if (!cartId || !tenantId || !productId) {
            throw new Error('Cart ID, tenant ID, and product ID are required');
        }
        await this.cartRepository.removeItem(cartId, tenantId, productId);
        logger_1.logger.info(`Removed product ${productId} from cart ${cartId}`);
    }
    async clearCart(cartId, tenantId) {
        if (!cartId || !tenantId) {
            throw new Error('Cart ID and tenant ID are required');
        }
        await this.cartRepository.clear(cartId, tenantId);
        logger_1.logger.info(`Cleared cart ${cartId}`);
    }
    async deleteCart(cartId, tenantId) {
        if (!cartId || !tenantId) {
            throw new Error('Cart ID and tenant ID are required');
        }
        const deleted = await this.cartRepository.delete(cartId, tenantId);
        if (deleted) {
            logger_1.logger.info(`Deleted cart ${cartId}`);
        }
        return deleted;
    }
    async getCartValue(cartId, tenantId) {
        if (!cartId || !tenantId) {
            throw new Error('Cart ID and tenant ID are required');
        }
        return this.cartRepository.getCartValue(cartId, tenantId);
    }
    async validateCartForCheckout(cartId, tenantId) {
        const errors = [];
        const cart = await this.getCart(cartId, tenantId);
        if (!cart) {
            errors.push('Cart not found');
            return { valid: false, errors, cart: null };
        }
        if (cart.items.length === 0) {
            errors.push('Cart is empty');
        }
        for (const item of cart.items) {
            const product = await this.productService.getProduct(item.productId, tenantId);
            if (!product) {
                errors.push(`Product ${item.productId} not found`);
                continue;
            }
            if (product.stock < item.quantity) {
                errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
            }
            if (Math.abs(product.price - item.price) > 0.01) {
                errors.push(`Price changed for ${product.name}. Current: $${product.price}, Cart: $${item.price}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            cart
        };
    }
    async getCartSummary(cartId, tenantId) {
        const cart = await this.getCart(cartId, tenantId);
        if (!cart) {
            return null;
        }
        const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        const uniqueItems = cart.items.length;
        return {
            cart,
            subtotal: Math.round(subtotal * 100) / 100,
            itemCount,
            uniqueItems
        };
    }
}
exports.CartService = CartService;
//# sourceMappingURL=cart.service.js.map