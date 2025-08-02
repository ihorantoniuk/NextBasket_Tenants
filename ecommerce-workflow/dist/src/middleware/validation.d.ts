import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
export declare const validate: (schema: {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
}) => (req: Request, res: Response, next: NextFunction) => void;
export declare const schemas: {
    tenantId: Joi.AlternativesSchema<any>;
    createProduct: Joi.ObjectSchema<any>;
    updateProduct: Joi.ObjectSchema<any>;
    addToCart: Joi.ObjectSchema<any>;
    updateCartItem: Joi.ObjectSchema<any>;
    checkout: Joi.ObjectSchema<any>;
    pagination: Joi.ObjectSchema<any>;
    search: Joi.ObjectSchema<any>;
    productId: Joi.ObjectSchema<any>;
    cartId: Joi.ObjectSchema<any>;
    orderId: Joi.ObjectSchema<any>;
    updateOrderStatus: Joi.ObjectSchema<any>;
};
export declare const validateTenant: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map