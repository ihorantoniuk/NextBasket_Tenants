import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { UpsellService } from './upsell.service';
import { OrderRepository } from '../repositories/order.repository';
import { CheckoutRequest, CheckoutResponse, Order, OrderItem, UpsellSuggestion } from '../types';
import { config } from '../config';
import { logger } from '../middleware/logger';

export class CheckoutService {
  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private upsellService: UpsellService,
    private orderRepository: OrderRepository
  ) {}

  async processCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    if (!request.cartId || !request.tenantId) {
      throw new Error('Cart ID and tenant ID are required');
    }

    logger.info(`Processing checkout for cart ${request.cartId}, tenant ${request.tenantId}`);

    // Step 1: Validate cart
    const validation = await this.cartService.validateCartForCheckout(request.cartId, request.tenantId);
    if (!validation.valid || !validation.cart) {
      throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
    }

    const cart = validation.cart;

    try {
      // Step 2: Reserve stock atomically
      const reservationResults = await this.reserveStock(cart.items, request.tenantId);
      
      try {
        // Step 3: Calculate pricing
        const pricing = await this.calculatePricing(cart.items, request.tenantId, request.promoCode);

        // Step 4: Generate upsell suggestions (parallel to order creation)
        const upsellPromise = this.generateUpsellSuggestions(cart, request.tenantId);

        // Step 5: Create order
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
          upsellSuggestions: [] // Will be updated below
        });

        // Step 6: Get upsell suggestions
        const upsellSuggestions = await upsellPromise;

        // Step 7: Update order with upsell suggestions if any
        if (upsellSuggestions.length > 0) {
          // In a real system, you might want to update the order record
          // For now, we'll include them in the response
        }

        // Step 8: Clear the cart (optional - depends on business logic)
        await this.cartService.clearCart(request.cartId, request.tenantId);

        logger.info(`Checkout completed successfully for order ${order.id}`);

        return {
          orderId: order.id,
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          vat: pricing.vat,
          total: pricing.total,
          upsellSuggestions
        };

      } catch (error) {
        // Rollback stock reservations
        await this.rollbackStockReservations(reservationResults, request.tenantId);
        throw error;
      }

    } catch (error) {
      logger.error('Checkout failed:', error);
      throw error;
    }
  }

  private async reserveStock(cartItems: any[], tenantId: string): Promise<Array<{ productId: string; quantity: number; success: boolean }>> {
    const results = [];
    
    for (const item of cartItems) {
      const success = await this.productService.reserveStock(item.productId, tenantId, item.quantity);
      results.push({
        productId: item.productId,
        quantity: item.quantity,
        success
      });

      if (!success) {
        // Rollback previous reservations
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

  private async rollbackStockReservations(reservations: Array<{ productId: string; quantity: number; success: boolean }>, tenantId: string): Promise<void> {
    for (const reservation of reservations) {
      if (reservation.success) {
        try {
          await this.productService.releaseStock(reservation.productId, tenantId, reservation.quantity);
        } catch (error) {
          logger.error(`Failed to rollback stock reservation for product ${reservation.productId}:`, error);
        }
      }
    }
  }

  private async calculatePricing(cartItems: any[], tenantId: string, promoCode?: string): Promise<{
    subtotal: number;
    discount: number;
    vat: number;
    total: number;
  }> {
    // Calculate subtotal
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Apply promo code discount
    let discount = 0;
    if (promoCode) {
      discount = this.calculatePromoDiscount(subtotal, promoCode);
    }

    // Calculate total after discount but before VAT
    const totalAfterDiscount = subtotal - discount;

    // Calculate VAT on the discounted amount
    const vat = totalAfterDiscount * config.business.vatRate;

    // Final total
    const total = totalAfterDiscount + vat;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  private calculatePromoDiscount(subtotal: number, promoCode: string): number {
    const code = promoCode.toUpperCase();
    
    if (code === 'SUMMER10' && config.features.summer10Enabled) {
      return subtotal * config.business.summer10Discount;
    }

    // Add more promo codes here as needed
    logger.warn(`Unknown or disabled promo code: ${promoCode}`);
    return 0;
  }

  private async buildOrderItems(cartItems: any[], tenantId: string): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

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

  private async generateUpsellSuggestions(cart: any, tenantId: string): Promise<UpsellSuggestion[]> {
    try {
      if (!config.features.upsellEnabled) {
        return [];
      }

      // Get all available products for upselling
      const allProducts = await this.productService.getProducts(tenantId, { page: 1, limit: 100 });
      
      // Build cart items for upsell analysis
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

      logger.info(`Generated ${upsellResponse.suggestions.length} upsell suggestions`);
      return upsellResponse.suggestions;

    } catch (error) {
      logger.error('Failed to generate upsell suggestions during checkout:', error);
      return []; // Don't fail checkout if upselling fails
    }
  }

  async getOrder(orderId: string, tenantId: string): Promise<Order | null> {
    if (!orderId || !tenantId) {
      throw new Error('Order ID and tenant ID are required');
    }

    return this.orderRepository.findById(orderId, tenantId);
  }

  async getOrdersByTenant(tenantId: string, limit?: number): Promise<Order[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.orderRepository.findByTenant(tenantId, limit);
  }

  async updateOrderStatus(orderId: string, tenantId: string, status: any): Promise<boolean> {
    if (!orderId || !tenantId) {
      throw new Error('Order ID and tenant ID are required');
    }

    return this.orderRepository.updateStatus(orderId, tenantId, status);
  }

  async getOrderStats(tenantId: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.orderRepository.getOrderStats(tenantId);
  }
}
