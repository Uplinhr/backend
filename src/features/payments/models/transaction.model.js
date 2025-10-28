import prisma from '../../../database/prisma.js';
import logger from '../../../config/logger.config.js';

class TransactionModel {
  /**
   * Crea una nueva transacción
   */
  static async createTransaction(transactionData) {
    try {
      const created = await prisma.paymentTransaction.create({
        data: {
          transactionId: transactionData.transaction_id,
          orderId: transactionData.id_order,
          status: transactionData.status,
          paymentGateway: transactionData.payment_gateway,
          gatewayTransactionId: transactionData.gateway_transaction_id ?? null,
          gatewayStatus: transactionData.gateway_status ?? null,
          gatewayResponse: transactionData.gateway_response ?? null,
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          gatewayFee: transactionData.gateway_fee ?? null,
          netAmount: transactionData.net_amount ?? null,
          paymentMethod: transactionData.payment_method ?? null,
          cardLastFour: transactionData.card_last_four ?? null,
          cardBrand: transactionData.card_brand ?? null,
          errorCode: transactionData.error_code ?? null,
          errorMessage: transactionData.error_message ?? null,
          processedAt: transactionData.processed_at ?? null,
          ipAddress: transactionData.ip_address ?? null,
          userAgent: transactionData.user_agent ?? null
        }
      });
      return created.id;
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
      const tx = await prisma.paymentTransaction.findUnique({ where: { id: String(transactionId) } });
      return tx || null;
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
      const rows = await prisma.paymentTransaction.findMany({
        where: { orderId: String(orderId) },
        orderBy: { createdAt: 'desc' }
      });
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
      const tx = await prisma.paymentTransaction.findUnique({ where: { transactionId } });
      return tx || null;
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
      const data = { status };
      if (additionalData.gateway_status) data['gatewayStatus'] = additionalData.gateway_status;
      if (additionalData.error_code) data['errorCode'] = additionalData.error_code;
      if (additionalData.error_message) data['errorMessage'] = additionalData.error_message;
      if (status === 'completed' || status === 'captured') data['processedAt'] = new Date();

      await prisma.paymentTransaction.update({ where: { id: String(transactionId) }, data });
      return true;
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
      const row = await prisma.paymentTransaction.findFirst({
        where: { orderId: String(orderId), status: 'completed' },
        orderBy: { createdAt: 'desc' }
      });
      return row || null;
    } catch (error) {
      logger.error('Error obteniendo última transacción exitosa:', error);
      throw error;
    }
  }
}

export default TransactionModel;
