"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCartRoutes = createCartRoutes;
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../middleware/validation");
function createCartRoutes(cartController) {
    const router = (0, express_1.Router)();
    router.post('/', cartController.createCart);
    router.get('/:id', (0, validation_1.validate)({ params: validation_1.schemas.cartId }), cartController.getCart);
    router.get('/:id/summary', (0, validation_1.validate)({ params: validation_1.schemas.cartId }), cartController.getCartSummary);
    router.post('/:id/items', (0, validation_1.validate)({
        params: validation_1.schemas.cartId,
        body: validation_1.schemas.addToCart
    }), cartController.addToCart);
    router.put('/:id/items', (0, validation_1.validate)({
        params: validation_1.schemas.cartId,
        body: validation_1.schemas.updateCartItem
    }), cartController.updateCartItem);
    router.delete('/:id/items/:productId', (0, validation_1.validate)({
        params: joi_1.default.object({
            id: joi_1.default.string().uuid().required(),
            productId: joi_1.default.string().uuid().required()
        })
    }), cartController.removeFromCart);
    router.post('/:id/clear', (0, validation_1.validate)({ params: validation_1.schemas.cartId }), cartController.clearCart);
    router.delete('/:id', (0, validation_1.validate)({ params: validation_1.schemas.cartId }), cartController.deleteCart);
    return router;
}
//# sourceMappingURL=cart.routes.js.map