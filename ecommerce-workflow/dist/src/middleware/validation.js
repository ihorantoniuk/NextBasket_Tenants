"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validateTenant = exports.schemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const errorHandler_1 = require("./errorHandler");
const validate = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        if (schema.body) {
            const { error } = schema.body.validate(req.body);
            if (error) {
                validationErrors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
            }
        }
        if (schema.params) {
            const { error } = schema.params.validate(req.params);
            if (error) {
                validationErrors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
            }
        }
        if (schema.query) {
            const { error } = schema.query.validate(req.query);
            if (error) {
                validationErrors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
            }
        }
        if (validationErrors.length > 0) {
            return next(new errorHandler_1.ValidationError(validationErrors.join('; ')));
        }
        next();
    };
};
exports.validate = validate;
exports.schemas = {
    tenantId: joi_1.default.alternatives().try(joi_1.default.string().uuid(), joi_1.default.string().pattern(/^tenant-[a-zA-Z0-9-]+$/).min(3).max(50)).required(),
    createProduct: joi_1.default.object({
        name: joi_1.default.string().min(1).max(255).required(),
        description: joi_1.default.string().max(1000).optional().allow(''),
        tags: joi_1.default.array().items(joi_1.default.string().min(1).max(50)).max(10).default([]),
        price: joi_1.default.number().positive().precision(2).required(),
        stock: joi_1.default.number().integer().min(0).required()
    }),
    updateProduct: joi_1.default.object({
        name: joi_1.default.string().min(1).max(255).optional(),
        description: joi_1.default.string().max(1000).optional().allow(''),
        tags: joi_1.default.array().items(joi_1.default.string().min(1).max(50)).max(10).optional(),
        price: joi_1.default.number().positive().precision(2).optional(),
        stock: joi_1.default.number().integer().min(0).optional()
    }).min(1),
    addToCart: joi_1.default.object({
        productId: joi_1.default.string().min(1).required(),
        quantity: joi_1.default.number().integer().min(1).max(100).required()
    }),
    updateCartItem: joi_1.default.object({
        productId: joi_1.default.string().min(1).required(),
        quantity: joi_1.default.number().integer().min(0).max(100).required()
    }),
    checkout: joi_1.default.object({
        cartId: joi_1.default.string().uuid().required(),
        tenantId: joi_1.default.string().pattern(/^tenant-[a-zA-Z0-9-]+$/).required(),
        promoCode: joi_1.default.string().min(1).max(20).optional()
    }),
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10)
    }),
    search: joi_1.default.object({
        q: joi_1.default.string().min(1).max(100).required(),
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10)
    }),
    productId: joi_1.default.object({
        id: joi_1.default.string().min(1).required()
    }),
    cartId: joi_1.default.object({
        id: joi_1.default.string().uuid().required()
    }),
    orderId: joi_1.default.object({
        id: joi_1.default.string().uuid().required()
    }),
    updateOrderStatus: joi_1.default.object({
        status: joi_1.default.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled').required()
    })
};
const validateTenant = (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        return next(new errorHandler_1.ValidationError('Tenant ID is required in x-tenant-id header'));
    }
    const { error } = exports.schemas.tenantId.validate(tenantId);
    if (error) {
        return next(new errorHandler_1.ValidationError('Invalid tenant ID format'));
    }
    req.tenantId = tenantId;
    next();
};
exports.validateTenant = validateTenant;
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/<[^>]*>/g, '').trim();
        }
        else if (typeof obj === 'object' && obj !== null) {
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            else {
                const sanitized = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        sanitized[key] = sanitizeObject(obj[key]);
                    }
                }
                return sanitized;
            }
        }
        return obj;
    };
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=validation.js.map