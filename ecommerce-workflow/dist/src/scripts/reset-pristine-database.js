"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabaseToPristine = resetDatabaseToPristine;
const database_1 = require("../database");
const logger_1 = require("../middleware/logger");
const pristineProducts = [
    {
        id: 'clean-001',
        tenantId: 'tenant-demo',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced camera system and titanium design',
        tags: ['smartphone', 'electronics', 'apple', 'premium'],
        price: 999.99,
        stock: 10
    },
    {
        id: 'clean-002',
        tenantId: 'tenant-demo',
        name: 'iPhone Case - Clear',
        description: 'Protective clear case for iPhone 15 Pro with drop protection',
        tags: ['accessories', 'protection', 'iphone', 'case'],
        price: 29.99,
        stock: 25
    },
    {
        id: 'clean-003',
        tenantId: 'tenant-demo',
        name: 'Screen Protector - Tempered Glass',
        description: 'Premium tempered glass screen protector with easy installation',
        tags: ['accessories', 'protection', 'screen', 'glass'],
        price: 19.99,
        stock: 40
    },
    {
        id: 'clean-004',
        tenantId: 'tenant-demo',
        name: 'USB-C to Lightning Cable',
        description: 'Official Apple USB-C to Lightning cable for fast charging',
        tags: ['charging', 'cable', 'apple', 'usb-c'],
        price: 39.99,
        stock: 35
    },
    {
        id: 'clean-005',
        tenantId: 'tenant-demo',
        name: 'MagSafe Wireless Charger',
        description: 'Apple MagSafe wireless charger for iPhone',
        tags: ['charging', 'wireless', 'magsafe', 'apple'],
        price: 59.99,
        stock: 20
    },
    {
        id: 'clean-006',
        tenantId: 'tenant-demo',
        name: 'MacBook Air M3',
        description: 'Latest MacBook Air with M3 chip and all-day battery life',
        tags: ['laptop', 'computer', 'apple', 'premium'],
        price: 1299.99,
        stock: 8
    },
    {
        id: 'clean-007',
        tenantId: 'tenant-demo',
        name: 'Laptop Sleeve - 13 inch',
        description: 'Premium leather laptop sleeve for 13-inch MacBook',
        tags: ['accessories', 'protection', 'laptop', 'leather'],
        price: 49.99,
        stock: 15
    },
    {
        id: 'clean-008',
        tenantId: 'tenant-demo',
        name: 'USB-C Hub - 7-in-1',
        description: 'Multi-port USB-C hub with HDMI, USB-A, and card readers',
        tags: ['accessories', 'connectivity', 'usb-c', 'hub'],
        price: 79.99,
        stock: 18
    },
    {
        id: 'clean-009',
        tenantId: 'tenant-demo',
        name: 'AirPods Pro 2',
        description: 'Apple AirPods Pro with active noise cancellation',
        tags: ['audio', 'wireless', 'apple', 'noise-canceling'],
        price: 249.99,
        stock: 22
    },
    {
        id: 'clean-010',
        tenantId: 'tenant-demo',
        name: 'AirPods Case - Silicone',
        description: 'Protective silicone case for AirPods Pro charging case',
        tags: ['accessories', 'protection', 'airpods', 'silicone'],
        price: 14.99,
        stock: 30
    }
];
async function resetDatabaseToPristine() {
    try {
        logger_1.logger.info('🧹 Starting database reset to pristine state...');
        await database_1.database.connect();
        await database_1.database.initialize();
        const db = database_1.database.getDb();
        logger_1.logger.info('🗑️  Clearing existing products...');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM products', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        logger_1.logger.info('🛒 Clearing existing carts...');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM carts', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        logger_1.logger.info('📦 Clearing existing cart items...');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM cart_items', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        logger_1.logger.info('✅ Database cleared successfully');
        logger_1.logger.info('🌱 Inserting pristine product catalog...');
        const insertProduct = `
      INSERT INTO products (id, tenant_id, name, description, tags, price, stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
        for (const product of pristineProducts) {
            await new Promise((resolve, reject) => {
                db.run(insertProduct, [
                    product.id,
                    product.tenantId,
                    product.name,
                    product.description,
                    JSON.stringify(product.tags),
                    product.price,
                    product.stock
                ], (err) => {
                    if (err) {
                        logger_1.logger.error(`Failed to insert product ${product.name}:`, err);
                        reject(err);
                    }
                    else {
                        logger_1.logger.info(`✓ Added: ${product.name} ($${product.price})`);
                        resolve();
                    }
                });
            });
        }
        logger_1.logger.info('🎉 Database reset complete!');
        logger_1.logger.info(`📊 Total products: ${pristineProducts.length}`);
        logger_1.logger.info('🔬 Perfect for testing AI upsell suggestions!');
        const categories = [...new Set(pristineProducts.flatMap(p => p.tags))];
        logger_1.logger.info(`🏷️  Available categories: ${categories.join(', ')}`);
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to reset database:', error);
        throw error;
    }
    finally {
        await database_1.database.close();
    }
}
if (require.main === module) {
    resetDatabaseToPristine()
        .then(() => {
        logger_1.logger.info('🌟 Pristine database setup complete!');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('💥 Database reset failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=reset-pristine-database.js.map