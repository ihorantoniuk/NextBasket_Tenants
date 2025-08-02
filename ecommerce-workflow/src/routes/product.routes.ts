import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validate, schemas } from '../middleware/validation';

export function createProductRoutes(productController: ProductController): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     Product:
   *       type: object
   *       required:
   *         - id
   *         - tenantId
   *         - name
   *         - price
   *         - stock
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: Unique identifier for the product
   *         tenantId:
   *           type: string
   *           format: uuid
   *           description: Tenant identifier
   *         name:
   *           type: string
   *           description: Product name
   *         description:
   *           type: string
   *           description: Product description
   *         tags:
   *           type: array
   *           items:
   *             type: string
   *           description: Product tags
   *         price:
   *           type: number
   *           format: float
   *           minimum: 0
   *           description: Product price
   *         stock:
   *           type: integer
   *           minimum: 0
   *           description: Available stock quantity
   *         createdAt:
   *           type: string
   *           format: date-time
   *         updatedAt:
   *           type: string
   *           format: date-time
   */

  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: Create a new product
   *     tags: [Products]
   *     security:
   *       - TenantId: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - price
   *               - stock
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *               description:
   *                 type: string
   *                 maxLength: 1000
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 maxItems: 10
   *               price:
   *                 type: number
   *                 minimum: 0.01
   *               stock:
   *                 type: integer
   *                 minimum: 0
   *     responses:
   *       201:
   *         description: Product created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *                 message:
   *                   type: string
   */
  router.post('/', 
    validate({ body: schemas.createProduct }), 
    productController.createProduct
  );

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Get products with pagination
   *     tags: [Products]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   */
  router.get('/', 
    validate({ query: schemas.pagination }), 
    productController.getProducts
  );

  /**
   * @swagger
   * /api/products/search:
   *   get:
   *     summary: Search products
   *     tags: [Products]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 1
   *         description: Search term
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *     responses:
   *       200:
   *         description: Search results
   */
  router.get('/search', 
    validate({ query: schemas.search }), 
    productController.searchProducts
  );

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Get a product by ID
   *     tags: [Products]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *       404:
   *         description: Product not found
   */
  router.get('/:id', 
    validate({ params: schemas.productId }), 
    productController.getProduct
  );

  /**
   * @swagger
   * /api/products/{id}:
   *   put:
   *     summary: Update a product
   *     tags: [Products]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               price:
   *                 type: number
   *               stock:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Product updated successfully
   *       404:
   *         description: Product not found
   */
  router.put('/:id', 
    validate({ 
      params: schemas.productId, 
      body: schemas.updateProduct 
    }), 
    productController.updateProduct
  );

  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: Delete a product
   *     tags: [Products]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Product deleted successfully
   *       404:
   *         description: Product not found
   */
  router.delete('/:id', 
    validate({ params: schemas.productId }), 
    productController.deleteProduct
  );

  /**
   * @swagger
   * /api/products/{id}/available-stock:
   *   get:
   *     summary: Get available stock for a product
   *     description: Returns the available stock considering items pending in carts
   *     tags: [Products]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Available stock retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     availableStock:
   *                       type: integer
   *                       example: 42
   *       404:
   *         description: Product not found
   */
  router.get('/:id/available-stock', 
    validate({ params: schemas.productId }), 
    productController.getAvailableStock
  );

  return router;
}
