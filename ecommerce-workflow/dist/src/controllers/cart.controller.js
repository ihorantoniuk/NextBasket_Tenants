"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
class CartController {
    constructor(cartService) {
        this.cartService = cartService;
        this.createCart = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const cart = await this.cartService.createCart(tenantId);
            const response = {
                success: true,
                data: cart,
                message: 'Cart created successfully'
            };
            res.status(201).json(response);
        });
        this.getCart = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const cart = await this.cartService.getCart(id, tenantId);
            if (!cart) {
                throw new errorHandler_1.NotFoundError('Cart not found');
            }
            const response = {
                success: true,
                data: cart
            };
            res.json(response);
        });
        this.addToCart = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const itemData = req.body;
            await this.cartService.addToCart(id, tenantId, itemData);
            const response = {
                success: true,
                message: 'Item added to cart successfully'
            };
            res.json(response);
        });
        this.updateCartItem = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const updateData = req.body;
            await this.cartService.updateCartItem(id, tenantId, updateData);
            const response = {
                success: true,
                message: 'Cart item updated successfully'
            };
            res.json(response);
        });
        this.removeFromCart = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id, productId } = req.params;
            await this.cartService.removeFromCart(id, tenantId, productId);
            const response = {
                success: true,
                message: 'Item removed from cart successfully'
            };
            res.json(response);
        });
        this.clearCart = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            await this.cartService.clearCart(id, tenantId);
            const response = {
                success: true,
                message: 'Cart cleared successfully'
            };
            res.json(response);
        });
        this.deleteCart = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const deleted = await this.cartService.deleteCart(id, tenantId);
            if (!deleted) {
                throw new errorHandler_1.NotFoundError('Cart not found');
            }
            const response = {
                success: true,
                message: 'Cart deleted successfully'
            };
            res.json(response);
        });
        this.getCartSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const summary = await this.cartService.getCartSummary(id, tenantId);
            if (!summary) {
                throw new errorHandler_1.NotFoundError('Cart not found');
            }
            const response = {
                success: true,
                data: summary
            };
            res.json(response);
        });
    }
}
exports.CartController = CartController;
//# sourceMappingURL=cart.controller.js.map