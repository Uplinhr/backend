import CartModel from './model.js';
import TaxService from '../taxes/service.js';
import { generateCartUUID, calculateExpirationDate, roundToTwoDecimals } from '../../utils/helpers.js';
import paymentConfig from '../../config/payment.config.js';
import logger from '../../config/logger.config.js';
import prisma from '../../database/prisma.js';

class CartService {
  /**
   * Crea o recupera carrito activo del usuario
   */
  static async getOrCreateCart(userId, sessionId = null, countryCode = null) {
    try {
      // Intentar obtener carrito activo existente
      let cart = await CartModel.getActiveCartByUser(userId);

      if (cart && !this.isCartExpired(cart)) {
        return cart;
      }

      // Crear nuevo carrito
      const cartUUID = generateCartUUID();
      const expiresAt = calculateExpirationDate(paymentConfig.cart.expirationHours);

      const cartData = {
        cart_uuid: cartUUID,
        id_usuario: userId,
        session_id: sessionId,
        status: 'active',
        currency: 'USD',
        country_code: countryCode || paymentConfig.tax.defaultCountry,
        expires_at: expiresAt
      };

      const cartId = await CartModel.createCart(cartData);

      logger.info({
        type: 'CART_CREATED',
        cartId,
        cartUUID,
        userId
      });

      return await CartModel.getCartByUUID(cartUUID);
    } catch (error) {
      logger.error('Error obteniendo/creando carrito:', error);
      throw error;
    }
  }

  /**
   * Crea carrito de prueba (público, sin autenticación)
   */
  static async createTestCart(userId = 1, currency = 'USD') {
    try {
      const cartUUID = generateCartUUID();
      const expiresAt = calculateExpirationDate(paymentConfig.cart.expirationHours);

      const cartData = {
        cart_uuid: cartUUID,
        id_usuario: userId,
        session_id: 'test-session-' + Date.now(),
        status: 'active',
        currency,
        country_code: paymentConfig.tax.defaultCountry,
        expires_at: expiresAt
      };

      const cartId = await CartModel.createCart(cartData);

      logger.info({
        type: 'TEST_CART_CREATED',
        cartId,
        cartUUID,
        userId
      });

      return await CartModel.getCartByUUID(cartUUID);
    } catch (error) {
      logger.error('Error creando carrito de prueba:', error);
      throw error;
    }
  }

  /**
   * Agrega item de prueba al carrito (público, sin autenticación)
   */
  static async addTestItemToCart(cartUUID, itemData) {
    try {
      const cart = await CartModel.getCartByUUID(cartUUID);

      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      if (cart.status !== 'active') {
        throw new Error('El carrito no está activo');
      }

      if (this.isCartExpired(cart)) {
        throw new Error('El carrito ha expirado');
      }

      // Datos de prueba por defecto
      const testItemData = {
        item_type: itemData.serviceType || 'talent_search',
        item_id: itemData.serviceId || 1,
        item_name: 'Búsqueda de Talento Individual',
        quantity: itemData.quantity || 1,
        unit_price: itemData.price || 720.00,
        discount_percentage: 0,
        ...itemData
      };

      // Calcular impuestos de prueba (IVA 21% Argentina)
      const itemSubtotal = testItemData.unit_price * testItemData.quantity;
      const taxRate = 0.21;
      const taxAmount = roundToTwoDecimals(itemSubtotal * taxRate);
      const total = roundToTwoDecimals(itemSubtotal + taxAmount);

      // Preparar datos del item
      const cartItem = {
        item_type: testItemData.item_type,
        item_id: testItemData.item_id,
        item_name: testItemData.item_name,
        quantity: testItemData.quantity,
        unit_price: testItemData.unit_price,
        discount_percentage: testItemData.discount_percentage,
        tax_rate: taxRate,
        subtotal: itemSubtotal,
        tax_amount: taxAmount,
        total,
        metadata: {}
      };

      // Agregar item al carrito
      const itemId = await CartModel.addItemToCart(cart.id, cartItem);

      // Recalcular totales del carrito
      await this.recalculateCartTotals(cart.id);

      logger.info({
        type: 'TEST_ITEM_ADDED_TO_CART',
        cartId: cart.id,
        itemId,
        itemType: testItemData.item_type
      });

      return await this.getCartWithItems(cartUUID);
    } catch (error) {
      logger.error('Error agregando item de prueba al carrito:', error);
      throw error;
    }
  }

