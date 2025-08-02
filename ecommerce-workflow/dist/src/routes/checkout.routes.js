"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutRoutes = createCheckoutRoutes;
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
function createCheckoutRoutes(checkoutController) {
    const router = (0, express_1.Router)();
    router.post('/', (0, validation_1.validate)({ body: validation_1.schemas.checkout }), checkoutController.processCheckout);
    router.get('/orders', checkoutController.getOrders);
    router.get('/orders/:id', (0, validation_1.validate)({ params: validation_1.schemas.orderId }), checkoutController.getOrder);
    router.put('/orders/:id/status', (0, validation_1.validate)({
        params: validation_1.schemas.orderId,
        body: validation_1.schemas.updateOrderStatus
    }), checkoutController.updateOrderStatus);
    router.get('/orders/stats', checkoutController.getOrderStats);
    return router;
}
//# sourceMappingURL=checkout.routes.js.map