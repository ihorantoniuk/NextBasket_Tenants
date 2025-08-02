"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const database_1 = require("../database");
const logger_1 = require("../middleware/logger");
const sampleProducts = [
    {
        id: 'prod-001',
        tenantId: 'tenant-demo',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality noise-canceling wireless headphones with 30-hour battery life',
        tags: ['electronics', 'audio', 'wireless', 'bluetooth'],
        price: 99.99,
        stock: 15
    },
    {
        id: 'prod-002',
        tenantId: 'tenant-demo',
        name: 'Smartphone USB-C Cable',
        description: 'Fast charging USB-C cable compatible with most modern devices',
        tags: ['electronics', 'accessories', 'charging', 'usb-c'],
        price: 19.99,
        stock: 50
    },
    {
        id: 'prod-003',
        tenantId: 'tenant-demo',
        name: 'Portable Power Bank',
        description: '20000mAh portable charger with fast charging and multiple ports',
        tags: ['electronics', 'power', 'portable', 'charging'],
        price: 49.99,
        stock: 25
    },
    {
        id: 'prod-004',
        tenantId: 'tenant-demo',
        name: 'Wireless Phone Charger',
        description: 'Qi-compatible wireless charging pad for smartphones',
        tags: ['electronics', 'wireless', 'charging', 'qi'],
        price: 29.99,
        stock: 30
    },
    {
        id: 'prod-005',
        tenantId: 'tenant-demo',
        name: 'Bluetooth Speaker',
        description: 'Waterproof portable Bluetooth speaker with rich bass',
        tags: ['electronics', 'audio', 'bluetooth', 'portable', 'waterproof'],
        price: 79.99,
        stock: 20
    },
    {
        id: 'prod-006',
        tenantId: 'tenant-demo',
        name: 'Phone Case',
        description: 'Protective silicone case with screen protection',
        tags: ['accessories', 'protection', 'phone', 'case'],
        price: 14.99,
        stock: 100
    },
    {
        id: 'prod-007',
        tenantId: 'tenant-demo',
        name: 'Screen Protector',
        description: 'Tempered glass screen protector with bubble-free installation',
        tags: ['accessories', 'protection', 'screen', 'glass'],
        price: 9.99,
        stock: 75
    },
    {
        id: 'prod-008',
        tenantId: 'tenant-demo',
        name: 'Car Phone Mount',
        description: 'Adjustable car mount for hands-free phone use while driving',
        tags: ['accessories', 'car', 'mount', 'hands-free'],
        price: 24.99,
        stock: 40
    },
    {
        id: 'prod-009',
        tenantId: 'tenant-demo',
        name: 'Gaming Mouse',
        description: 'High-precision gaming mouse with customizable RGB lighting',
        tags: ['gaming', 'mouse', 'rgb', 'precision'],
        price: 59.99,
        stock: 35
    },
    {
        id: 'prod-010',
        tenantId: 'tenant-demo',
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with tactile switches',
        tags: ['gaming', 'keyboard', 'mechanical', 'rgb'],
        price: 129.99,
        stock: 12
    },
    {
        id: 'prod-011',
        tenantId: 'tenant-demo',
        name: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness and color temperature',
        tags: ['home', 'office', 'lighting', 'led', 'adjustable'],
        price: 39.99,
        stock: 28
    },
    {
        id: 'prod-012',
        tenantId: 'tenant-demo',
        name: 'Ergonomic Mouse Pad',
        description: 'Large mouse pad with wrist support for comfortable computing',
        tags: ['office', 'ergonomic', 'mouse-pad', 'comfort'],
        price: 16.99,
        stock: 60
    },
    {
        id: 'prod-101',
        tenantId: 'tenant-retail',
        name: 'Coffee Mug',
        description: 'Ceramic coffee mug with heat-retention design',
        tags: ['kitchen', 'coffee', 'ceramic', 'mug'],
        price: 12.99,
        stock: 80
    },
    {
        id: 'prod-102',
        tenantId: 'tenant-retail',
        name: 'Water Bottle',
        description: 'Stainless steel insulated water bottle keeps drinks cold for 24 hours',
        tags: ['kitchen', 'water', 'insulated', 'steel'],
        price: 24.99,
        stock: 45
    }
];
async function seedDatabase() {
    try {
        logger_1.logger.info('🌱 Starting database seeding...');
        await database_1.database.connect();
        await database_1.database.initialize();
        await database_1.database.run('DELETE FROM products');
        logger_1.logger.info('🗑️  Cleared existing products');
        const insertProduct = `
      INSERT INTO products (id, tenant_id, name, description, tags, price, stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
        for (const product of sampleProducts) {
            await database_1.database.run(insertProduct, [
                product.id,
                product.tenantId,
                product.name,
                product.description,
                JSON.stringify(product.tags),
                product.price,
                product.stock
            ]);
            logger_1.logger.info(`📦 Added product: ${product.name} (${product.tenantId})`);
        }
        logger_1.logger.info(`✅ Successfully seeded ${sampleProducts.length} products`);
        logger_1.logger.info('🎯 Tenant demo has 12 products, tenant-retail has 2 products');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to seed database:', error);
        throw error;
    }
}
if (require.main === module) {
    seedDatabase()
        .then(() => {
        logger_1.logger.info('🎉 Database seeding completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('💥 Database seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed-database.js.map