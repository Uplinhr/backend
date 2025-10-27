import pool from '../../../database/database.js';
import logger from '../../../config/logger.config.js';

class TransactionModel {
  /**
   * Crea una nueva transacción
   */
  static async createTransaction(transactionData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO payment_transactions 
        (transaction_id, id_order, status, payment_gateway, gateway_transaction_id, 
         gateway_status, gateway_response, amount, currency, gateway_fee, net_amount, 
         payment_method, card_last_four, card_brand, error_code, error_message, 
         processed_at, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionData.transaction_id,
          transactionData.id_order,
          transactionData.status,
          transactionData.payment_gateway,
          transactionData.gateway_transaction_id || null,
          transactionData.gateway_status || null,
          transactionData.gateway_response ? JSON.stringify(transactionData.gateway_response) : null,
          transactionData.amount,
          transactionData.currency || 'USD',
          transactionData.gateway_fee || null,
          transactionData.net_amount || null,
          transactionData.payment_method || null,
          transactionData.card_last_four || null,
          transactionData.card_brand || null,
          transactionData.error_code || null,
          transactionData.error_message || null,
          transactionData.processed_at || null,
          transactionData.ip_address || null,
          transactionData.user_agent || null
        ]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creando transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene transacción por ID
   */
  static async getTransactionById(transactionId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM payment_transactions WHERE id = ?',
        [transactionId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene transacciones de una orden
   */
  static async getTransactionsByOrder(orderId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM payment_transactions WHERE id_order = ? ORDER BY fecha_alta DESC',
        [orderId]
      );
      return rows;
    } catch (error) {
      logger.error('Error obteniendo transacciones de orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene transacción por transaction_id único
   */
  static async getTransactionByTransactionId(transactionId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM payment_transactions WHERE transaction_id = ?',
        [transactionId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo transacción por transaction_id:', error);
      throw error;
    }
  }

  /**
   * Actualiza estado de transacción
   */
  static async updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
      const updates = ['status = ?'];
      const params = [status];

      if (additionalData.gateway_status) {
        updates.push('gateway_status = ?');
        params.push(additionalData.gateway_status);
      }

      if (additionalData.error_code) {
        updates.push('error_code = ?');
        params.push(additionalData.error_code);
      }

      if (additionalData.error_message) {
        updates.push('error_message = ?');
        params.push(additionalData.error_message);
      }

      if (status === 'completed' || status === 'captured') {
        updates.push('processed_at = NOW()');
      }

      params.push(transactionId);

      const [result] = await pool.query(
        `UPDATE payment_transactions SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error actualizando estado de transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene última transacción exitosa de una orden
   */
  static async getLastSuccessfulTransaction(orderId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payment_transactions 
         WHERE id_order = ? AND status = 'completed' 
         ORDER BY fecha_alta DESC LIMIT 1`,
        [orderId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo última transacción exitosa:', error);
      throw error;
    }
  }
}

export default TransactionModel;
