import pool from '../../database/database.js';
import logger from '../../config/logger.config.js';

class CartModel {
  /**
   * Crea un nuevo carrito
   */
  static async createCart(cartData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO shopping_cart 
        (cart_uuid, id_usuario, session_id, status, currency, country_code, expires_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cartData.cart_uuid,
          cartData.id_usuario || null,
          cartData.session_id || null,
          cartData.status || 'active',
          cartData.currency || 'USD',
          cartData.country_code,
          cartData.expires_at
        ]
      );
      return result.insertId;
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
      const [rows] = await pool.query(
        'SELECT * FROM shopping_cart WHERE cart_uuid = ?',
        [cartUUID]
      );
      return rows[0] || null;
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
      const [rows] = await pool.query(
        `SELECT * FROM shopping_cart 
         WHERE id_usuario = ? AND status = 'active' 
         ORDER BY fecha_alta DESC LIMIT 1`,
        [userId]
      );
      return rows[0] || null;
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
      const [rows] = await pool.query(
        'SELECT * FROM cart_items WHERE id_cart = ? ORDER BY fecha_alta',
        [cartId]
      );
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
      const [result] = await pool.query(
        `INSERT INTO cart_items 
        (id_cart, item_type, item_id, item_name, quantity, unit_price, 
         discount_percentage, tax_rate, subtotal, tax_amount, total, metadata) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cartId,
          itemData.item_type,
          itemData.item_id || null,
          itemData.item_name,
          itemData.quantity || 1,
          itemData.unit_price,
          itemData.discount_percentage || 0,
          itemData.tax_rate || 0,
          itemData.subtotal,
          itemData.tax_amount || 0,
          itemData.total,
          JSON.stringify(itemData.metadata || {})
        ]
      );
      return result.insertId;
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
      const [result] = await pool.query(
        `UPDATE cart_items 
         SET quantity = ?, subtotal = ?, tax_amount = ?, total = ?
         WHERE id = ?`,
        [quantity, subtotal, taxAmount, total, itemId]
      );
      return result.affectedRows > 0;
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
      const [result] = await pool.query(
        'DELETE FROM cart_items WHERE id = ?',
        [itemId]
      );
      return result.affectedRows > 0;
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
      const [result] = await pool.query(
        `UPDATE shopping_cart 
         SET subtotal = ?, tax_amount = ?, discount_amount = ?, total_amount = ?
         WHERE id = ?`,
        [totals.subtotal, totals.tax_amount, totals.discount_amount, totals.total_amount, cartId]
      );
      return result.affectedRows > 0;
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
      const [result] = await pool.query(
        `UPDATE shopping_cart 
         SET status = ?, converted_at = COALESCE(?, converted_at)
         WHERE id = ?`,
        [status, convertedAt, cartId]
      );
      return result.affectedRows > 0;
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
      const [result] = await pool.query(
        'DELETE FROM cart_items WHERE id_cart = ?',
        [cartId]
      );
      return result.affectedRows;
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
      const [rows] = await pool.query(
        'SELECT * FROM cart_items WHERE id = ?',
        [itemId]
      );
      return rows[0] || null;
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
      const [rows] = await pool.query(
        `SELECT * FROM cart_items 
         WHERE id_cart = ? AND item_type = ? AND item_id = ?`,
        [cartId, itemType, itemId]
      );
      return rows[0] || null;
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
      const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM cart_items WHERE id_cart = ?',
        [cartId]
      );
      return rows[0].count;
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
      const [result] = await pool.query(
        `UPDATE shopping_cart 
         SET status = 'expired' 
         WHERE status = 'active' AND expires_at < NOW()`
      );
      return result.affectedRows;
    } catch (error) {
      logger.error('Error marcando carritos expirados:', error);
      throw error;
    }
  }
}

export default CartModel;
