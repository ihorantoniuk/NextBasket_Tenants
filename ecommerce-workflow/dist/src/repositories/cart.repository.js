"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartRepository = void 0;
const util_1 = require("util");
const uuid_1 = require("uuid");
const database_1 = require("../database");
const logger_1 = require("../middleware/logger");
class CartRepository {
    getDb() {
        return database_1.database.getDb();
    }
    async create(tenantId) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const cart = {
            id: (0, uuid_1.v4)(),
            tenantId,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        try {
            await run(`
        INSERT INTO carts (id, tenant_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `, [
                cart.id,
                cart.tenantId,
                cart.createdAt.toISOString(),
                cart.updatedAt.toISOString()
            ]);
            logger_1.logger.info(`Cart created: ${cart.id} for tenant: ${tenantId}`);
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Failed to create cart:', error);
            throw new Error('Failed to create cart');
        }
    }
    async findById(id, tenantId) {
        const db = this.getDb();
        const get = (0, util_1.promisify)(db.get.bind(db));
        const all = (0, util_1.promisify)(db.all.bind(db));
        try {
            const cartRow = await get('SELECT * FROM carts WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            if (!cartRow) {
                return null;
            }
            const itemRows = await all('SELECT * FROM cart_items WHERE cart_id = ?', [id]);
            const cart = {
                id: cartRow.id,
                tenantId: cartRow.tenant_id,
                items: itemRows.map(row => ({
                    productId: row.product_id,
                    quantity: row.quantity,
                    price: row.price
                })),
                createdAt: new Date(cartRow.created_at),
                updatedAt: new Date(cartRow.updated_at)
            };
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Failed to find cart by ID:', error);
            throw new Error('Failed to find cart');
        }
    }
    async addItem(cartId, tenantId, item, productPrice) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const get = (0, util_1.promisify)(db.get.bind(db));
        try {
            const cart = await get('SELECT id FROM carts WHERE id = ? AND tenant_id = ?', [cartId, tenantId]);
            if (!cart) {
                throw new Error('Cart not found or access denied');
            }
            const existingItem = await get('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, item.productId]);
            if (existingItem) {
                await run(`
          UPDATE cart_items 
          SET quantity = quantity + ?, price = ?
          WHERE cart_id = ? AND product_id = ?
        `, [item.quantity, productPrice, cartId, item.productId]);
            }
            else {
                await run(`
          INSERT INTO cart_items (cart_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [cartId, item.productId, item.quantity, productPrice]);
            }
            await run(`
        UPDATE carts SET updated_at = ? WHERE id = ?
      `, [new Date().toISOString(), cartId]);
            logger_1.logger.info(`Item added to cart: ${cartId}, product: ${item.productId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to add item to cart:', error);
            throw error;
        }
    }
    async updateItem(cartId, tenantId, productId, quantity) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const get = (0, util_1.promisify)(db.get.bind(db));
        try {
            const cart = await get('SELECT id FROM carts WHERE id = ? AND tenant_id = ?', [cartId, tenantId]);
            if (!cart) {
                throw new Error('Cart not found or access denied');
            }
            if (quantity <= 0) {
                await run('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
            }
            else {
                const result = await run(`
          UPDATE cart_items 
          SET quantity = ?
          WHERE cart_id = ? AND product_id = ?
        `, [quantity, cartId, productId]);
                if (result.changes === 0) {
                    throw new Error('Cart item not found');
                }
            }
            await run(`
        UPDATE carts SET updated_at = ? WHERE id = ?
      `, [new Date().toISOString(), cartId]);
            logger_1.logger.info(`Cart item updated: ${cartId}, product: ${productId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update cart item:', error);
            throw error;
        }
    }
    async removeItem(cartId, tenantId, productId) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const get = (0, util_1.promisify)(db.get.bind(db));
        try {
            const cart = await get('SELECT id FROM carts WHERE id = ? AND tenant_id = ?', [cartId, tenantId]);
            if (!cart) {
                throw new Error('Cart not found or access denied');
            }
            const result = await run('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
            if (result.changes === 0) {
                throw new Error('Cart item not found');
            }
            await run(`
        UPDATE carts SET updated_at = ? WHERE id = ?
      `, [new Date().toISOString(), cartId]);
            logger_1.logger.info(`Item removed from cart: ${cartId}, product: ${productId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to remove cart item:', error);
            throw error;
        }
    }
    async clear(cartId, tenantId) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const get = (0, util_1.promisify)(db.get.bind(db));
        try {
            const cart = await get('SELECT id FROM carts WHERE id = ? AND tenant_id = ?', [cartId, tenantId]);
            if (!cart) {
                throw new Error('Cart not found or access denied');
            }
            await run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
            await run(`
        UPDATE carts SET updated_at = ? WHERE id = ?
      `, [new Date().toISOString(), cartId]);
            logger_1.logger.info(`Cart cleared: ${cartId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to clear cart:', error);
            throw error;
        }
    }
    async delete(cartId, tenantId) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        try {
            const result = await run('DELETE FROM carts WHERE id = ? AND tenant_id = ?', [cartId, tenantId]);
            const deleted = result.changes > 0;
            if (deleted) {
                logger_1.logger.info(`Cart deleted: ${cartId}`);
            }
            return deleted;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete cart:', error);
            throw new Error('Failed to delete cart');
        }
    }
    async getCartValue(cartId, tenantId) {
        const cart = await this.findById(cartId, tenantId);
        if (!cart) {
            return 0;
        }
        return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    async getPendingStockForProduct(productId, tenantId) {
        const db = this.getDb();
        const get = (0, util_1.promisify)(db.get.bind(db));
        try {
            logger_1.logger.info(`Getting pending stock for product ${productId} in tenant ${tenantId}`);
            const result = await get(`
        SELECT SUM(ci.quantity) as pending_quantity
        FROM cart_items ci
        INNER JOIN carts c ON ci.cart_id = c.id
        WHERE ci.product_id = ? AND c.tenant_id = ?
      `, [productId, tenantId]);
            const pendingQuantity = result?.pending_quantity || 0;
            logger_1.logger.info(`Pending stock for product ${productId}: ${pendingQuantity}`);
            return pendingQuantity;
        }
        catch (error) {
            logger_1.logger.error('Failed to get pending stock for product:', error);
            throw new Error('Failed to get pending stock');
        }
    }
}
exports.CartRepository = CartRepository;
//# sourceMappingURL=cart.repository.js.map