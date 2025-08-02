-- Migration script to convert SQLite to PostgreSQL schema
-- Use this when setting up PostgreSQL on Render

-- Create tables
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(255) PRIMARY KEY,
    cart_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    cart_id VARCHAR(255) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    promo_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_reservations (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    cart_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_carts_tenant ON carts(tenant_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_tenant ON cart_items(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_stock_reservations_product ON stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_expires ON stock_reservations(expires_at);

-- Insert sample data
INSERT INTO products (id, tenant_id, name, description, price, stock, category) VALUES
('product-1', 'tenant-demo', 'Wireless Headphones', 'Premium noise-cancelling wireless headphones', 199.99, 50, 'Electronics'),
('product-2', 'tenant-demo', 'Smartphone', 'Latest flagship smartphone with advanced camera', 799.99, 30, 'Electronics'),
('product-3', 'tenant-demo', 'Laptop', 'High-performance laptop for professionals', 1299.99, 20, 'Electronics'),
('product-4', 'tenant-demo', 'Gaming Mouse', 'Precision gaming mouse with RGB lighting', 79.99, 100, 'Electronics'),
('product-5', 'tenant-demo', 'Mechanical Keyboard', 'Professional mechanical keyboard', 149.99, 75, 'Electronics'),
('product-6', 'tenant-demo', 'Monitor', '27-inch 4K monitor for productivity', 349.99, 25, 'Electronics'),
('product-7', 'tenant-demo', 'Tablet', 'Lightweight tablet for entertainment', 399.99, 40, 'Electronics'),
('product-8', 'tenant-demo', 'Smart Watch', 'Fitness tracking smart watch', 249.99, 60, 'Electronics'),
('product-9', 'tenant-demo', 'Speaker', 'Portable Bluetooth speaker', 129.99, 80, 'Electronics'),
('product-10', 'tenant-demo', 'Webcam', 'HD webcam for video calls', 89.99, 90, 'Electronics');

-- Add trigger for updated_at (PostgreSQL specific)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
