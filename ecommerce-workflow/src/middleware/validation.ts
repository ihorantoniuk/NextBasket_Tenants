import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

// Middleware factory for request validation
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        validationErrors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate request params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        validationErrors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate request query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        validationErrors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return next(new ValidationError(validationErrors.join('; ')));
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // Tenant validation - allow both UUID and descriptive names
  tenantId: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.string().pattern(/^tenant-[a-zA-Z0-9-]+$/).min(3).max(50)
  ).required(),
  
  // Product validation
  createProduct: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional().allow(''),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).default([]),
    price: Joi.number().positive().precision(2).required(),
    stock: Joi.number().integer().min(0).required()
  }),
  
  updateProduct: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
    price: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).optional()
  }).min(1), // At least one field required
  
  // Cart validation
  addToCart: Joi.object({
    productId: Joi.string().min(1).required(),
    quantity: Joi.number().integer().min(1).max(100).required()
  }),
  
  updateCartItem: Joi.object({
    productId: Joi.string().min(1).required(),
    quantity: Joi.number().integer().min(0).max(100).required()
  }),
  
  // Checkout validation
  checkout: Joi.object({
    cartId: Joi.string().uuid().required(),
    tenantId: Joi.string().pattern(/^tenant-[a-zA-Z0-9-]+$/).required(),
    promoCode: Joi.string().min(1).max(20).optional()
  }),
  
  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),
  
  // Search validation
  search: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),
  
  // ID parameters
  productId: Joi.object({
    id: Joi.string().min(1).required()
  }),
  
  cartId: Joi.object({
    id: Joi.string().uuid().required()
  }),
  
  orderId: Joi.object({
    id: Joi.string().uuid().required()
  }),
  
  // Order status update
  updateOrderStatus: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled').required()
  })
};

// Middleware to extract and validate tenant ID from headers
export const validateTenant = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    return next(new ValidationError('Tenant ID is required in x-tenant-id header'));
  }
  
  const { error } = schemas.tenantId.validate(tenantId);
  if (error) {
    return next(new ValidationError('Invalid tenant ID format'));
  }
  
  // Add tenant ID to request object for easy access
  (req as any).tenantId = tenantId;
  next();
};

// Sanitize input middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS protection - strip HTML tags from string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<[^>]*>/g, '').trim();
    } else if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else {
        const sanitized: any = {};
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
