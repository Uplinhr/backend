import CartService from './service.js';
import { successResponse, errorResponse } from '../../utils/helpers.js';

class CartController {
  /**
   * Obtiene o crea carrito del usuario
   * GET /api/cart
   */
  static async getCart(req, res) {
    try {
      const userId = req.user.id;
      const countryCode = req.query.country_code || req.headers['x-country-code'];

      const cart = await CartService.getOrCreateCart(userId, null, countryCode);
      const cartWithItems = await CartService.getCartWithItems(cart.cart_uuid);

      return res.json(successResponse(cartWithItems));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo carrito', 'GET_CART_ERROR', error.message)
      );
    }
  }

  /**
   * Agrega item al carrito
   * POST /api/cart/items
   */
  static async addItem(req, res) {
    try {
      const userId = req.user.id;
      const itemData = req.body;

      // Obtener o crear carrito
      const cart = await CartService.getOrCreateCart(userId);

      // Agregar item
      const updatedCart = await CartService.addItemToCart(
        cart.cart_uuid,
        itemData,
        userId
      );

      return res.status(201).json(
        successResponse(updatedCart, 'Item agregado al carrito exitosamente')
      );
    } catch (error) {
      return res.status(400).json(
        errorResponse('Error agregando item al carrito', 'ADD_ITEM_ERROR', error.message)
      );
    }
  }

  /**
   * Actualiza cantidad de item
   * PUT /api/cart/items/:itemId
   */
  static async updateItemQuantity(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;

      // Obtener carrito del usuario
      const cart = await CartService.getOrCreateCart(userId);

      await CartService.updateItemQuantity(
        parseInt(itemId),
        quantity,
        cart.country_code
      );

      const updatedCart = await CartService.getCartWithItems(cart.cart_uuid);

      return res.json(
        successResponse(updatedCart, 'Cantidad actualizada exitosamente')
      );
    } catch (error) {
      return res.status(400).json(
        errorResponse('Error actualizando cantidad', 'UPDATE_QUANTITY_ERROR', error.message)
      );
    }
  }

  /**
   * Elimina item del carrito
   * DELETE /api/cart/items/:itemId
   */
  static async removeItem(req, res) {
    try {
      const { itemId } = req.params;
      const userId = req.user.id;

      const cart = await CartService.getOrCreateCart(userId);

      const updatedCart = await CartService.removeItemFromCart(
        cart.cart_uuid,
        parseInt(itemId)
      );

      return res.json(
        successResponse(updatedCart, 'Item eliminado exitosamente')
      );
    } catch (error) {
      return res.status(400).json(
        errorResponse('Error eliminando item', 'REMOVE_ITEM_ERROR', error.message)
      );
    }
  }

  /**
   * Limpia el carrito
   * DELETE /api/cart
   */
  static async clearCart(req, res) {
    try {
      const userId = req.user.id;
      const cart = await CartService.getOrCreateCart(userId);

      const clearedCart = await CartService.clearCart(cart.cart_uuid);

      return res.json(
        successResponse(clearedCart, 'Carrito limpiado exitosamente')
      );
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error limpiando carrito', 'CLEAR_CART_ERROR', error.message)
      );
    }
  }

  /**
   * Obtiene resumen del carrito (para checkout)
   * GET /api/cart/summary
   */
  static async getCartSummary(req, res) {
    try {
      const userId = req.user.id;
      const cart = await CartService.getOrCreateCart(userId);
      const cartWithItems = await CartService.getCartWithItems(cart.cart_uuid);

      const summary = {
        cart_uuid: cartWithItems.cart_uuid,
        item_count: cartWithItems.items.length,
        subtotal: cartWithItems.subtotal,
        tax_amount: cartWithItems.tax_amount,
        discount_amount: cartWithItems.discount_amount,
        total_amount: cartWithItems.total_amount,
        currency: cartWithItems.currency,
        country_code: cartWithItems.country_code,
        items: cartWithItems.items.map(item => ({
          id: item.id,
          name: item.item_name,
          type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          tax_amount: item.tax_amount,
          total: item.total
        }))
      };

      return res.json(successResponse(summary));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo resumen', 'GET_SUMMARY_ERROR', error.message)
      );
    }
  }

  /**
   * Crea carrito de prueba (público, sin autenticación)
   * POST /api/cart/test
   */
  static async createTestCart(req, res) {
    try {
      const { userId = 1, currency = 'USD' } = req.body; // Usar ID 1 por defecto (usuario administrador)

      // Crear carrito de prueba usando el servicio
      const cart = await CartService.createTestCart(userId, currency);

      return res.status(201).json(
        successResponse({
          cartId: cart.cart_uuid,
          cartUUID: cart.cart_uuid
        }, 'Carrito de prueba creado exitosamente')
      );
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error creando carrito de prueba', 'CREATE_TEST_CART_ERROR', error.message)
      );
    }
  }

  /**
   * Agrega item de prueba al carrito (público, sin autenticación)
   * POST /api/cart/:cartId/test/items
   */
  static async addTestItem(req, res) {
    try {
      const { cartId } = req.params;
      const itemData = {
        ...req.body,
        serviceType: 'talent_search',
        quantity: 1,
        price: 99.99
      };

      const updatedCart = await CartService.addTestItemToCart(cartId, itemData);

      return res.status(201).json(
        successResponse(updatedCart, 'Item de prueba agregado exitosamente')
      );
    } catch (error) {
      return res.status(400).json(
        errorResponse('Error agregando item de prueba', 'ADD_TEST_ITEM_ERROR', error.message)
      );
    }
  }

  /**
   * Calcula total del carrito de prueba (público, sin autenticación)
   * GET /api/cart/:cartId/test/total
   */
  static async calculateTestTotal(req, res) {
    try {
      const { cartId } = req.params;

      const total = await CartService.calculateTestCartTotal(cartId);

      return res.json(successResponse(total));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error calculando total de prueba', 'CALCULATE_TEST_TOTAL_ERROR', error.message)
      );
    }
  }
}

export default CartController;
