import { Cart, AddToCartRequest } from '../types';
export declare class CartRepository {
    private getDb;
    create(tenantId: string): Promise<Cart>;
    findById(id: string, tenantId: string): Promise<Cart | null>;
    addItem(cartId: string, tenantId: string, item: AddToCartRequest, productPrice: number): Promise<void>;
    updateItem(cartId: string, tenantId: string, productId: string, quantity: number): Promise<void>;
    removeItem(cartId: string, tenantId: string, productId: string): Promise<void>;
    clear(cartId: string, tenantId: string): Promise<void>;
    delete(cartId: string, tenantId: string): Promise<boolean>;
    getCartValue(cartId: string, tenantId: string): Promise<number>;
    getPendingStockForProduct(productId: string, tenantId: string): Promise<number>;
}
//# sourceMappingURL=cart.repository.d.ts.map