  /**
   * Calcula total del carrito de prueba (público, sin autenticación)
   */
  static async calculateTestCartTotal(cartUUID) {
    try {
      const cart = await CartModel.getCartByUUID(cartUUID);

      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      const items = await CartModel.getCartItems(cart.id);

      let subtotal = 0;
      let taxAmount = 0;
      let totalAmount = 0;

      items.forEach(item => {
        subtotal += parseFloat(item.subtotal);
        taxAmount += parseFloat(item.tax_amount);
        totalAmount += parseFloat(item.total);
      });

      return {
        cart_uuid: cartUUID,
        subtotal: roundToTwoDecimals(subtotal),
        tax_amount: roundToTwoDecimals(taxAmount),
        discount_amount: 0,
        total: roundToTwoDecimals(totalAmount),
        currency: cart.currency,
        country_code: cart.country_code,
        item_count: items.length
      };
    } catch (error) {
      logger.error('Error calculando total de carrito de prueba:', error);
      throw error;
    }
  }

  /**
   * Obtiene carrito con sus items
   */
  static async getCartWithItems(cartUUID) {
    try {
      const cart = await CartModel.getCartByUUID(cartUUID);

      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      const items = await CartModel.getCartItems(cart.id);

      return {
        ...cart,
        items,
        item_count: items.length
      };
    } catch (error) {
      logger.error('Error obteniendo carrito con items:', error);
      throw error;
    }
  }

  /**
   * Agrega item al carrito
   */
  static async addItemToCart(cartUUID, itemData, userId) {
    try {
      const cart = await CartModel.getCartByUUID(cartUUID);

      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      if (cart.status !== 'active') {
        throw new Error('El carrito no está activo');
      }

      if (this.isCartExpired(cart)) {
        throw new Error('El carrito ha expirado');
      }

      // Verificar límite de items
      const itemCount = await CartModel.countCartItems(cart.id);
      if (itemCount >= paymentConfig.cart.maxItems) {
        throw new Error(`Máximo ${paymentConfig.cart.maxItems} items permitidos por carrito`);
      }

      // Obtener información del producto según el tipo
      const productInfo = await this.getProductInfo(itemData.item_type, itemData.item_id);

      if (!productInfo) {
        throw new Error('Producto no encontrado');
      }

      // Verificar si el item ya existe en el carrito
      const existingItem = await CartModel.findExistingItem(
        cart.id,
        itemData.item_type,
        itemData.item_id
      );

      if (existingItem) {
        // Actualizar cantidad
        const newQuantity = existingItem.quantity + (itemData.quantity || 1);
        return await this.updateItemQuantity(existingItem.id, newQuantity, cart.country_code);
      }

      // Calcular precios
      const quantity = itemData.quantity || 1;
      const unitPrice = productInfo.price;
      const discountPercentage = productInfo.discount_percentage || 0;

      const itemSubtotal = unitPrice * quantity;
      const discountAmount = itemSubtotal * (discountPercentage / 100);
      const subtotalAfterDiscount = itemSubtotal - discountAmount;

      // Calcular impuestos
      const taxCalc = await TaxService.calculateTaxes(
        subtotalAfterDiscount,
        cart.country_code,
        itemData.item_type
      );

      // Preparar datos del item
      const cartItem = {
        item_type: itemData.item_type,
        item_id: itemData.item_id,
        item_name: productInfo.name,
        quantity,
        unit_price: unitPrice,
        discount_percentage: discountPercentage,
        tax_rate: taxCalc.taxRate,
        subtotal: roundToTwoDecimals(subtotalAfterDiscount),
        tax_amount: taxCalc.taxAmount,
        total: taxCalc.total,
        metadata: itemData.metadata || {}
      };

      // Agregar item al carrito
      const itemId = await CartModel.addItemToCart(cart.id, cartItem);

      // Recalcular totales del carrito
      await this.recalculateCartTotals(cart.id);

      // No explicit transaction; operations ya son atómicas con Prisma en modelo

      logger.info({
        type: 'ITEM_ADDED_TO_CART',
        cartId: cart.id,
        itemId,
        itemType: itemData.item_type,
        userId
      });

      return await this.getCartWithItems(cartUUID);
    } catch (error) {
      logger.error('Error agregando item al carrito:', error);
      throw error;
    }
  }

