import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
export declare class CartController {
    private cartService;
    constructor(cartService: CartService);
    createCart: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCart: (req: Request, res: Response, next: import("express").NextFunction) => void;
    addToCart: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateCartItem: (req: Request, res: Response, next: import("express").NextFunction) => void;
    removeFromCart: (req: Request, res: Response, next: import("express").NextFunction) => void;
    clearCart: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteCart: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCartSummary: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=cart.controller.d.ts.map