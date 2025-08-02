import { CartRepository } from '../repositories/cart.repository';
import { ProductService } from './product.service';
import { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private productService: ProductService
  ) {}

  async createCart(tenantId: string): Promise<Cart> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.cartRepository.create(tenantId);
  }

  async getCart(cartId: string, tenantId: string): Promise<Cart | null> {
    if (!cartId || !tenantId) {
      throw new Error('Cart ID and tenant ID are required');
    }

    return this.cartRepository.findById(cartId, tenantId);
  }

  async addToCart(cartId: string, tenantId: string, item: AddToCartRequest): Promise<void> {
    if (!cartId || !tenantId) {
      throw new Error('Cart ID and tenant ID are required');
    }

    if (!item.productId || item.quantity <= 0) {
      throw new Error('Valid product ID and positive quantity are required');
    }

    // Verify product exists and get current price
    const product = await this.productService.getProduct(item.productId, tenantId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if we have enough stock available (considering all pending stock in carts)
    const hasStock = await this.productService.checkStock(item.productId, tenantId, item.quantity);
    if (!hasStock) {
      // Get current available stock for better error message
      const pendingStock = await this.cartRepository.getPendingStockForProduct(item.productId, tenantId);
      const availableStock = Math.max(0, product.stock - pendingStock);
      throw new ValidationError(`Insufficient stock available. Only ${availableStock} items available.`);
    }

    await this.cartRepository.addItem(cartId, tenantId, item, product.price);
    
    logger.info(`Added ${item.quantity}x ${product.name} to cart ${cartId}`);
  }

  async updateCartItem(cartId: string, tenantId: string, update: UpdateCartItemRequest): Promise<void> {
    if (!cartId || !tenantId) {
      throw new Error('Cart ID and tenant ID are required');
    }

    if (!update.productId) {
      throw new Error('Product ID is required');
    }

    if (update.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // If quantity > 0, check stock availability
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
      logger.info(`Removed product ${update.productId} from cart ${cartId}`);
    } else {
      logger.info(`Updated cart ${cartId}: product ${update.productId} quantity to ${update.quantity}`);
    }
  }

  async removeFromCart(cartId: string, tenantId: string, productId: string): Promise<void> {
    if (!cartId || !tenantId || !productId) {
      throw new Error('Cart ID, tenant ID, and product ID are required');
    }

    await this.cartRepository.removeItem(cartId, tenantId, productId);
    
    logger.info(`Removed product ${productId} from cart ${cartId}`);
  }

  async clearCart(cartId: string, tenantId: string): Promise<void> {
    if (!cartId || !tenantId) {
      throw new Error('Cart ID and tenant ID are required');
    }

    await this.cartRepository.clear(cartId, tenantId);
    
    logger.info(`Cleared cart ${cartId}`);
  }

  async deleteCart(cartId: string, tenantId: string): Promise<boolean> {
    if (!cartId || !tenantId) {
      throw new Error('Cart ID and tenant ID are required');
    }

    const deleted = await this.cartRepository.delete(cartId, tenantId);
    
    if (deleted) {
      logger.info(`Deleted cart ${cartId}`);
    }

    return deleted;
  }

  async getCartValue(cartId: string, tenantId: string): Promise<number> {
    if (!cartId || !tenantId) {
      throw new Error('Cart ID and tenant ID are required');
    }

    return this.cartRepository.getCartValue(cartId, tenantId);
  }

  async validateCartForCheckout(cartId: string, tenantId: string): Promise<{
    valid: boolean;
    errors: string[];
    cart: Cart | null;
  }> {
    const errors: string[] = [];
    
    // Get cart
    const cart = await this.getCart(cartId, tenantId);
    if (!cart) {
      errors.push('Cart not found');
      return { valid: false, errors, cart: null };
    }

    // Check if cart is empty
    if (cart.items.length === 0) {
      errors.push('Cart is empty');
    }

    // Validate each item
    for (const item of cart.items) {
      const product = await this.productService.getProduct(item.productId, tenantId);
      
      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
      }

      // Check price consistency (prices might have changed since item was added)
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

  async getCartSummary(cartId: string, tenantId: string): Promise<{
    cart: Cart;
    subtotal: number;
    itemCount: number;
    uniqueItems: number;
  } | null> {
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