  /**
   * Recalcula totales del carrito
   */
  static async recalculateCartTotals(cartId) {
    try {
      const items = await CartModel.getCartItems(cartId);

      let subtotal = 0;
      let taxAmount = 0;
      let totalAmount = 0;

      items.forEach(item => {
        subtotal += parseFloat(item.subtotal);
        taxAmount += parseFloat(item.tax_amount);
        totalAmount += parseFloat(item.total);
      });

      const totals = {
        subtotal: roundToTwoDecimals(subtotal),
        tax_amount: roundToTwoDecimals(taxAmount),
        discount_amount: 0, // TODO: Implementar cupones de descuento
        total_amount: roundToTwoDecimals(totalAmount)
      };

      await CartModel.updateCartTotals(cartId, totals);

      return totals;
    } catch (error) {
      logger.error('Error recalculando totales:', error);
      throw error;
    }
  }

  /**
   * Obtiene información del producto según el tipo
   */
  static async getProductInfo(itemType, itemId) {
    try {
      switch (itemType) {
        case 'membership': {
          const plan = await prisma.plan.findUnique({ where: { id: String(itemId) } });
          if (!plan || plan.isActive === false) return null;
          return { id: plan.id, name: plan.name, price: plan.price, discount_percentage: 0 };
        }
        case 'talent_search': {
          const svc = await prisma.talentSearchService.findUnique({ where: { id: String(itemId) } });
          if (!svc || svc.isActive === false) return null;
          return { id: svc.id, name: svc.name, price: svc.price, discount_percentage: 0 };
        }
        case 'credits': {
          // No existe catálogo de créditos en Prisma actual
          throw new Error('Tipo de item credits no soportado aún en Prisma');
        }
        default:
          throw new Error('Tipo de item no soportado');
      }
    } catch (error) {
      logger.error('Error obteniendo información del producto:', error);
      throw error;
    }
  }

  /**
   * Verifica si el carrito ha expirado
   */
  static isCartExpired(cart) {
    if (!cart.expires_at) return false;
    return new Date() > new Date(cart.expires_at);
  }

  /**
   * Marca carrito como checkout (no cambia estado en DB, solo logging/compat)
   */
  static async markAsCheckout(cartUUID) {
    try {
      const cart = await CartModel.getCartByUUID(cartUUID);
      if (!cart) throw new Error('Carrito no encontrado');
      return true;
    } catch (error) {
      logger.error('Error marcando carrito como checkout:', error);
      throw error;
    }
  }

  /**
   * Marca carrito como convertido
   */
  static async markAsConverted(cartUUID) {
    try {
      const cart = await CartModel.getCartByUUID(cartUUID);
      if (!cart) throw new Error('Carrito no encontrado');
      await prisma.shoppingCart.update({
        where: { id: cart.id },
        data: { status: 'converted', convertedAt: new Date() }
      });
      return true;
    } catch (error) {
      logger.error('Error marcando carrito como convertido:', error);
      throw error;
    }
  }
}

export default CartService;
