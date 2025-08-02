"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
class ProductController {
    constructor(productService) {
        this.productService = productService;
        this.createProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const productData = req.body;
            const product = await this.productService.createProduct(tenantId, productData);
            const response = {
                success: true,
                data: product,
                message: 'Product created successfully'
            };
            res.status(201).json(response);
        });
        this.getProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const product = await this.productService.getProduct(id, tenantId);
            if (!product) {
                throw new errorHandler_1.NotFoundError('Product not found');
            }
            const response = {
                success: true,
                data: product
            };
            res.json(response);
        });
        this.getProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { page, limit } = req.query;
            const result = await this.productService.getProducts(tenantId, {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined
            });
            const response = {
                success: true,
                data: result
            };
            res.json(response);
        });
        this.updateProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const updates = req.body;
            const product = await this.productService.updateProduct(id, tenantId, updates);
            if (!product) {
                throw new errorHandler_1.NotFoundError('Product not found');
            }
            const response = {
                success: true,
                data: product,
                message: 'Product updated successfully'
            };
            res.json(response);
        });
        this.deleteProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const deleted = await this.productService.deleteProduct(id, tenantId);
            if (!deleted) {
                throw new errorHandler_1.NotFoundError('Product not found');
            }
            const response = {
                success: true,
                message: 'Product deleted successfully'
            };
            res.json(response);
        });
        this.searchProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { q: searchTerm, page, limit } = req.query;
            const result = await this.productService.searchProducts(tenantId, searchTerm, {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined
            });
            const response = {
                success: true,
                data: result
            };
            res.json(response);
        });
        this.getAvailableStock = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const availableStock = await this.productService.getAvailableStock(id, tenantId);
            const response = {
                success: true,
                data: { availableStock }
            };
            res.json(response);
        });
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=product.controller.js.map