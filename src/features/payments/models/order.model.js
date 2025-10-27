import pool from '../../../database/database.js';
import logger from '../../../config/logger.config.js';

class OrderModel {
  /**
   * Crea una nueva orden de pago
   */
  static async createOrder(orderData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO payment_orders 
        (order_number, id_usuario, id_cart, status, payment_gateway, currency, 
         subtotal, tax_amount, discount_amount, total_amount, country_code, 
         tax_rate, tax_name, payment_method, external_payment_id, payment_url, 
         expires_at, customer_email, customer_name, billing_address, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderData.order_number,
          orderData.id_usuario,
          orderData.id_cart || null,
          orderData.status || 'pending',
          orderData.payment_gateway,
          orderData.currency || 'USD',
          orderData.subtotal,
          orderData.tax_amount,
          orderData.discount_amount || 0,
          orderData.total_amount,
          orderData.country_code,
          orderData.tax_rate,
          orderData.tax_name,
          orderData.payment_method || null,
          orderData.external_payment_id || null,
          orderData.payment_url || null,
          orderData.expires_at || null,
          orderData.customer_email,
          orderData.customer_name,
          orderData.billing_address ? JSON.stringify(orderData.billing_address) : null,
          orderData.notes || null
        ]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creando orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene orden por ID
   */
  static async getOrderById(orderId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM payment_orders WHERE id = ?',
        [orderId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene orden por número de orden
   */
  static async getOrderByNumber(orderNumber) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM payment_orders WHERE order_number = ?',
        [orderNumber]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo orden por número:', error);
      throw error;
    }
  }

  /**
   * Obtiene orden por ID externo de la pasarela
   */
  static async getOrderByExternalId(externalId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM payment_orders WHERE external_payment_id = ?',
        [externalId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo orden por ID externo:', error);
      throw error;
    }
  }

  /**
   * Obtiene órdenes del usuario
   */
  static async getOrdersByUser(userId, limit = 20, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payment_orders 
         WHERE id_usuario = ? 
         ORDER BY fecha_alta DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      return rows;
    } catch (error) {
      logger.error('Error obteniendo órdenes del usuario:', error);
      throw error;
    }
  }

  /**
   * Cuenta órdenes del usuario
   */
  static async countUserOrders(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM payment_orders WHERE id_usuario = ?',
        [userId]
      );
      return rows[0].count;
    } catch (error) {
      logger.error('Error contando órdenes:', error);
      throw error;
    }
  }

  /**
   * Actualiza estado de la orden
   */
  static async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      const updates = ['status = ?'];
      const params = [status];

      if (status === 'completed' && !additionalData.paid_at) {
        updates.push('paid_at = NOW()');
      } else if (additionalData.paid_at) {
        updates.push('paid_at = ?');
        params.push(additionalData.paid_at);
      }

      if (status === 'cancelled') {
        updates.push('cancelled_at = NOW()');
      }

      if (status === 'refunded') {
        updates.push('refunded_at = NOW()');
      }

      params.push(orderId);

      const [result] = await pool.query(
        `UPDATE payment_orders SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error actualizando estado de orden:', error);
      throw error;
    }
  }

  /**
   * Actualiza información de pago externo
   */
  static async updateExternalPaymentInfo(orderId, externalId, paymentUrl) {
    try {
      const [result] = await pool.query(
        `UPDATE payment_orders 
         SET external_payment_id = ?, payment_url = ? 
         WHERE id = ?`,
        [externalId, paymentUrl, orderId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error actualizando info de pago externo:', error);
      throw error;
    }
  }

  /**
   * Obtiene órdenes pendientes expiradas
   */
  static async getExpiredOrders() {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payment_orders 
         WHERE status = 'pending' 
         AND expires_at IS NOT NULL 
         AND expires_at < NOW()`
      );
      return rows;
    } catch (error) {
      logger.error('Error obteniendo órdenes expiradas:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las órdenes (Admin) con filtros
   */
  static async getAllOrders(filters = {}, limit = 50, offset = 0) {
    try {
      let query = 'SELECT * FROM payment_orders WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.gateway) {
        query += ' AND payment_gateway = ?';
        params.push(filters.gateway);
      }

      if (filters.date_from) {
        query += ' AND fecha_alta >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND fecha_alta <= ?';
        params.push(filters.date_to);
      }

      query += ' ORDER BY fecha_alta DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      logger.error('Error obteniendo todas las órdenes:', error);
      throw error;
    }
  }

  /**
   * Cuenta todas las órdenes con filtros
   */
  static async countAllOrders(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM payment_orders WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.gateway) {
        query += ' AND payment_gateway = ?';
        params.push(filters.gateway);
      }

      if (filters.date_from) {
        query += ' AND fecha_alta >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND fecha_alta <= ?';
        params.push(filters.date_to);
      }

      const [rows] = await pool.query(query, params);
      return rows[0].count;
    } catch (error) {
      logger.error('Error contando órdenes:', error);
      throw error;
    }
  }
}

export default OrderModel;
