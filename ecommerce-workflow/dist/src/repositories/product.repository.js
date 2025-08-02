"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const util_1 = require("util");
const uuid_1 = require("uuid");
const database_1 = require("../database");
const logger_1 = require("../middleware/logger");
class ProductRepository {
    getDb() {
        return database_1.database.getDb();
    }
    mapRowToProduct(row) {
        return {
            id: row.id,
            tenantId: row.tenant_id,
            name: row.name,
            description: row.description,
            tags: JSON.parse(row.tags),
            price: row.price,
            stock: row.stock,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    async create(tenantId, productData) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const product = {
            id: (0, uuid_1.v4)(),
            tenantId,
            name: productData.name,
            description: productData.description,
            tags: productData.tags,
            price: productData.price,
            stock: productData.stock,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        try {
            await run(`
        INSERT INTO products (id, tenant_id, name, description, tags, price, stock, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                product.id,
                product.tenantId,
                product.name,
                product.description,
                JSON.stringify(product.tags),
                product.price,
                product.stock,
                product.createdAt.toISOString(),
                product.updatedAt.toISOString()
            ]);
            logger_1.logger.info(`Product created: ${product.id} for tenant: ${tenantId}`);
            return product;
        }
        catch (error) {
            logger_1.logger.error('Failed to create product:', error);
            throw new Error('Failed to create product');
        }
    }
    async findById(id, tenantId) {
        const db = this.getDb();
        const get = (0, util_1.promisify)(db.get.bind(db));
        try {
            const row = await get('SELECT * FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            if (!row) {
                return null;
            }
            return this.mapRowToProduct(row);
        }
        catch (error) {
            logger_1.logger.error('Failed to find product by ID:', error);
            throw new Error('Failed to find product');
        }
    }
    async findAll(tenantId, pagination) {
        const db = this.getDb();
        const all = (0, util_1.promisify)(db.all.bind(db));
        const get = (0, util_1.promisify)(db.get.bind(db));
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const offset = (page - 1) * limit;
        try {
            const countResult = await get('SELECT COUNT(*) as total FROM products WHERE tenant_id = ?', [tenantId]);
            const total = countResult.total;
            const rows = await all(`
        SELECT * FROM products 
        WHERE tenant_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [tenantId, limit, offset]);
            const products = rows.map(row => this.mapRowToProduct(row));
            return {
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to find products:', error);
            throw new Error('Failed to find products');
        }
    }
    async update(id, tenantId, updates) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        const updateFields = [];
        const values = [];
        if (updates.name !== undefined) {
            updateFields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            updateFields.push('description = ?');
            values.push(updates.description);
        }
        if (updates.tags !== undefined) {
            updateFields.push('tags = ?');
            values.push(JSON.stringify(updates.tags));
        }
        if (updates.price !== undefined) {
            updateFields.push('price = ?');
            values.push(updates.price);
        }
        if (updates.stock !== undefined) {
            updateFields.push('stock = ?');
            values.push(updates.stock);
        }
        if (updateFields.length === 0) {
            return this.findById(id, tenantId);
        }
        updateFields.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id, tenantId);
        try {
            const result = await run(`
        UPDATE products 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND tenant_id = ?
      `, values);
            if (result.changes === 0) {
                return null;
            }
            logger_1.logger.info(`Product updated: ${id} for tenant: ${tenantId}`);
            return this.findById(id, tenantId);
        }
        catch (error) {
            logger_1.logger.error('Failed to update product:', error);
            throw new Error('Failed to update product');
        }
    }
    async delete(id, tenantId) {
        const db = this.getDb();
        const run = (0, util_1.promisify)(db.run.bind(db));
        try {
            const result = await run('DELETE FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            const deleted = result.changes > 0;
            if (deleted) {
                logger_1.logger.info(`Product deleted: ${id} for tenant: ${tenantId}`);
            }
            return deleted;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete product:', error);
            throw new Error('Failed to delete product');
        }
    }
    async updateStock(productId, tenantId, quantity, operation) {
        const db = this.getDb();
        const operator = operation === 'reserve' ? '-' : '+';
        try {
            return new Promise((resolve, reject) => {
                let query, params;
                if (operation === 'reserve') {
                    query = `
            UPDATE products 
            SET stock = stock - ?, updated_at = ?
            WHERE id = ? AND tenant_id = ? AND stock >= ?
          `;
                    params = [quantity, new Date().toISOString(), productId, tenantId, quantity];
                }
                else {
                    query = `
            UPDATE products 
            SET stock = stock + ?, updated_at = ?
            WHERE id = ? AND tenant_id = ?
          `;
                    params = [quantity, new Date().toISOString(), productId, tenantId];
                }
                db.run(query, params, function (err) {
                    if (err) {
                        logger_1.logger.error(`Failed to ${operation} stock:`, err);
                        reject(new Error(`Failed to ${operation} stock`));
                        return;
                    }
                    const success = this.changes > 0;
                    if (success) {
                        logger_1.logger.info(`Stock ${operation}d: ${quantity} units for product ${productId}. Changes: ${this.changes}`);
                    }
                    else {
                        logger_1.logger.warn(`No stock ${operation}d for product ${productId}. This might indicate insufficient stock or product not found.`);
                    }
                    resolve(success);
                });
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to ${operation} stock:`, error);
            throw new Error(`Failed to ${operation} stock`);
        }
    }
    async findByIds(productIds, tenantId) {
        if (productIds.length === 0)
            return [];
        const db = this.getDb();
        const all = (0, util_1.promisify)(db.all.bind(db));
        const placeholders = productIds.map(() => '?').join(',');
        try {
            const rows = await all(`
        SELECT * FROM products 
        WHERE id IN (${placeholders}) AND tenant_id = ?
      `, [...productIds, tenantId]);
            return rows.map(row => this.mapRowToProduct(row));
        }
        catch (error) {
            logger_1.logger.error('Failed to find products by IDs:', error);
            throw new Error('Failed to find products');
        }
    }
}
exports.ProductRepository = ProductRepository;
//# sourceMappingURL=product.repository.js.map