import prisma from '../../database/prisma.js';
import logger from '../../config/logger.config.js';

class CartModel {
  /**
   * Crea un nuevo carrito
   */
  static async createCart(cartData) {
    try {
      const created = await prisma.shoppingCart.create({
        data: {
          cartUuid: cartData.cart_uuid,
          userId: cartData.id_usuario || null,
          sessionId: cartData.session_id || null,
          status: (cartData.status || 'active'),
          currency: cartData.currency || 'USD',
          countryCode: cartData.country_code || null,
          expiresAt: cartData.expires_at || null,
        }
      });
      return created.id;
    } catch (error) {
      logger.error('Error creando carrito:', error);
      throw error;
    }
  }

  /**
   * Obtiene carrito por UUID
   */
  static async getCartByUUID(cartUUID) {
    try {
      const cart = await prisma.shoppingCart.findUnique({ where: { cartUuid: cartUUID } });
      return cart || null;
    } catch (error) {
      logger.error('Error obteniendo carrito:', error);
      throw error;
    }
  }

  /**
   * Obtiene carrito activo del usuario
   */
  static async getActiveCartByUser(userId) {
    try {
      const cart = await prisma.shoppingCart.findFirst({
        where: { userId: userId, status: 'active' },
        orderBy: { createdAt: 'desc' }
      });
      return cart || null;
    } catch (error) {
      logger.error('Error obteniendo carrito activo:', error);
      throw error;
    }
  }

  /**
   * Obtiene items del carrito
   */
  static async getCartItems(cartId) {
    try {
      const rows = await prisma.cartItem.findMany({
        where: { cartId },
        orderBy: { createdAt: 'asc' }
      });
      return rows;
    } catch (error) {
      logger.error('Error obteniendo items del carrito:', error);
      throw error;
    }
  }

  /**
   * Agrega item al carrito
   */
  static async addItemToCart(cartId, itemData) {
    try {
      const created = await prisma.cartItem.create({
        data: {
          cartId,
          itemType: itemData.item_type,
          itemId: itemData.item_id || null,
          itemName: itemData.item_name,
          quantity: itemData.quantity || 1,
          unitPrice: itemData.unit_price,
          discountPercentage: itemData.discount_percentage || 0,
          taxRate: itemData.tax_rate || 0,
          subtotal: itemData.subtotal,
          taxAmount: itemData.tax_amount || 0,
          total: itemData.total,
          metadata: itemData.metadata || null,
        }
      });
      return created.id;
    } catch (error) {
      logger.error('Error agregando item al carrito:', error);
      throw error;
    }
  }

  /**
   * Actualiza cantidad de item
   */
  static async updateItemQuantity(itemId, quantity, subtotal, taxAmount, total) {
    try {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity, subtotal, taxAmount, total }
      });
      return true;
    } catch (error) {
      logger.error('Error actualizando cantidad de item:', error);
      throw error;
    }
  }

  /**
   * Elimina item del carrito
   */
  static async removeItem(itemId) {
    try {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return true;
    } catch (error) {
      logger.error('Error eliminando item del carrito:', error);
      throw error;
    }
  }

  /**
   * Actualiza totales del carrito
   */
  static async updateCartTotals(cartId, totals) {
    try {
      await prisma.shoppingCart.update({
        where: { id: cartId },
        data: {
          subtotal: totals.subtotal,
          taxAmount: totals.tax_amount,
          discountAmount: totals.discount_amount,
          totalAmount: totals.total_amount,
        }
      });
      return true;
    } catch (error) {
      logger.error('Error actualizando totales del carrito:', error);
      throw error;
    }
  }

  /**
   * Actualiza estado del carrito
   */
  static async updateCartStatus(cartId, status, convertedAt = null) {
    try {
      await prisma.shoppingCart.update({
        where: { id: cartId },
        data: { status, convertedAt: convertedAt || undefined }
      });
      return true;
    } catch (error) {
      logger.error('Error actualizando estado del carrito:', error);
      throw error;
    }
  }

  /**
   * Limpia items del carrito
   */
  static async clearCart(cartId) {
    try {
      const result = await prisma.cartItem.deleteMany({ where: { cartId } });
      return result.count;
    } catch (error) {
      logger.error('Error limpiando carrito:', error);
      throw error;
    }
  }

  /**
   * Obtiene item específico del carrito
   */
  static async getCartItem(itemId) {
    try {
      const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
      return item || null;
    } catch (error) {
      logger.error('Error obteniendo item:', error);
      throw error;
    }
  }

  /**
   * Verifica si un item ya existe en el carrito
   */
  static async findExistingItem(cartId, itemType, itemId) {
    try {
      const item = await prisma.cartItem.findFirst({
        where: { cartId, itemType, itemId }
      });
      return item || null;
    } catch (error) {
      logger.error('Error buscando item existente:', error);
      throw error;
    }
  }

  /**
   * Cuenta items en el carrito
   */
  static async countCartItems(cartId) {
    try {
      const count = await prisma.cartItem.count({ where: { cartId } });
      return count;
    } catch (error) {
      logger.error('Error contando items:', error);
      throw error;
    }
  }

  /**
   * Marca carritos expirados
   */
  static async markExpiredCarts() {
    try {
      const result = await prisma.shoppingCart.updateMany({
        where: { status: 'active', expiresAt: { lt: new Date() } },
        data: { status: 'expired' }
      });
      return result.count;
    } catch (error) {
      logger.error('Error marcando carritos expirados:', error);
      throw error;
    }
  }
}

export default CartModel;
