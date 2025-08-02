import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
export declare class ProductController {
    private productService;
    constructor(productService: ProductService);
    createProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    searchProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAvailableStock: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=product.controller.d.ts.map