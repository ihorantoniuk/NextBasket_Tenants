const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDatabaseContent() {
    const dbPath = './data/ecommerce.db';
    console.log('📊 Checking database content...');
    console.log('Database path:', dbPath);
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Failed to connect to database:', err.message);
            return;
        }
        console.log('✅ Connected to database');
    });

    return new Promise((resolve, reject) => {
        // Check products
        db.all('SELECT COUNT(*) as count FROM products', (err, rows) => {
            if (err) {
                console.error('❌ Error counting products:', err);
                db.close();
                reject(err);
                return;
            }
            
            const productCount = rows[0].count;
            console.log(`📦 Total products: ${productCount}`);
            
            if (productCount > 0) {
                // Get sample products
                db.all('SELECT id, name, price, tags FROM products LIMIT 5', (err, products) => {
                    if (err) {
                        console.error('❌ Error getting products:', err);
                        db.close();
                        reject(err);
                        return;
                    }
                    
                    console.log('\n📋 Sample products:');
                    products.forEach(product => {
                        console.log(`  • ${product.name} ($${product.price}) [${product.id}]`);
                        console.log(`    Tags: ${product.tags}`);
                    });
                    
                    // Check carts
                    db.all('SELECT COUNT(*) as count FROM carts', (err, cartRows) => {
                        if (err) {
                            console.error('❌ Error counting carts:', err);
                        } else {
                            console.log(`🛒 Total carts: ${cartRows[0].count}`);
                        }
                        
                        db.close();
                        resolve({
                            productCount,
                            products,
                            cartCount: cartRows ? cartRows[0].count : 0
                        });
                    });
                });
            } else {
                console.log('⚠️  No products found in database!');
                db.close();
                resolve({ productCount: 0, products: [], cartCount: 0 });
            }
        });
    });
}

checkDatabaseContent()
    .then(result => {
        console.log('\n✅ Database check complete!');
        if (result.productCount === 0) {
            console.log('💡 Tip: Run "npm run reset-pristine" to add sample products');
        }
    })
    .catch(error => {
        console.error('💥 Database check failed:', error);
    });
