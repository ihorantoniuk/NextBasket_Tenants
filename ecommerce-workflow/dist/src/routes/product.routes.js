"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductRoutes = createProductRoutes;
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
function createProductRoutes(productController) {
    const router = (0, express_1.Router)();
    router.post('/', (0, validation_1.validate)({ body: validation_1.schemas.createProduct }), productController.createProduct);
    router.get('/', (0, validation_1.validate)({ query: validation_1.schemas.pagination }), productController.getProducts);
    router.get('/search', (0, validation_1.validate)({ query: validation_1.schemas.search }), productController.searchProducts);
    router.get('/:id', (0, validation_1.validate)({ params: validation_1.schemas.productId }), productController.getProduct);
    router.put('/:id', (0, validation_1.validate)({
        params: validation_1.schemas.productId,
        body: validation_1.schemas.updateProduct
    }), productController.updateProduct);
    router.delete('/:id', (0, validation_1.validate)({ params: validation_1.schemas.productId }), productController.deleteProduct);
    router.get('/:id/available-stock', (0, validation_1.validate)({ params: validation_1.schemas.productId }), productController.getAvailableStock);
    return router;
}
//# sourceMappingURL=product.routes.js.map