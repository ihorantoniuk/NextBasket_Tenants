"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const config_1 = require("../config");
const logger_1 = require("../middleware/logger");
class CheckoutService {
    constructor(cartService, productService, upsellService, orderRepository) {
        this.cartService = cartService;
        this.productService = productService;
        this.upsellService = upsellService;
        this.orderRepository = orderRepository;
    }
    async processCheckout(request) {
        if (!request.cartId || !request.tenantId) {
            throw new Error('Cart ID and tenant ID are required');
        }
        logger_1.logger.info(`Processing checkout for cart ${request.cartId}, tenant ${request.tenantId}`);
        const validation = await this.cartService.validateCartForCheckout(request.cartId, request.tenantId);
        if (!validation.valid || !validation.cart) {
            throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
        }
        const cart = validation.cart;
        try {
            const reservationResults = await this.reserveStock(cart.items, request.tenantId);
            try {
                const pricing = await this.calculatePricing(cart.items, request.tenantId, request.promoCode);
                const upsellPromise = this.generateUpsellSuggestions(cart, request.tenantId);
                const orderItems = await this.buildOrderItems(cart.items, request.tenantId);
                const order = await this.orderRepository.create({
                    tenantId: request.tenantId,
                    cartId: request.cartId,
                    items: orderItems,
                    subtotal: pricing.subtotal,
                    discount: pricing.discount,
                    vat: pricing.vat,
                    total: pricing.total,
                    promoCode: request.promoCode,
                    upsellSuggestions: []
                });
                const upsellSuggestions = await upsellPromise;
                if (upsellSuggestions.length > 0) {
                }
                await this.cartService.clearCart(request.cartId, request.tenantId);
                logger_1.logger.info(`Checkout completed successfully for order ${order.id}`);
                return {
                    orderId: order.id,
                    subtotal: pricing.subtotal,
                    discount: pricing.discount,
                    vat: pricing.vat,
                    total: pricing.total,
                    upsellSuggestions
                };
            }
            catch (error) {
                await this.rollbackStockReservations(reservationResults, request.tenantId);
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Checkout failed:', error);
            throw error;
        }
    }
    async reserveStock(cartItems, tenantId) {
        const results = [];
        for (const item of cartItems) {
            const success = await this.productService.reserveStock(item.productId, tenantId, item.quantity);
            results.push({
                productId: item.productId,
                quantity: item.quantity,
                success
            });
            if (!success) {
                for (let i = results.length - 2; i >= 0; i--) {
                    if (results[i].success) {
                        await this.productService.releaseStock(results[i].productId, tenantId, results[i].quantity);
                    }
                }
                throw new Error(`Failed to reserve stock for product ${item.productId}`);
            }
        }
        return results;
    }
    async rollbackStockReservations(reservations, tenantId) {
        for (const reservation of reservations) {
            if (reservation.success) {
                try {
                    await this.productService.releaseStock(reservation.productId, tenantId, reservation.quantity);
                }
                catch (error) {
                    logger_1.logger.error(`Failed to rollback stock reservation for product ${reservation.productId}:`, error);
                }
            }
        }
    }
    async calculatePricing(cartItems, tenantId, promoCode) {
        const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        let discount = 0;
        if (promoCode) {
            discount = this.calculatePromoDiscount(subtotal, promoCode);
        }
        const totalAfterDiscount = subtotal - discount;
        const vat = totalAfterDiscount * config_1.config.business.vatRate;
        const total = totalAfterDiscount + vat;
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            vat: Math.round(vat * 100) / 100,
            total: Math.round(total * 100) / 100
        };
    }
    calculatePromoDiscount(subtotal, promoCode) {
        const code = promoCode.toUpperCase();
        if (code === 'SUMMER10' && config_1.config.features.summer10Enabled) {
            return subtotal * config_1.config.business.summer10Discount;
        }
        logger_1.logger.warn(`Unknown or disabled promo code: ${promoCode}`);
        return 0;
    }
    async buildOrderItems(cartItems, tenantId) {
        const orderItems = [];
        for (const item of cartItems) {
            const product = await this.productService.getProduct(item.productId, tenantId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found during order creation`);
            }
            orderItems.push({
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity
            });
        }
        return orderItems;
    }
    async generateUpsellSuggestions(cart, tenantId) {
        try {
            if (!config_1.config.features.upsellEnabled) {
                return [];
            }
            const allProducts = await this.productService.getProducts(tenantId, { page: 1, limit: 100 });
            const cartItems = [];
            for (const item of cart.items) {
                const product = await this.productService.getProduct(item.productId, tenantId);
                if (product) {
                    cartItems.push({
                        productId: product.id,
                        productName: product.name,
                        quantity: item.quantity,
                        price: item.price,
                        tags: product.tags
                    });
                }
            }
            const upsellResponse = await this.upsellService.generateUpsellSuggestions({
                cartItems,
                availableProducts: allProducts.data,
                maxSuggestions: 3
            });
            logger_1.logger.info(`Generated ${upsellResponse.suggestions.length} upsell suggestions`);
            return upsellResponse.suggestions;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate upsell suggestions during checkout:', error);
            return [];
        }
    }
    async getOrder(orderId, tenantId) {
        if (!orderId || !tenantId) {
            throw new Error('Order ID and tenant ID are required');
        }
        return this.orderRepository.findById(orderId, tenantId);
    }
    async getOrdersByTenant(tenantId, limit) {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        return this.orderRepository.findByTenant(tenantId, limit);
    }
    async updateOrderStatus(orderId, tenantId, status) {
        if (!orderId || !tenantId) {
            throw new Error('Order ID and tenant ID are required');
        }
        return this.orderRepository.updateStatus(orderId, tenantId, status);
    }
    async getOrderStats(tenantId) {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        return this.orderRepository.getOrderStats(tenantId);
    }
}
exports.CheckoutService = CheckoutService;
//# sourceMappingURL=checkout.service.js.map