import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Product, CreateProductRequest, UpdateProductRequest, PaginationParams, PaginatedResponse } from '../types';
import { logger } from '../middleware/logger';

interface ProductRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  tags: string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export class ProductRepository {
  private getDb() {
    return database.getDb();
  }

  private mapRowToProduct(row: ProductRow): Product {
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

  async create(tenantId: string, productData: CreateProductRequest): Promise<Product> {
    const db = this.getDb();
    const run = promisify(db.run.bind(db));

    const product: Product = {
      id: uuidv4(),
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

      logger.info(`Product created: ${product.id} for tenant: ${tenantId}`);
      return product;
    } catch (error) {
      logger.error('Failed to create product:', error);
      throw new Error('Failed to create product');
    }
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    const db = this.getDb();
    const get = promisify(db.get.bind(db));

    try {
      const row = await get(
        'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );

      if (!row) {
        return null;
      }

      return this.mapRowToProduct(row);
    } catch (error) {
      logger.error('Failed to find product by ID:', error);
      throw new Error('Failed to find product');
    }
  }

  async findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>> {
    const db = this.getDb();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;

    try {
      // Get total count
      const countResult = await get(
        'SELECT COUNT(*) as total FROM products WHERE tenant_id = ?',
        [tenantId]
      );
      const total = countResult.total;

      // Get paginated results
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
    } catch (error) {
      logger.error('Failed to find products:', error);
      throw new Error('Failed to find products');
    }
  }

  async update(id: string, tenantId: string, updates: UpdateProductRequest): Promise<Product | null> {
    const db = this.getDb();
    const run = promisify(db.run.bind(db));

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];

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
      // No updates provided, return current product
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

      logger.info(`Product updated: ${id} for tenant: ${tenantId}`);
      return this.findById(id, tenantId);
    } catch (error) {
      logger.error('Failed to update product:', error);
      throw new Error('Failed to update product');
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const db = this.getDb();
    const run = promisify(db.run.bind(db));

    try {
      const result = await run(
        'DELETE FROM products WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );

      const deleted = result.changes > 0;
      if (deleted) {
        logger.info(`Product deleted: ${id} for tenant: ${tenantId}`);
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete product:', error);
      throw new Error('Failed to delete product');
    }
  }

  async updateStock(productId: string, tenantId: string, quantity: number, operation: 'reserve' | 'release'): Promise<boolean> {
    const db = this.getDb();
    
    const operator = operation === 'reserve' ? '-' : '+';
    
    try {
      return new Promise((resolve, reject) => {
        let query, params;
        
        if (operation === 'reserve') {
          // For reserve, check if we have enough stock
          query = `
            UPDATE products 
            SET stock = stock - ?, updated_at = ?
            WHERE id = ? AND tenant_id = ? AND stock >= ?
          `;
          params = [quantity, new Date().toISOString(), productId, tenantId, quantity];
        } else {
          // For release, just add back the stock (no stock check needed)
          query = `
            UPDATE products 
            SET stock = stock + ?, updated_at = ?
            WHERE id = ? AND tenant_id = ?
          `;
          params = [quantity, new Date().toISOString(), productId, tenantId];
        }
        
        db.run(query, params, function(this: any, err: any) {
          if (err) {
            logger.error(`Failed to ${operation} stock:`, err);
            reject(new Error(`Failed to ${operation} stock`));
            return;
          }

          const success = this.changes > 0;
          if (success) {
            logger.info(`Stock ${operation}d: ${quantity} units for product ${productId}. Changes: ${this.changes}`);
          } else {
            logger.warn(`No stock ${operation}d for product ${productId}. This might indicate insufficient stock or product not found.`);
          }

          resolve(success);
        });
      });
    } catch (error) {
      logger.error(`Failed to ${operation} stock:`, error);
      throw new Error(`Failed to ${operation} stock`);
    }
  }

  async findByIds(productIds: string[], tenantId: string): Promise<Product[]> {
    if (productIds.length === 0) return [];

    const db = this.getDb();
    const all = promisify(db.all.bind(db));

    const placeholders = productIds.map(() => '?').join(',');
    
    try {
      const rows = await all(`
        SELECT * FROM products 
        WHERE id IN (${placeholders}) AND tenant_id = ?
      `, [...productIds, tenantId]);

      return rows.map(row => this.mapRowToProduct(row));
    } catch (error) {
      logger.error('Failed to find products by IDs:', error);
      throw new Error('Failed to find products');
    }
  }
}
