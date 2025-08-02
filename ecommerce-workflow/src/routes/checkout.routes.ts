import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { validate, schemas } from '../middleware/validation';

export function createCheckoutRoutes(checkoutController: CheckoutController): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     CheckoutRequest:
   *       type: object
   *       required:
   *         - cartId
   *         - tenantId
   *       properties:
   *         cartId:
   *           type: string
   *           format: uuid
   *         tenantId:
   *           type: string
   *           format: uuid
   *         promoCode:
   *           type: string
   *           maxLength: 20
   *     CheckoutResponse:
   *       type: object
   *       properties:
   *         orderId:
   *           type: string
   *           format: uuid
   *         subtotal:
   *           type: number
   *           format: float
   *         discount:
   *           type: number
   *           format: float
   *         vat:
   *           type: number
   *           format: float
   *         total:
   *           type: number
   *           format: float
   *         upsellSuggestions:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/UpsellSuggestion'
   *     UpsellSuggestion:
   *       type: object
   *       properties:
   *         productId:
   *           type: string
   *           format: uuid
   *         productName:
   *           type: string
   *         reason:
   *           type: string
   *         confidence:
   *           type: number
   *           format: float
   *           minimum: 0
   *           maximum: 1
   *     Order:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *         tenantId:
   *           type: string
   *           format: uuid
   *         cartId:
   *           type: string
   *           format: uuid
   *         items:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/OrderItem'
   *         subtotal:
   *           type: number
   *         discount:
   *           type: number
   *         vat:
   *           type: number
   *         total:
   *           type: number
   *         promoCode:
   *           type: string
   *         status:
   *           type: string
   *           enum: [pending, confirmed, shipped, delivered, cancelled]
   *         createdAt:
   *           type: string
   *           format: date-time
   *     OrderItem:
   *       type: object
   *       properties:
   *         productId:
   *           type: string
   *           format: uuid
   *         productName:
   *           type: string
   *         quantity:
   *           type: integer
   *         unitPrice:
   *           type: number
   *         totalPrice:
   *           type: number
   */

  /**
   * @swagger
   * /api/checkout:
   *   post:
   *     summary: Process checkout
   *     tags: [Checkout]
   *     security:
   *       - TenantId: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CheckoutRequest'
   *     responses:
   *       201:
   *         description: Checkout completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/CheckoutResponse'
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid request or insufficient stock
   *       404:
   *         description: Cart not found
   */
  router.post('/', 
    validate({ body: schemas.checkout }), 
    checkoutController.processCheckout
  );

  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Get orders for tenant
   *     tags: [Orders]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 50
   *         description: Maximum number of orders to return
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Order'
   */
  router.get('/orders', checkoutController.getOrders);

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Get order by ID
   *     tags: [Orders]
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
   *         description: Order retrieved successfully
   *       404:
   *         description: Order not found
   */
  router.get('/orders/:id', 
    validate({ params: schemas.orderId }), 
    checkoutController.getOrder
  );

  /**
   * @swagger
   * /api/orders/{id}/status:
   *   put:
   *     summary: Update order status
   *     tags: [Orders]
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
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, confirmed, shipped, delivered, cancelled]
   *     responses:
   *       200:
   *         description: Order status updated successfully
   *       404:
   *         description: Order not found
   */
  router.put('/orders/:id/status', 
    validate({ 
      params: schemas.orderId,
      body: schemas.updateOrderStatus
    }), 
    checkoutController.updateOrderStatus
  );

  /**
   * @swagger
   * /api/orders/stats:
   *   get:
   *     summary: Get order statistics for tenant
   *     tags: [Orders]
   *     security:
   *       - TenantId: []
   *     responses:
   *       200:
   *         description: Order statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalOrders:
   *                       type: integer
   *                     totalRevenue:
   *                       type: number
   *                     averageOrderValue:
   *                       type: number
   */
  router.get('/orders/stats', checkoutController.getOrderStats);

  return router;
}
