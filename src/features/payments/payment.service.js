import OrderModel from './models/order.model.js';
import TransactionModel from './models/transaction.model.js';
import AuditModel from './models/audit.model.js';
import CartService from '../cart/service.js';
import PaymentGatewayFactory from './adapters/index.js';
import { generateOrderNumber, generateTransactionId, calculateExpirationDate } from '../../utils/helpers.js';
import paymentConfig from '../../config/payment.config.js';
import logger, { paymentLogger } from '../../config/logger.config.js';
import pool from '../../database/database.js';

class PaymentService {
  /**
   * Crea orden de pago desde el carrito
   */
  static async createOrderFromCart(userId, cartUUID, paymentGateway, additionalData = {}) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener carrito con items
      const cart = await CartService.getCartWithItems(cartUUID);

      if (!cart || cart.id_usuario !== userId) {
        throw new Error('Carrito no encontrado o no pertenece al usuario');
      }

      if (cart.items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      if (cart.status !== 'active') {
        throw new Error('El carrito no está activo');
      }

      // Validar pasarela
      if (!PaymentGatewayFactory.isGatewayAvailable(paymentGateway)) {
        throw new Error(`Pasarela de pago ${paymentGateway} no disponible`);
      }

      // Marcar carrito como checkout
      await CartService.markAsCheckout(cartUUID);

      // Generar número de orden
      const orderNumber = generateOrderNumber();
      const expiresAt = calculateExpirationDate(paymentConfig.order.paymentExpirationHours);

      // Crear orden
      const orderData = {
        order_number: orderNumber,
        id_usuario: userId,
        id_cart: cart.id,
        status: 'pending',
        payment_gateway: paymentGateway,
        currency: cart.currency,
        subtotal: cart.subtotal,
        tax_amount: cart.tax_amount,
        discount_amount: cart.discount_amount || 0,
        total_amount: cart.total_amount,
        country_code: cart.country_code,
        tax_rate: cart.items[0]?.tax_rate || 0,
        tax_name: additionalData.tax_name || 'IVA',
        customer_email: additionalData.customer_email,
        customer_name: additionalData.customer_name,
        billing_address: additionalData.billing_address,
        expires_at: expiresAt,
        notes: additionalData.notes
      };

      const orderId = await OrderModel.createOrder(orderData);

      // Registrar auditoría
      await AuditModel.logEvent({
        id_order: orderId,
        id_usuario: userId,
        event_type: 'order_created',
        event_description: `Orden ${orderNumber} creada`,
        performed_by_type: 'customer',
        new_value: { order_id: orderId, total: cart.total_amount },
        ip_address: additionalData.ip_address,
        user_agent: additionalData.user_agent
      });

      // Crear pago en la pasarela
      const paymentResult = await this.processPaymentWithGateway(
        orderId,
        paymentGateway,
        cart,
        orderData
      );

      await connection.commit();

      paymentLogger.info({
        type: 'ORDER_CREATED',
        orderId,
        orderNumber,
        userId,
        gateway: paymentGateway,
        amount: cart.total_amount
      });

      return {
        order_id: orderId,
        order_number: orderNumber,
        payment_url: paymentResult.payment_url,
        payment_id: paymentResult.payment_id,
        total_amount: cart.total_amount,
        currency: cart.currency,
        expires_at: expiresAt
      };

    } catch (error) {
      await connection.rollback();
      paymentLogger.error({
        type: 'ORDER_CREATION_ERROR',
        userId,
        error: error.message
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Procesa el pago con la pasarela correspondiente
   */
  static async processPaymentWithGateway(orderId, gateway, cart, orderData) {
    try {
      const adapter = PaymentGatewayFactory.getAdapter(gateway);

      // Preparar datos para la pasarela
      const paymentData = {
        order_id: orderId,
        order_number: orderData.order_number,
        user_id: orderData.id_usuario,
        total_amount: orderData.total_amount,
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax_amount,
        discount_amount: orderData.discount_amount,
        currency: orderData.currency,
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        billing_address: orderData.billing_address,
        items: cart.items.map(item => ({
          name: item.item_name,
          description: `${item.item_type} - ${item.item_name}`,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      // Crear pago en la pasarela
      const result = await adapter.createPayment(paymentData);

      // Actualizar orden con información del pago
      await OrderModel.updateExternalPaymentInfo(
        orderId,
        result.payment_id,
        result.payment_url
      );

      // Crear transacción inicial
      const transactionId = generateTransactionId(gateway);
      await TransactionModel.createTransaction({
        transaction_id: transactionId,
        id_order: orderId,
        status: 'initiated',
        payment_gateway: gateway,
        gateway_transaction_id: result.payment_id,
        gateway_status: result.status || 'pending',
        gateway_response: result,
        amount: orderData.total_amount,
        currency: orderData.currency
      });

      // Auditoría
      await AuditModel.logEvent({
        id_order: orderId,
        event_type: 'payment_initiated',
        event_description: `Pago iniciado en ${gateway}`,
        performed_by_type: 'system',
        new_value: { payment_id: result.payment_id }
      });

      return result;

    } catch (error) {
      paymentLogger.error({
        type: 'GATEWAY_PROCESSING_ERROR',
        orderId,
        gateway,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtiene orden por ID
   */
  static async getOrder(orderId, userId = null) {
    try {
      const order = await OrderModel.getOrderById(orderId);

      if (!order) {
        throw new Error('Orden no encontrada');
      }

      // Verificar ownership si se proporciona userId
      if (userId && order.id_usuario !== userId) {
        throw new Error('No tienes permiso para ver esta orden');
      }

      // Obtener transacciones
      const transactions = await TransactionModel.getTransactionsByOrder(orderId);

      return {
        ...order,
        transactions
      };

    } catch (error) {
      logger.error('Error obteniendo orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene órdenes del usuario
   */
  static async getUserOrders(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const orders = await OrderModel.getOrdersByUser(userId, limit, offset);
      const total = await OrderModel.countUserOrders(userId);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Error obteniendo órdenes del usuario:', error);
      throw error;
    }
  }

  /**
   * Procesa webhook de pasarela
   */
  static async processWebhook(gateway, webhookData, headers = {}) {
    try {
      const adapter = PaymentGatewayFactory.getAdapter(gateway);

      // Procesar webhook con el adaptador
      const processedData = await adapter.processWebhook(webhookData);

      if (!processedData) {
        paymentLogger.warn({
          type: 'WEBHOOK_IGNORED',
          gateway,
          reason: 'No data returned from adapter'
        });
        return null;
      }

      // Buscar orden
      let order = null;
      if (processedData.external_reference) {
        order = await OrderModel.getOrderByNumber(processedData.external_reference);
      } else if (processedData.payment_id) {
        order = await OrderModel.getOrderByExternalId(processedData.payment_id);
      }

      if (!order) {
        paymentLogger.warn({
          type: 'WEBHOOK_ORDER_NOT_FOUND',
          gateway,
          paymentId: processedData.payment_id
        });
        return null;
      }

      // Actualizar estado según el evento
      await this.updateOrderFromWebhook(order, processedData);

      paymentLogger.info({
        type: 'WEBHOOK_PROCESSED',
        gateway,
        orderId: order.id,
        status: processedData.status
      });

      return order;

    } catch (error) {
      paymentLogger.error({
        type: 'WEBHOOK_PROCESSING_ERROR',
        gateway,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualiza orden desde webhook
   */
  static async updateOrderFromWebhook(order, webhookData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const oldStatus = order.status;
      const newStatus = webhookData.status;

      // Actualizar estado de la orden
      if (oldStatus !== newStatus) {
        await OrderModel.updateOrderStatus(order.id, newStatus);

        // Si el pago fue completado
        if (newStatus === 'completed') {
          await this.handlePaymentCompleted(order);
        }

        // Registrar auditoría
        await AuditModel.logEvent({
          id_order: order.id,
          id_usuario: order.id_usuario,
          event_type: 'payment_status_changed',
          event_description: `Estado cambiado de ${oldStatus} a ${newStatus}`,
          performed_by_type: 'gateway',
          old_value: { status: oldStatus },
          new_value: { status: newStatus }
        });
      }

      // Crear/actualizar transacción
      const transactionId = generateTransactionId(order.payment_gateway);
      await TransactionModel.createTransaction({
        transaction_id: transactionId,
        id_order: order.id,
        status: newStatus,
        payment_gateway: order.payment_gateway,
        gateway_transaction_id: webhookData.payment_id,
        gateway_status: webhookData.status,
        gateway_response: webhookData.payment_data,
        amount: webhookData.amount || order.total_amount,
        currency: webhookData.currency || order.currency,
        processed_at: new Date()
      });

      await connection.commit();

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Maneja pago completado exitosamente
   */
  static async handlePaymentCompleted(order) {
    try {
      // Marcar carrito como convertido
      if (order.id_cart) {
        const [cartRows] = await pool.query(
          'SELECT cart_uuid FROM shopping_cart WHERE id = ?',
          [order.id_cart]
        );
        if (cartRows[0]) {
          await CartService.markAsConverted(cartRows[0].cart_uuid);
        }
      }

      // TODO: Activar servicios comprados (membresías, créditos, etc.)
      // Esto se implementará en los servicios específicos

      paymentLogger.info({
        type: 'PAYMENT_COMPLETED',
        orderId: order.id,
        amount: order.total_amount
      });

      // Enviar email de confirmación
      // TODO: Implementar en el servicio de notificaciones

    } catch (error) {
      paymentLogger.error({
        type: 'PAYMENT_COMPLETION_ERROR',
        orderId: order.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Procesa reembolso
   */
  static async refundOrder(orderId, reason, amount = null, performedBy = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const order = await OrderModel.getOrderById(orderId);

      if (!order) {
        throw new Error('Orden no encontrada');
      }

      if (order.status !== 'completed') {
        throw new Error('Solo se pueden reembolsar órdenes completadas');
      }

      // Obtener adaptador de la pasarela
      const adapter = PaymentGatewayFactory.getAdapter(order.payment_gateway);

      // Procesar reembolso en la pasarela
      const refundResult = await adapter.refundPayment(
        order.external_payment_id,
        amount
      );

      // Actualizar estado de la orden
      await OrderModel.updateOrderStatus(orderId, 'refunded');

      // Crear transacción de reembolso
      const transactionId = generateTransactionId(order.payment_gateway);
      await TransactionModel.createTransaction({
        transaction_id: transactionId,
        id_order: orderId,
        status: 'refunded',
        payment_gateway: order.payment_gateway,
        gateway_transaction_id: refundResult.refund_id,
        gateway_status: refundResult.status,
        gateway_response: refundResult,
        amount: amount || order.total_amount,
        currency: order.currency,
        processed_at: new Date()
      });

      // Registrar auditoría
      await AuditModel.logEvent({
        id_order: orderId,
        id_usuario: order.id_usuario,
        event_type: 'order_refunded',
        event_description: `Orden reembolsada. Razón: ${reason}`,
        performed_by: performedBy,
        performed_by_type: performedBy ? 'admin' : 'system',
        new_value: { amount: amount || order.total_amount, reason }
      });

      await connection.commit();

      paymentLogger.info({
        type: 'ORDER_REFUNDED',
        orderId,
        amount: amount || order.total_amount,
        reason
      });

      return true;

    } catch (error) {
      await connection.rollback();
      paymentLogger.error({
        type: 'REFUND_ERROR',
        orderId,
        error: error.message
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtiene pasarelas disponibles
   */
  static getAvailableGateways() {
    return PaymentGatewayFactory.getAvailableGateways();
  }

  /**
   * Obtiene estadísticas de pagos (Admin)
   */
  static async getPaymentStats(filters = {}) {
    try {
      const [statsRows] = await pool.query(
        `SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_orders,
          SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as average_order_value
         FROM payment_orders
         WHERE fecha_alta >= COALESCE(?, '2000-01-01')
         AND fecha_alta <= COALESCE(?, NOW())`,
        [filters.date_from, filters.date_to]
      );

      const [gatewayStats] = await pool.query(
        `SELECT 
          payment_gateway,
          COUNT(*) as orders_count,
          SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as revenue
         FROM payment_orders
         WHERE fecha_alta >= COALESCE(?, '2000-01-01')
         AND fecha_alta <= COALESCE(?, NOW())
         GROUP BY payment_gateway`,
        [filters.date_from, filters.date_to]
      );

      return {
        overview: statsRows[0],
        by_gateway: gatewayStats
      };

    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Crea orden PayPal para pruebas (sin autenticación)
   */
  static async createPayPalOrder(orderData) {
    try {
      const { cartId, currency, returnUrl, cancelUrl } = orderData;

      // Obtener carrito
      const cart = await CartService.getCartWithItems(cartId);

      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      if (cart.items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // Simular creación de orden PayPal (sin llamada real para pruebas)
      const paypalOrderId = 'TEST-' + Date.now();

      return {
        paypalOrderId,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`,
        totalAmount: cart.total_amount || cart.total || 0,
        currency
      };

    } catch (error) {
      logger.error('Error creando orden PayPal:', error);
      throw error;
    }
  }
}

export default PaymentService;
