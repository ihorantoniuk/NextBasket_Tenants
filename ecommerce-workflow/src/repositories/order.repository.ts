import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Order, OrderItem, OrderStatus, UpsellSuggestion } from '../types';
import { logger } from '../middleware/logger';

export class OrderRepository {
  private getDb() {
    return database.getDb();
  }

  async create(orderData: {
    tenantId: string;
    cartId: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    vat: number;
    total: number;
    promoCode?: string;
    upsellSuggestions?: UpsellSuggestion[];
  }): Promise<Order> {
    const db = this.getDb();
    const run = promisify(db.run.bind(db));

    const order: Order = {
      id: uuidv4(),
      tenantId: orderData.tenantId,
      cartId: orderData.cartId,
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      vat: orderData.vat,
      total: orderData.total,
      promoCode: orderData.promoCode,
      upsellSuggestions: orderData.upsellSuggestions,
      status: OrderStatus.PENDING,
      createdAt: new Date()
    };

    try {
      // Insert order
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

      // Insert order items
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

      logger.info(`Order created: ${order.id} for tenant: ${order.tenantId}`);
      return order;
    } catch (error) {
      logger.error('Failed to create order:', error);
      throw new Error('Failed to create order');
    }
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const db = this.getDb();
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));

    try {
      const orderRow = await get(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );

      if (!orderRow) {
        return null;
      }

      const itemRows = await all(
        'SELECT * FROM order_items WHERE order_id = ?',
        [id]
      );

      const order: Order = {
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
        status: orderRow.status as OrderStatus,
        createdAt: new Date(orderRow.created_at)
      };

      return order;
    } catch (error) {
      logger.error('Failed to find order by ID:', error);
      throw new Error('Failed to find order');
    }
  }

  async findByTenant(tenantId: string, limit: number = 50): Promise<Order[]> {
    const db = this.getDb();
    const all = promisify(db.all.bind(db));

    try {
      const orderRows = await all(`
        SELECT * FROM orders 
        WHERE tenant_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [tenantId, limit]);

      const orders: Order[] = [];

      for (const orderRow of orderRows) {
        const itemRows = await all(
          'SELECT * FROM order_items WHERE order_id = ?',
          [orderRow.id]
        );

        const order: Order = {
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
          status: orderRow.status as OrderStatus,
          createdAt: new Date(orderRow.created_at)
        };

        orders.push(order);
      }

      return orders;
    } catch (error) {
      logger.error('Failed to find orders by tenant:', error);
      throw new Error('Failed to find orders');
    }
  }

  async updateStatus(id: string, tenantId: string, status: OrderStatus): Promise<boolean> {
    const db = this.getDb();
    const run = promisify(db.run.bind(db));

    try {
      const result = await run(`
        UPDATE orders 
        SET status = ? 
        WHERE id = ? AND tenant_id = ?
      `, [status, id, tenantId]);

      const updated = result.changes > 0;
      if (updated) {
        logger.info(`Order status updated: ${id} -> ${status}`);
      }

      return updated;
    } catch (error) {
      logger.error('Failed to update order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const db = this.getDb();
    const run = promisify(db.run.bind(db));

    try {
      const result = await run(
        'DELETE FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );

      const deleted = result.changes > 0;
      if (deleted) {
        logger.info(`Order deleted: ${id}`);
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete order:', error);
      throw new Error('Failed to delete order');
    }
  }

  async getOrderStats(tenantId: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const db = this.getDb();
    const get = promisify(db.get.bind(db));

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
    } catch (error) {
      logger.error('Failed to get order stats:', error);
      throw new Error('Failed to get order stats');
    }
  }
}
