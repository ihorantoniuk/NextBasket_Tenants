import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { NotFoundError, asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, Cart } from '../types';

export class CartController {
  constructor(private cartService: CartService) {}

  createCart = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;

    const cart = await this.cartService.createCart(tenantId);

    const response: ApiResponse<Cart> = {
      success: true,
      data: cart,
      message: 'Cart created successfully'
    };

    res.status(201).json(response);
  });

  getCart = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const cart = await this.cartService.getCart(id, tenantId);

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const response: ApiResponse<Cart> = {
      success: true,
      data: cart
    };

    res.json(response);
  });

  addToCart = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const itemData = req.body;

    await this.cartService.addToCart(id, tenantId, itemData);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Item added to cart successfully'
    };

    res.json(response);
  });

  updateCartItem = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const updateData = req.body;

    await this.cartService.updateCartItem(id, tenantId, updateData);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Cart item updated successfully'
    };

    res.json(response);
  });

  removeFromCart = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id, productId } = req.params;

    await this.cartService.removeFromCart(id, tenantId, productId);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Item removed from cart successfully'
    };

    res.json(response);
  });

  clearCart = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    await this.cartService.clearCart(id, tenantId);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Cart cleared successfully'
    };

    res.json(response);
  });

  deleteCart = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const deleted = await this.cartService.deleteCart(id, tenantId);

    if (!deleted) {
      throw new NotFoundError('Cart not found');
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Cart deleted successfully'
    };

    res.json(response);
  });

  getCartSummary = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const summary = await this.cartService.getCartSummary(id, tenantId);

    if (!summary) {
      throw new NotFoundError('Cart not found');
    }

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary
    };

    res.json(response);
  });
}
