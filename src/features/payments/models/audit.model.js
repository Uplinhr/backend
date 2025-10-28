import prisma from '../../../database/prisma.js';
import logger from '../../../config/logger.config.js';

class AuditModel {
  /**
   * Registra evento en el log de auditoría
   */
  static async logEvent(auditData) {
    try {
      const created = await prisma.paymentAuditLog.create({
        data: {
          orderId: auditData.id_order ?? null,
          transactionId: auditData.id_transaction ?? null,
          userId: auditData.id_usuario ?? null,
          eventType: auditData.event_type,
          eventDescription: auditData.event_description ?? null,
          performedBy: auditData.performed_by ?? null,
          performedByType: auditData.performed_by_type || 'system',
          oldValue: auditData.old_value ?? null,
          newValue: auditData.new_value ?? null,
          metadata: auditData.metadata ?? null,
          ipAddress: auditData.ip_address ?? null,
          userAgent: auditData.user_agent ?? null
        }
      });
      return created.id;
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
      const rows = await prisma.paymentAuditLog.findMany({
        where: { orderId: String(orderId) },
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      });
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
      const rows = await prisma.paymentAuditLog.findMany({
        where: { userId: String(userId) },
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      });
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
      const rows = await prisma.paymentAuditLog.findMany({
        where: { eventType },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });
      return rows;
    } catch (error) {
      logger.error('Error obteniendo eventos por tipo:', error);
      throw error;
    }
  }
}

export default AuditModel;
