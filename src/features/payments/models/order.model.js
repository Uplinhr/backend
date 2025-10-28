import prisma from '../../../database/prisma.js';
import logger from '../../../config/logger.config.js';

class OrderModel {
  /**
   * Crea una nueva orden de pago
   */
  static async createOrder(orderData) {
    try {
      const created = await prisma.paymentOrder.create({
        data: {
          orderNumber: orderData.order_number,
          userId: orderData.id_usuario ?? null,
          cartId: orderData.id_cart ?? null,
          status: orderData.status || 'pending',
          paymentGateway: orderData.payment_gateway,
          currency: orderData.currency || 'USD',
          subtotal: orderData.subtotal ?? null,
          taxAmount: orderData.tax_amount ?? null,
          discountAmount: orderData.discount_amount ?? 0,
          totalAmount: orderData.total_amount ?? null,
          countryCode: orderData.country_code ?? null,
          taxRate: orderData.tax_rate ?? null,
          taxName: orderData.tax_name ?? null,
          paymentMethod: orderData.payment_method ?? null,
          externalPaymentId: orderData.external_payment_id ?? null,
          paymentUrl: orderData.payment_url ?? null,
          expiresAt: orderData.expires_at ?? null,
          customerEmail: orderData.customer_email ?? null,
          customerName: orderData.customer_name ?? null,
          billingAddress: orderData.billing_address ?? null,
          notes: orderData.notes ?? null
        }
      });
      return created.id;
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
      const order = await prisma.paymentOrder.findUnique({ where: { id: String(orderId) } });
      return order || null;
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
      const order = await prisma.paymentOrder.findUnique({ where: { orderNumber } });
      return order || null;
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
      const order = await prisma.paymentOrder.findFirst({ where: { externalPaymentId: externalId } });
      return order || null;
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
      const orders = await prisma.paymentOrder.findMany({
        where: { userId: String(userId) },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });
      return orders;
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
      const count = await prisma.paymentOrder.count({ where: { userId: String(userId) } });
      return count;
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
      const data = { status };
      if (status === 'completed') {
        data['paidAt'] = additionalData.paid_at ?? new Date();
      }
      if (status === 'cancelled') {
        data['cancelledAt'] = new Date();
      }
      if (status === 'refunded') {
        data['refundedAt'] = new Date();
      }

      await prisma.paymentOrder.update({ where: { id: String(orderId) }, data });
      return true;
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
      await prisma.paymentOrder.update({
        where: { id: String(orderId) },
        data: { externalPaymentId: externalId, paymentUrl }
      });
      return true;
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
      const rows = await prisma.paymentOrder.findMany({
        where: { status: 'pending', expiresAt: { not: null, lt: new Date() } }
      });
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
      const where = {};
      if (filters.status) where['status'] = filters.status;
      if (filters.gateway) where['paymentGateway'] = filters.gateway;
      if (filters.date_from || filters.date_to) {
        where['createdAt'] = {};
        if (filters.date_from) where['createdAt'].gte = new Date(filters.date_from);
        if (filters.date_to) where['createdAt'].lte = new Date(filters.date_to);
      }

      const rows = await prisma.paymentOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });
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
      const where = {};
      if (filters.status) where['status'] = filters.status;
      if (filters.gateway) where['paymentGateway'] = filters.gateway;
      if (filters.date_from || filters.date_to) {
        where['createdAt'] = {};
        if (filters.date_from) where['createdAt'].gte = new Date(filters.date_from);
        if (filters.date_to) where['createdAt'].lte = new Date(filters.date_to);
      }
      const count = await prisma.paymentOrder.count({ where });
      return count;
    } catch (error) {
      logger.error('Error contando órdenes:', error);
      throw error;
    }
  }
}

export default OrderModel;
