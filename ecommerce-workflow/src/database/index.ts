import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../middleware/logger';

export class Database {
  private db: sqlite3.Database | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dbDir = path.dirname(config.database.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(config.database.path, (err) => {
        if (err) {
          logger.error('Database connection failed:', err);
          reject(err);
        } else {
          logger.info(`Connected to SQLite database at ${config.database.path}`);
          resolve();
        }
      });
    });
  }

  async initialize(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const run = promisify(this.db.run.bind(this.db));

    try {
      // Create products table
      await run(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          tags TEXT, -- JSON array as string
          price REAL NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create carts table
      await run(`
        CREATE TABLE IF NOT EXISTS carts (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create cart_items table
      await run(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cart_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE,
          UNIQUE(cart_id, product_id)
        )
      `);

      // Create orders table
      await run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          cart_id TEXT NOT NULL,
          subtotal REAL NOT NULL,
          discount REAL DEFAULT 0,
          vat REAL NOT NULL,
          total REAL NOT NULL,
          promo_code TEXT,
          upsell_suggestions TEXT, -- JSON array as string
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create order_items table
      await run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      await run('CREATE INDEX IF NOT EXISTS idx_products_tenant ON products (tenant_id)');
      await run('CREATE INDEX IF NOT EXISTS idx_carts_tenant ON carts (tenant_id)');
      await run('CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders (tenant_id)');
      await run('CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items (cart_id)');
      await run('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id)');

      logger.info('Database tables initialized successfully');

      // Seed sample data if in development
      if (config.nodeEnv === 'development') {
        await this.seedSampleData();
      }
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async seedSampleData(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if products already exist using callback pattern
      const existingProduct = await new Promise<{ count: number }>((resolve, reject) => {
        this.db!.get('SELECT COUNT(*) as count FROM products', (err, row) => {
          if (err) reject(err);
          else resolve(row as { count: number });
        });
      });
      
      if (existingProduct.count > 0) {
        logger.info('Sample data already exists, skipping seed');
        return;
      }

      logger.info('Seeding sample data...');

      const sampleProducts = [
        // Tenant Demo products
        {
          id: 'prod-1',
          tenant_id: 'tenant-demo',
          name: 'Wireless Bluetooth Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          tags: JSON.stringify(['electronics', 'audio', 'wireless']),
          price: 199.99,
          stock: 50
        },
        {
          id: 'prod-2',
          tenant_id: 'tenant-demo',
          name: 'Smartphone Case',
          description: 'Protective case for smartphones with premium materials',
          tags: JSON.stringify(['accessories', 'phone', 'protection']),
          price: 29.99,
          stock: 100
        },
        {
          id: 'prod-3',
          tenant_id: 'tenant-demo',
          name: 'Wireless Charger',
          description: 'Fast wireless charging pad compatible with all devices',
          tags: JSON.stringify(['electronics', 'charging', 'wireless']),
          price: 49.99,
          stock: 75
        },
        // Tenant Retail products
        {
          id: 'prod-4',
          tenant_id: 'tenant-retail',
          name: 'Professional Coffee Machine',
          description: 'Barista-quality espresso machine for home use',
          tags: JSON.stringify(['kitchen', 'coffee', 'appliance']),
          price: 899.99,
          stock: 15
        },
        {
          id: 'prod-5',
          tenant_id: 'tenant-retail',
          name: 'Organic Coffee Beans',
          description: 'Premium single-origin coffee beans, freshly roasted',
          tags: JSON.stringify(['coffee', 'organic', 'beans']),
          price: 24.99,
          stock: 200
        },
        // Tenant Electronics products
        {
          id: 'prod-6',
          tenant_id: 'tenant-electronics',
          name: '4K Gaming Monitor',
          description: '27-inch 4K monitor with 144Hz refresh rate',
          tags: JSON.stringify(['electronics', 'monitor', 'gaming']),
          price: 599.99,
          stock: 30
        },
        {
          id: 'prod-7',
          tenant_id: 'tenant-electronics',
          name: 'Mechanical Gaming Keyboard',
          description: 'RGB mechanical keyboard with customizable switches',
          tags: JSON.stringify(['electronics', 'keyboard', 'gaming']),
          price: 159.99,
          stock: 75
        }
      ];

      for (const product of sampleProducts) {
        await new Promise<void>((resolve, reject) => {
          this.db!.run(
            `INSERT INTO products (id, tenant_id, name, description, tags, price, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [product.id, product.tenant_id, product.name, product.description, product.tags, product.price, product.stock],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      logger.info(`Seeded ${sampleProducts.length} sample products`);
    } catch (error) {
      logger.error('Failed to seed sample data:', error);
    }
  }

  getDb(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // Helper methods for TypeScript-friendly database operations
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            logger.error('Error closing database:', err);
            reject(err);
          } else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}

export const database = new Database();
