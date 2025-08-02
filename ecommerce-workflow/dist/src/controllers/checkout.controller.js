"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
class CheckoutController {
    constructor(checkoutService) {
        this.checkoutService = checkoutService;
        this.processCheckout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const checkoutRequest = req.body;
            const result = await this.checkoutService.processCheckout(checkoutRequest);
            const response = {
                success: true,
                data: result,
                message: 'Checkout completed successfully'
            };
            res.status(201).json(response);
        });
        this.getOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const order = await this.checkoutService.getOrder(id, tenantId);
            if (!order) {
                throw new errorHandler_1.NotFoundError('Order not found');
            }
            const response = {
                success: true,
                data: order
            };
            res.json(response);
        });
        this.getOrders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { limit } = req.query;
            const orders = await this.checkoutService.getOrdersByTenant(tenantId, limit ? parseInt(limit) : undefined);
            const response = {
                success: true,
                data: orders
            };
            res.json(response);
        });
        this.updateOrderStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const { status } = req.body;
            const updated = await this.checkoutService.updateOrderStatus(id, tenantId, status);
            if (!updated) {
                throw new errorHandler_1.NotFoundError('Order not found');
            }
            const response = {
                success: true,
                message: 'Order status updated successfully'
            };
            res.json(response);
        });
        this.getOrderStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const stats = await this.checkoutService.getOrderStats(tenantId);
            const response = {
                success: true,
                data: stats
            };
            res.json(response);
        });
    }
}
exports.CheckoutController = CheckoutController;
//# sourceMappingURL=checkout.controller.js.map