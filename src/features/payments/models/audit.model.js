import pool from '../../../database/database.js';
import logger from '../../../config/logger.config.js';

class AuditModel {
  /**
   * Registra evento en el log de auditoría
   */
  static async logEvent(auditData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO payment_audit_log 
        (id_order, id_transaction, id_usuario, event_type, event_description, 
         performed_by, performed_by_type, old_value, new_value, metadata, 
         ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditData.id_order || null,
          auditData.id_transaction || null,
          auditData.id_usuario || null,
          auditData.event_type,
          auditData.event_description || null,
          auditData.performed_by || null,
          auditData.performed_by_type || 'system',
          auditData.old_value ? JSON.stringify(auditData.old_value) : null,
          auditData.new_value ? JSON.stringify(auditData.new_value) : null,
          auditData.metadata ? JSON.stringify(auditData.metadata) : null,
          auditData.ip_address || null,
          auditData.user_agent || null
        ]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error registrando evento de auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene log de auditoría de una orden
   */
  static async getOrderAuditLog(orderId, limit = 100) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payment_audit_log 
         WHERE id_order = ? 
         ORDER BY fecha_alta DESC 
         LIMIT ?`,
        [orderId, limit]
      );
      return rows;
    } catch (error) {
      logger.error('Error obteniendo log de auditoría de orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene log de auditoría de un usuario
   */
  static async getUserAuditLog(userId, limit = 100) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payment_audit_log 
         WHERE id_usuario = ? 
         ORDER BY fecha_alta DESC 
         LIMIT ?`,
        [userId, limit]
      );
      return rows;
    } catch (error) {
      logger.error('Error obteniendo log de auditoría de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene eventos de auditoría por tipo
   */
  static async getEventsByType(eventType, limit = 100, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM payment_audit_log 
         WHERE event_type = ? 
         ORDER BY fecha_alta DESC 
         LIMIT ? OFFSET ?`,
        [eventType, limit, offset]
      );
      return rows;
    } catch (error) {
      logger.error('Error obteniendo eventos por tipo:', error);
      throw error;
    }
  }
}

export default AuditModel;
