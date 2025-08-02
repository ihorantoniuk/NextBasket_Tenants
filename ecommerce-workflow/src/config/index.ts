import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    path: process.env.DATABASE_PATH || './data/ecommerce.db'
  },
  
  features: {
    // Force upsell to be enabled - checking multiple conditions
    upsellEnabled: (() => {
      const envValue = process.env.UPSELL_ENABLED;
      console.log('=== UPSELL CONFIG DEBUG ===');
      console.log('process.env.UPSELL_ENABLED:', envValue);
      console.log('typeof process.env.UPSELL_ENABLED:', typeof envValue);
      
      const condition1 = process.env.UPSELL_ENABLED === 'true';
      const condition2 = process.env.UPSELL_ENABLED?.toLowerCase() === 'true';
      const condition3 = (process.env.UPSELL_ENABLED || '').toLowerCase().trim() === 'true';
      const fallback = true;
      
      console.log('condition1 (=== "true"):', condition1);
      console.log('condition2 (toLowerCase === "true"):', condition2);
      console.log('condition3 (trim + toLowerCase === "true"):', condition3);
      console.log('fallback:', fallback);
      
      const result = condition1 || condition2 || condition3 || fallback;
      console.log('Final upsellEnabled result:', result);
      console.log('=== END UPSELL CONFIG DEBUG ===');
      
      return result;
    })(),
    summer10Enabled: (process.env.SUMMER10_ENABLED || '').toLowerCase().trim() === 'true'
  },
  
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'mistral'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  },
  
  business: {
    vatRate: parseFloat(process.env.VAT_RATE || '0.20'),
    summer10Discount: 0.10
  }
};

export default config;
