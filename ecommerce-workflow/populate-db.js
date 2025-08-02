// Simple database population script
const axios = require('axios');

const products = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced camera system and titanium design',
    tags: ['smartphone', 'electronics', 'apple', 'premium'],
    price: 999.99,
    stock: 10
  },
  {
    name: 'iPhone Case - Clear',
    description: 'Protective clear case for iPhone 15 Pro with drop protection',
    tags: ['accessories', 'protection', 'iphone', 'case'],
    price: 29.99,
    stock: 25
  },
  {
    name: 'Screen Protector - Tempered Glass',
    description: 'Premium tempered glass screen protector with easy installation',
    tags: ['accessories', 'protection', 'screen', 'glass'],
    price: 19.99,
    stock: 40
  },
  {
    name: 'USB-C to Lightning Cable',
    description: 'Official Apple USB-C to Lightning cable for fast charging',
    tags: ['charging', 'cable', 'apple', 'usb-c'],
    price: 39.99,
    stock: 35
  },
  {
    name: 'MagSafe Wireless Charger',
    description: 'Apple MagSafe wireless charger for iPhone',
    tags: ['charging', 'wireless', 'magsafe', 'apple'],
    price: 59.99,
    stock: 20
  },
  {
    name: 'MacBook Air M3',
    description: 'Latest MacBook Air with M3 chip and all-day battery life',
    tags: ['laptop', 'computer', 'apple', 'premium'],
    price: 1299.99,
    stock: 8
  },
  {
    name: 'Laptop Sleeve - 13 inch',
    description: 'Premium leather laptop sleeve for 13-inch MacBook',
    tags: ['accessories', 'protection', 'laptop', 'leather'],
    price: 49.99,
    stock: 15
  },
  {
    name: 'USB-C Hub - 7-in-1',
    description: 'Multi-port USB-C hub with HDMI, USB-A, and card readers',
    tags: ['accessories', 'connectivity', 'usb-c', 'hub'],
    price: 79.99,
    stock: 18
  },
  {
    name: 'AirPods Pro 2',
    description: 'Apple AirPods Pro with active noise cancellation',
    tags: ['audio', 'wireless', 'apple', 'noise-canceling'],
    price: 249.99,
    stock: 22
  },
  {
    name: 'AirPods Case - Silicone',
    description: 'Protective silicone case for AirPods Pro charging case',
    tags: ['accessories', 'protection', 'airpods', 'silicone'],
    price: 14.99,
    stock: 30
  }
];

async function populateDatabase() {
  console.log('🚀 Starting database population...');
  
  try {
    // First, let's check if the API is accessible
    const healthCheck = await axios.get('http://localhost:3000/health');
    console.log('✅ API is accessible:', healthCheck.data);
    
    // Add each product via API
    for (const product of products) {
      try {
        const response = await axios.post('http://localhost:3000/api/products', product, {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': 'tenant-demo'
          }
        });
        console.log(`✅ Added: ${product.name}`);
      } catch (error) {
        console.log(`❌ Failed to add ${product.name}:`, error.response?.data || error.message);
      }
    }
    
    console.log('🎉 Database population complete!');
    
    // Verify by checking products count
    const checkResponse = await axios.get('http://localhost:3000/api/products', {
      headers: {
        'x-tenant-id': 'tenant-demo'
      }
    });
    console.log(`📊 Total products in database: ${checkResponse.data.data?.data?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

populateDatabase();
