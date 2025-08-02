import { Request, Response } from 'express';
import { CheckoutService } from '../services/checkout.service';
export declare class CheckoutController {
    private checkoutService;
    constructor(checkoutService: CheckoutService);
    processCheckout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getOrder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getOrders: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateOrderStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getOrderStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=checkout.controller.d.ts.map