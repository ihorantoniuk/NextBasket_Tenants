import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { UpsellService } from './upsell.service';
import { OrderRepository } from '../repositories/order.repository';
import { CheckoutRequest, CheckoutResponse, Order } from '../types';
export declare class CheckoutService {
    private cartService;
    private productService;
    private upsellService;
    private orderRepository;
    constructor(cartService: CartService, productService: ProductService, upsellService: UpsellService, orderRepository: OrderRepository);
    processCheckout(request: CheckoutRequest): Promise<CheckoutResponse>;
    private reserveStock;
    private rollbackStockReservations;
    private calculatePricing;
    private calculatePromoDiscount;
    private buildOrderItems;
    private generateUpsellSuggestions;
    getOrder(orderId: string, tenantId: string): Promise<Order | null>;
    getOrdersByTenant(tenantId: string, limit?: number): Promise<Order[]>;
    updateOrderStatus(orderId: string, tenantId: string, status: any): Promise<boolean>;
    getOrderStats(tenantId: string): Promise<{
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
    }>;
}
//# sourceMappingURL=checkout.service.d.ts.map