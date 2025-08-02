import { Router } from 'express';
import Joi from 'joi';
import { CartController } from '../controllers/cart.controller';
import { validate, schemas } from '../middleware/validation';

export function createCartRoutes(cartController: CartController): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     Cart:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *         tenantId:
   *           type: string
   *           format: uuid
   *         items:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/CartItem'
   *         createdAt:
   *           type: string
   *           format: date-time
   *         updatedAt:
   *           type: string
   *           format: date-time
   *     CartItem:
   *       type: object
   *       properties:
   *         productId:
   *           type: string
   *           format: uuid
   *         quantity:
   *           type: integer
   *           minimum: 1
   *         price:
   *           type: number
   *           format: float
   */

  /**
   * @swagger
   * /api/carts:
   *   post:
   *     summary: Create a new cart
   *     tags: [Carts]
   *     security:
   *       - TenantId: []
   *     responses:
   *       201:
   *         description: Cart created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Cart'
   */
  router.post('/', cartController.createCart);

  /**
   * @swagger
   * /api/carts/{id}:
   *   get:
   *     summary: Get cart by ID
   *     tags: [Carts]
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
   *         description: Cart retrieved successfully
   *       404:
   *         description: Cart not found
   */
  router.get('/:id', 
    validate({ params: schemas.cartId }), 
    cartController.getCart
  );

  /**
   * @swagger
   * /api/carts/{id}/summary:
   *   get:
   *     summary: Get cart summary
   *     tags: [Carts]
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
   *         description: Cart summary retrieved successfully
   */
  router.get('/:id/summary', 
    validate({ params: schemas.cartId }), 
    cartController.getCartSummary
  );

  /**
   * @swagger
   * /api/carts/{id}/items:
   *   post:
   *     summary: Add item to cart
   *     tags: [Carts]
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
   *               - productId
   *               - quantity
   *             properties:
   *               productId:
   *                 type: string
   *                 format: uuid
   *               quantity:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 100
   *     responses:
   *       200:
   *         description: Item added to cart successfully
   */
  router.post('/:id/items', 
    validate({ 
      params: schemas.cartId, 
      body: schemas.addToCart 
    }), 
    cartController.addToCart
  );

  /**
   * @swagger
   * /api/carts/{id}/items:
   *   put:
   *     summary: Update cart item
   *     tags: [Carts]
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
   *               - productId
   *               - quantity
   *             properties:
   *               productId:
   *                 type: string
   *                 format: uuid
   *               quantity:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 100
   *     responses:
   *       200:
   *         description: Cart item updated successfully
   */
  router.put('/:id/items', 
    validate({ 
      params: schemas.cartId, 
      body: schemas.updateCartItem 
    }), 
    cartController.updateCartItem
  );

  /**
   * @swagger
   * /api/carts/{id}/items/{productId}:
   *   delete:
   *     summary: Remove item from cart
   *     tags: [Carts]
   *     security:
   *       - TenantId: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Item removed from cart successfully
   */
  router.delete('/:id/items/:productId', 
    validate({ 
      params: Joi.object({
        id: Joi.string().uuid().required(),
        productId: Joi.string().uuid().required()
      })
    }), 
    cartController.removeFromCart
  );

  /**
   * @swagger
   * /api/carts/{id}/clear:
   *   post:
   *     summary: Clear all items from cart
   *     tags: [Carts]
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
   *         description: Cart cleared successfully
   */
  router.post('/:id/clear', 
    validate({ params: schemas.cartId }), 
    cartController.clearCart
  );

  /**
   * @swagger
   * /api/carts/{id}:
   *   delete:
   *     summary: Delete cart
   *     tags: [Carts]
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
   *         description: Cart deleted successfully
   *       404:
   *         description: Cart not found
   */
  router.delete('/:id', 
    validate({ params: schemas.cartId }), 
    cartController.deleteCart
  );

  return router;
}
