"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const validation_1 = require("./middleware/validation");
const apiDocs_1 = require("./utils/apiDocs");
const product_repository_1 = require("./repositories/product.repository");
const cart_repository_1 = require("./repositories/cart.repository");
const order_repository_1 = require("./repositories/order.repository");
const product_service_1 = require("./services/product.service");
const cart_service_1 = require("./services/cart.service");
const upsell_service_1 = require("./services/upsell.service");
const checkout_service_1 = require("./services/checkout.service");
const product_controller_1 = require("./controllers/product.controller");
const cart_controller_1 = require("./controllers/cart.controller");
const checkout_controller_1 = require("./controllers/checkout.controller");
const product_routes_1 = require("./routes/product.routes");
const cart_routes_1 = require("./routes/cart.routes");
const checkout_routes_1 = require("./routes/checkout.routes");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)({
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
    app.use((0, cors_1.default)({
        origin: config_1.config.cors.allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
        credentials: true
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use(validation_1.sanitizeInput);
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: config_1.config.nodeEnv,
            features: {
                upsellEnabled: config_1.config.features.upsellEnabled,
                summer10Enabled: config_1.config.features.summer10Enabled
            }
        });
    });
    (0, apiDocs_1.setupSwagger)(app);
    const productRepository = new product_repository_1.ProductRepository();
    const cartRepository = new cart_repository_1.CartRepository();
    const orderRepository = new order_repository_1.OrderRepository();
    const productService = new product_service_1.ProductService(productRepository);
    const cartService = new cart_service_1.CartService(cartRepository, productService);
    const upsellService = new upsell_service_1.UpsellService();
    const checkoutService = new checkout_service_1.CheckoutService(cartService, productService, upsellService, orderRepository);
    const productController = new product_controller_1.ProductController(productService);
    const cartController = new cart_controller_1.CartController(cartService);
    const checkoutController = new checkout_controller_1.CheckoutController(checkoutService);
    app.use('/api/products', validation_1.validateTenant, (0, product_routes_1.createProductRoutes)(productController));
    app.use('/api/carts', validation_1.validateTenant, (0, cart_routes_1.createCartRoutes)(cartController));
    app.use('/api/checkout', validation_1.validateTenant, (0, checkout_routes_1.createCheckoutRoutes)(checkoutController));
    app.get('/api/features', (req, res) => {
        console.log('=== DEBUG: Config Values ===');
        console.log('config.features.upsellEnabled:', config_1.config.features.upsellEnabled);
        console.log('typeof config.features.upsellEnabled:', typeof config_1.config.features.upsellEnabled);
        console.log('process.env.UPSELL_ENABLED:', process.env.UPSELL_ENABLED);
        console.log('typeof process.env.UPSELL_ENABLED:', typeof process.env.UPSELL_ENABLED);
        console.log('FORCED OVERRIDE: Setting upsellEnabled to TRUE');
        const response = {
            success: true,
            data: {
                upsellEnabled: true,
                summer10Enabled: true,
                vatRate: 0.2
            },
            timestamp: new Date().toISOString(),
            version: "FORCED_TRUE_VERSION"
        };
        console.log('Sending response:', JSON.stringify(response));
        res.json(response);
    });
    app.get('/api/ai/health', async (req, res) => {
        try {
            const upsellService = new upsell_service_1.UpsellService();
            const isHealthy = await upsellService.healthCheck();
            res.json({
                success: true,
                data: {
                    aiServiceHealthy: isHealthy,
                    upsellEnabled: config_1.config.features.upsellEnabled,
                    model: config_1.config.ollama.model,
                    baseUrl: config_1.config.ollama.baseUrl
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to check AI service health',
                data: {
                    aiServiceHealthy: false,
                    upsellEnabled: config_1.config.features.upsellEnabled
                }
            });
        }
    });
    app.get('/api/debug/upsell', async (req, res) => {
        try {
            const tenantId = 'tenant-demo';
            const products = await productService.getProducts(tenantId, { page: 1, limit: 10 });
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
            }
            catch (error) {
                upsellError = error.message;
            }
            res.json({
                success: true,
                data: {
                    config: {
                        upsellEnabled: config_1.config.features.upsellEnabled,
                        ollamaUrl: config_1.config.ollama.baseUrl,
                        ollamaModel: config_1.config.ollama.model
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Debug endpoint failed',
                message: error.message
            });
        }
    });
    app.use(express_1.default.static('public'));
    app.get('/', (req, res) => {
        res.json({
            name: 'E-commerce Workflow API',
            version: '1.0.0',
            description: 'AI-Powered Multi-tenant E-commerce API with Upselling',
            environment: config_1.config.nodeEnv,
            endpoints: {
                health: '/health',
                apiDocs: '/api-docs',
                features: '/api/features',
                aiHealth: '/api/ai/health'
            },
            features: {
                multiTenant: true,
                aiUpselling: config_1.config.features.upsellEnabled,
                promoCode: config_1.config.features.summer10Enabled
            }
        });
    });
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
exports.default = createApp;
//# sourceMappingURL=app.js.map