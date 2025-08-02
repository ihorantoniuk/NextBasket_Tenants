import { CartRepository } from '../repositories/cart.repository';
import { ProductService } from './product.service';
import { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types';
export declare class CartService {
    private cartRepository;
    private productService;
    constructor(cartRepository: CartRepository, productService: ProductService);
    createCart(tenantId: string): Promise<Cart>;
    getCart(cartId: string, tenantId: string): Promise<Cart | null>;
    addToCart(cartId: string, tenantId: string, item: AddToCartRequest): Promise<void>;
    updateCartItem(cartId: string, tenantId: string, update: UpdateCartItemRequest): Promise<void>;
    removeFromCart(cartId: string, tenantId: string, productId: string): Promise<void>;
    clearCart(cartId: string, tenantId: string): Promise<void>;
    deleteCart(cartId: string, tenantId: string): Promise<boolean>;
    getCartValue(cartId: string, tenantId: string): Promise<number>;
    validateCartForCheckout(cartId: string, tenantId: string): Promise<{
        valid: boolean;
        errors: string[];
        cart: Cart | null;
    }>;
    getCartSummary(cartId: string, tenantId: string): Promise<{
        cart: Cart;
        subtotal: number;
        itemCount: number;
        uniqueItems: number;
    } | null>;
}
//# sourceMappingURL=cart.service.d.ts.map