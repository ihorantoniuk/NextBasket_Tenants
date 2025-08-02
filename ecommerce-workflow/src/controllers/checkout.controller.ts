import { Request, Response } from 'express';
import { CheckoutService } from '../services/checkout.service';
import { NotFoundError, asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, CheckoutResponse, Order } from '../types';

export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  processCheckout = asyncHandler(async (req: Request, res: Response) => {
    const checkoutRequest = req.body;

    const result = await this.checkoutService.processCheckout(checkoutRequest);

    const response: ApiResponse<CheckoutResponse> = {
      success: true,
      data: result,
      message: 'Checkout completed successfully'
    };

    res.status(201).json(response);
  });

  getOrder = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const order = await this.checkoutService.getOrder(id, tenantId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const response: ApiResponse<Order> = {
      success: true,
      data: order
    };

    res.json(response);
  });

  getOrders = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { limit } = req.query;

    const orders = await this.checkoutService.getOrdersByTenant(
      tenantId,
      limit ? parseInt(limit as string) : undefined
    );

    const response: ApiResponse<Order[]> = {
      success: true,
      data: orders
    };

    res.json(response);
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { status } = req.body;

    const updated = await this.checkoutService.updateOrderStatus(id, tenantId, status);

    if (!updated) {
      throw new NotFoundError('Order not found');
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Order status updated successfully'
    };

    res.json(response);
  });

  getOrderStats = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;

    const stats = await this.checkoutService.getOrderStats(tenantId);

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats
    };

    res.json(response);
  });
}
