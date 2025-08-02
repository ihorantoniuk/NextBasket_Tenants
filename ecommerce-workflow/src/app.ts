import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { validateTenant, sanitizeInput } from './middleware/validation';
import { setupSwagger } from './utils/apiDocs';

// Import repositories
import { ProductRepository } from './repositories/product.repository';
import { CartRepository } from './repositories/cart.repository';
import { OrderRepository } from './repositories/order.repository';

// Import services
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';
import { UpsellService } from './services/upsell.service';
import { CheckoutService } from './services/checkout.service';

// Import controllers
import { ProductController } from './controllers/product.controller';
import { CartController } from './controllers/cart.controller';
import { CheckoutController } from './controllers/checkout.controller';

// Import routes
import { createProductRoutes } from './routes/product.routes';
import { createCartRoutes } from './routes/cart.routes';
import { createCheckoutRoutes } from './routes/checkout.routes';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        frameSrc: ["'self'"]
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: config.cors.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global middleware
  app.use(sanitizeInput);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
      features: {
        upsellEnabled: config.features.upsellEnabled,
        summer10Enabled: config.features.summer10Enabled
      }
    });
  });

  // API documentation
  setupSwagger(app);

  // Initialize repositories
  const productRepository = new ProductRepository();
  const cartRepository = new CartRepository();
  const orderRepository = new OrderRepository();

  // Initialize services
  const productService = new ProductService(productRepository);
  const cartService = new CartService(cartRepository, productService);
  const upsellService = new UpsellService();
  const checkoutService = new CheckoutService(
    cartService,
    productService,
    upsellService,
    orderRepository
  );

  // Initialize controllers
  const productController = new ProductController(productService);
  const cartController = new CartController(cartService);
  const checkoutController = new CheckoutController(checkoutService);

  // API routes (with tenant validation)
  app.use('/api/products', validateTenant, createProductRoutes(productController));
  app.use('/api/carts', validateTenant, createCartRoutes(cartController));
  app.use('/api/checkout', validateTenant, createCheckoutRoutes(checkoutController));

  // Feature flags endpoint - UPDATED AT 2025-08-01 21:45
  app.get('/api/features', (req: Request, res: Response) => {
    // Debug: log the actual config values
    console.log('=== DEBUG: Config Values ===');
    console.log('config.features.upsellEnabled:', config.features.upsellEnabled);
    console.log('typeof config.features.upsellEnabled:', typeof config.features.upsellEnabled);
    console.log('process.env.UPSELL_ENABLED:', process.env.UPSELL_ENABLED);
    console.log('typeof process.env.UPSELL_ENABLED:', typeof process.env.UPSELL_ENABLED);
    console.log('FORCED OVERRIDE: Setting upsellEnabled to TRUE');
    
    // FORCED OVERRIDE - ALWAYS RETURN TRUE
    const response = {
      success: true,
      data: {
        upsellEnabled: true, // FORCED TRUE - DEBUGGING
        summer10Enabled: true,
        vatRate: 0.2
      },
      timestamp: new Date().toISOString(),
      version: "FORCED_TRUE_VERSION"
    };
    
    console.log('Sending response:', JSON.stringify(response));
    res.json(response);
  });

  // AI service health check endpoint
  app.get('/api/ai/health', async (req: Request, res: Response) => {
    try {
      const upsellService = new UpsellService();
      const isHealthy = await upsellService.healthCheck();
      
      res.json({
        success: true,
        data: {
          aiServiceHealthy: isHealthy,
          upsellEnabled: config.features.upsellEnabled,
          model: config.ollama.model,
          baseUrl: config.ollama.baseUrl
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check AI service health',
        data: {
          aiServiceHealthy: false,
          upsellEnabled: config.features.upsellEnabled
        }
      });
    }
  });

  // Debug endpoint for testing upsell functionality
  app.get('/api/debug/upsell', async (req: Request, res: Response) => {
    try {
      const tenantId = 'tenant-demo';
      
      // Use existing services from the app initialization
      const products = await productService.getProducts(tenantId, { page: 1, limit: 10 });
      
      // Check if upsell service works
      const testCart = [
        {
          productId: 'test-001',
          productName: 'Test Product',
          quantity: 1,
          price: 99.99,
          tags: ['electronics', 'test']
        }
      ];
      
      let upsellResult = null;
      let upsellError = null;
      
      try {
        upsellResult = await upsellService.generateUpsellSuggestions({
          cartItems: testCart,
          availableProducts: products.data || [],
          maxSuggestions: 3
        });
      } catch (error) {
        upsellError = error.message;
      }
      
      res.json({
        success: true,
        data: {
          config: {
            upsellEnabled: config.features.upsellEnabled,
            ollamaUrl: config.ollama.baseUrl,
            ollamaModel: config.ollama.model
          },
          database: {
            totalProducts: products.pagination?.total || products.data?.length || 0,
            sampleProducts: (products.data || []).slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              tags: p.tags
            }))
          },
          upsellTest: {
            success: upsellResult !== null,
            suggestions: upsellResult?.suggestions || [],
            error: upsellError,
            processingTime: upsellResult?.processingTime || 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Debug endpoint failed',
        message: error.message
      });
    }
  });

  // Serve static files (for frontend)
  app.use(express.static('public'));

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'E-commerce Workflow API',
      version: '1.0.0',
      description: 'AI-Powered Multi-tenant E-commerce API with Upselling',
      environment: config.nodeEnv,
      endpoints: {
        health: '/health',
        apiDocs: '/api-docs',
        features: '/api/features',
        aiHealth: '/api/ai/health'
      },
      features: {
        multiTenant: true,
        aiUpselling: config.features.upsellEnabled,
        promoCode: config.features.summer10Enabled
      }
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
