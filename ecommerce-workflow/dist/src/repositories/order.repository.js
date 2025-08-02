"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const util_1 = require("util");
const uuid_1 = require("uuid");
const database_1 = require("../database");
const types_1 = require("../types");
const logger_1 = require("../middleware/logger");
class OrderRepository {
    getDb() {
        return database_1.database.getDb();
    }
    async create(orderData) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const order = {
            id: (0, uuid_1.v4)(),
            tenantId: orderData.tenantId,
            cartId: orderData.cartId,
            items: orderData.items,
            subtotal: orderData.subtotal,
            discount: orderData.discount,
            vat: orderData.vat,
            total: orderData.total,
            promoCode: orderData.promoCode,
            upsellSuggestions: orderData.upsellSuggestions,
            status: types_1.OrderStatus.PENDING,
            createdAt: new Date()
        };
        try {
            await run(`
        INSERT INTO orders (
          id, tenant_id, cart_id, subtotal, discount, vat, total, 
          promo_code, upsell_suggestions, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                order.id,
                order.tenantId,
                order.cartId,
                order.subtotal,
                order.discount,
                order.vat,
                order.total,
                order.promoCode || null,
                order.upsellSuggestions ? JSON.stringify(order.upsellSuggestions) : null,
                order.status,
                order.createdAt.toISOString()
            ]);
            for (const item of order.items) {
                await run(`
          INSERT INTO order_items (
            order_id, product_id, product_name, quantity, unit_price, total_price
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
                    order.id,
                    item.productId,
                    item.productName,
                    item.quantity,
                    item.unitPrice,
                    item.totalPrice
                ]);
            }
            logger_1.logger.info(`Order created: ${order.id} for tenant: ${order.tenantId}`);
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to create order:', error);
            throw new Error('Failed to create order');
        }
    }
    async findById(id, tenantId) {
        const db = this.getDb();
        const get = (0, util_1.promisify)(db.get.bind(db));
        const all = (0, util_1.promisify)(db.all.bind(db));
        try {
            const orderRow = await get('SELECT * FROM orders WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            if (!orderRow) {
                return null;
            }
            const itemRows = await all('SELECT * FROM order_items WHERE order_id = ?', [id]);
            const order = {
                id: orderRow.id,
                tenantId: orderRow.tenant_id,
                cartId: orderRow.cart_id,
                items: itemRows.map(row => ({
                    productId: row.product_id,
                    productName: row.product_name,
                    quantity: row.quantity,
                    unitPrice: row.unit_price,
                    totalPrice: row.total_price
                })),
                subtotal: orderRow.subtotal,
                discount: orderRow.discount,
                vat: orderRow.vat,
                total: orderRow.total,
                promoCode: orderRow.promo_code,
                upsellSuggestions: orderRow.upsell_suggestions ? JSON.parse(orderRow.upsell_suggestions) : undefined,
                status: orderRow.status,
                createdAt: new Date(orderRow.created_at)
            };
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to find order by ID:', error);
            throw new Error('Failed to find order');
        }
    }
    async findByTenant(tenantId, limit = 50) {
        const db = this.getDb();
        const all = (0, util_1.promisify)(db.all.bind(db));
        try {
            const orderRows = await all(`
        SELECT * FROM orders 
        WHERE tenant_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [tenantId, limit]);
            const orders = [];
            for (const orderRow of orderRows) {
                const itemRows = await all('SELECT * FROM order_items WHERE order_id = ?', [orderRow.id]);
                const order = {
                    id: orderRow.id,
                    tenantId: orderRow.tenant_id,
                    cartId: orderRow.cart_id,
                    items: itemRows.map(row => ({
                        productId: row.product_id,
                        productName: row.product_name,
                        quantity: row.quantity,
                        unitPrice: row.unit_price,
                        totalPrice: row.total_price
                    })),
                    subtotal: orderRow.subtotal,
                    discount: orderRow.discount,
                    vat: orderRow.vat,
                    total: orderRow.total,
                    promoCode: orderRow.promo_code,
                    upsellSuggestions: orderRow.upsell_suggestions ? JSON.parse(orderRow.upsell_suggestions) : undefined,
                    status: orderRow.status,
                    createdAt: new Date(orderRow.created_at)
                };
                orders.push(order);
            }
            return orders;
        }
        catch (error) {
            logger_1.logger.error('Failed to find orders by tenant:', error);
            throw new Error('Failed to find orders');
        }
    }
    async updateStatus(id, tenantId, status) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        try {
            const result = await run(`
        UPDATE orders 
        SET status = ? 
        WHERE id = ? AND tenant_id = ?
      `, [status, id, tenantId]);
            const updated = result.changes > 0;
            if (updated) {
                logger_1.logger.info(`Order status updated: ${id} -> ${status}`);
            }
            return updated;
        }
        catch (error) {
            logger_1.logger.error('Failed to update order status:', error);
            throw new Error('Failed to update order status');
        }
    }
    async delete(id, tenantId) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        try {
            const result = await run('DELETE FROM orders WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            const deleted = result.changes > 0;
            if (deleted) {
                logger_1.logger.info(`Order deleted: ${id}`);
            }
            return deleted;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete order:', error);
            throw new Error('Failed to delete order');
        }
    }
    async getOrderStats(tenantId) {
        const db = this.getDb();
        const get = (0, util_1.promisify)(db.get.bind(db));
        try {
            const stats = await get(`
        SELECT 
          COUNT(*) as totalOrders,
          SUM(total) as totalRevenue,
          AVG(total) as averageOrderValue
        FROM orders 
        WHERE tenant_id = ? AND status != 'cancelled'
      `, [tenantId]);
            return {
                totalOrders: stats.totalOrders || 0,
                totalRevenue: stats.totalRevenue || 0,
                averageOrderValue: stats.averageOrderValue || 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get order stats:', error);
            throw new Error('Failed to get order stats');
        }
    }
}
exports.OrderRepository = OrderRepository;
//# sourceMappingURL=order.repository.js.map