import { Order, OrderItem, OrderStatus, UpsellSuggestion } from '../types';
export declare class OrderRepository {
    private getDb;
    create(orderData: {
        tenantId: string;
        cartId: string;
        items: OrderItem[];
        subtotal: number;
        discount: number;
        vat: number;
        total: number;
        promoCode?: string;
        upsellSuggestions?: UpsellSuggestion[];
    }): Promise<Order>;
    findById(id: string, tenantId: string): Promise<Order | null>;
    findByTenant(tenantId: string, limit?: number): Promise<Order[]>;
    updateStatus(id: string, tenantId: string, status: OrderStatus): Promise<boolean>;
    delete(id: string, tenantId: string): Promise<boolean>;
    getOrderStats(tenantId: string): Promise<{
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
    }>;
}
//# sourceMappingURL=order.repository.d.ts.map