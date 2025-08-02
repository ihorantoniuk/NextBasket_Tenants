"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = require("../config");
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-commerce Workflow API',
            version: '1.0.0',
            description: 'AI-Powered Multi-tenant E-commerce API with Upselling',
            contact: {
                name: 'NEXT BASKET',
                email: 'support@nextbasket.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: `http://localhost:${config_1.config.port}`,
                description: 'Development server'
            },
            {
                url: 'https://your-production-url.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                TenantId: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-tenant-id',
                    description: 'Tenant identifier for multi-tenant isolation'
                }
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indicates if the request was successful'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data (when success is true)'
                        },
                        error: {
                            type: 'string',
                            description: 'Error message (when success is false)'
                        },
                        message: {
                            type: 'string',
                            description: 'Additional message'
                        }
                    }
                },
                PaginationParams: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'integer',
                            minimum: 1,
                            default: 1,
                            description: 'Page number'
                        },
                        limit: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 100,
                            default: 10,
                            description: 'Number of items per page'
                        }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object'
                            }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: {
                                    type: 'integer'
                                },
                                limit: {
                                    type: 'integer'
                                },
                                total: {
                                    type: 'integer'
                                },
                                totalPages: {
                                    type: 'integer'
                                }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        details: {
                            type: 'string',
                            description: 'Additional error details'
                        }
                    }
                }
            },
            responses: {
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                BadRequest: {
                    description: 'Bad request - validation failed',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                InternalServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                Unauthorized: {
                    description: 'Unauthorized - missing or invalid tenant ID',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Products',
                description: 'Product catalog operations'
            },
            {
                name: 'Carts',
                description: 'Shopping cart operations'
            },
            {
                name: 'Checkout',
                description: 'Checkout and order processing'
            },
            {
                name: 'Orders',
                description: 'Order management and tracking'
            }
        ]
    },
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/types/*.ts'
    ]
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
const setupSwagger = (app) => {
    app.use('/api-docs*', (req, res, next) => {
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('X-Content-Type-Options');
        res.removeHeader('X-Frame-Options');
        res.removeHeader('X-XSS-Protection');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        next();
    });
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(exports.swaggerSpec, {
        explorer: true,
        customCss: `.swagger-ui .topbar { display: none }
                .swagger-ui .info { margin: 50px 0; }
                .swagger-ui .scheme-container { background: #fafafa; padding: 30px 0; }`,
        customSiteTitle: 'E-commerce Workflow API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
            requestInterceptor: (req) => {
                if (!req.headers['Content-Type'] && req.method !== 'GET') {
                    req.headers['Content-Type'] = 'application/json';
                }
                return req;
            }
        }
    }));
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(exports.swaggerSpec);
    });
};
exports.setupSwagger = setupSwagger;
exports.default = {
    swaggerSpec: exports.swaggerSpec,
    setupSwagger: exports.setupSwagger
};
//# sourceMappingURL=apiDocs.js.map