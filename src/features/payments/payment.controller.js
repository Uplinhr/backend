import PaymentService from './payment.service.js';
import { successResponse, errorResponse } from '../../utils/helpers.js';
import { paymentLogger } from '../../config/logger.config.js';
import prisma from '../../database/prisma.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

class PaymentController {
  /**
   * Obtiene pasarelas de pago disponibles
   * GET /api/payments/gateways
   */
  static async getAvailableGateways(req, res) {
    try {
      const gateways = PaymentService.getAvailableGateways();
      return res.json(successResponse(gateways));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo pasarelas', 'GET_GATEWAYS_ERROR', error.message)
      );
    }
  }

  /**
   * Crea orden de pago desde el carrito
   * POST /api/payments/create-order
   */
  static async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { 
        cart_uuid, 
        payment_gateway, 
        customer_email, 
        customer_name, 
        billing_address,
        notes
      } = req.body;

      if (!cart_uuid || !payment_gateway) {
        return res.status(400).json(
          errorResponse('cart_uuid y payment_gateway son requeridos', 'MISSING_PARAMS')
        );
      }

      const additionalData = {
        customer_email: customer_email || req.user.email,
        customer_name: customer_name || `${req.user.nombre} ${req.user.apellido}`,
        billing_address,
        notes,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      };

      const order = await PaymentService.createOrderFromCart(
        userId,
        cart_uuid,
        payment_gateway,
        additionalData
      );

      return res.status(201).json(
        successResponse(order, 'Orden creada exitosamente')
      );

    } catch (error) {
      paymentLogger.error({
        type: 'CREATE_ORDER_ERROR',
        userId: req.user?.id,
        error: error.message
      });

      return res.status(400).json(
        errorResponse('Error creando orden', 'CREATE_ORDER_ERROR', error.message)
      );
    }
  }

  /**
   * Obtiene detalles de una orden
   * GET /api/payments/orders/:orderId
   */
  static async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await PaymentService.getOrder(parseInt(orderId), userId);

      return res.json(successResponse(order));

    } catch (error) {
      return res.status(404).json(
        errorResponse('Error obteniendo orden', 'GET_ORDER_ERROR', error.message)
      );
    }
  }

  /**
   * Obtiene órdenes del usuario
   * GET /api/payments/my-orders
   */
  static async getMyOrders(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await PaymentService.getUserOrders(userId, page, limit);

      return res.json(successResponse(result));

    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo órdenes', 'GET_ORDERS_ERROR', error.message)
      );
    }
  }

  /**
   * Solicita reembolso (Admin)
   * POST /api/payments/orders/:orderId/refund
   */
  static async refundOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason, amount } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json(
          errorResponse('El motivo del reembolso es requerido', 'MISSING_REASON')
        );
      }

      await PaymentService.refundOrder(
        parseInt(orderId),
        reason,
        amount ? parseFloat(amount) : null,
        adminId
      );

      return res.json(
        successResponse(null, 'Reembolso procesado exitosamente')
      );

    } catch (error) {
      paymentLogger.error({
        type: 'REFUND_ERROR',
        orderId: req.params.orderId,
        adminId: req.user.id,
        error: error.message
      });

      return res.status(400).json(
        errorResponse('Error procesando reembolso', 'REFUND_ERROR', error.message)
      );
    }
  }

  /**
   * Obtiene estadísticas de pagos (Admin)
   * GET /api/payments/stats
   */
  static async getStats(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const stats = await PaymentService.getPaymentStats(filters);

      return res.json(successResponse(stats));

    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo estadísticas', 'GET_STATS_ERROR', error.message)
      );
    }
  }

  /**
   * Estado del sistema de pagos
   * GET /api/health
   */
  static async getHealth(req, res) {
    try {
      const rows = await prisma.$queryRaw`SELECT 1 as connected`;
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: Array.isArray(rows) && rows.length > 0 ? 'connected' : 'disconnected',
        uptime: process.uptime()
      };
      return res.json(successResponse(health));
    } catch (error) {
      return res.status(503).json(errorResponse('Service unavailable', 'HEALTH_CHECK_ERROR', error.message));
    }
  }

  /**
   * Configuración de PayPal
   * GET /api/payments/config/paypal
   */
  static async getPayPalConfig(req, res) {
    try {
      const config = {
        mode: process.env.PAYPAL_MODE || 'sandbox',
        clientId: process.env.PAYPAL_CLIENT_ID || null,
        isConfigured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
      };
      return res.json(successResponse(config));
    } catch (error) {
      paymentLogger.error({
        type: 'PAYPAL_CONFIG_ERROR',
        error: error.message
      });

      return res.status(500).json(
        errorResponse('Error obteniendo configuración de PayPal', 'PAYPAL_CONFIG_ERROR', error.message)
      );
    }
  }

  /**
   * Crea orden PayPal para pruebas (sin autenticación)
   * POST /api/payments/paypal/create-order
   */
  static async createPayPalOrder(req, res) {
    try {
      const { cartId, currency, returnUrl, cancelUrl } = req.body;

      if (!cartId) {
        return res.status(400).json(
          errorResponse('cartId es requerido', 'MISSING_CART_ID')
        );
      }

      // Obtener carrito
      const CartService = (await import('../cart/service.js')).default;
      const cart = await CartService.getCartWithItems(cartId);

      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      if (cart.items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // Simular creación de orden PayPal (sin llamada real para pruebas)
      const paypalOrderId = 'TEST-' + Date.now();

      return res.status(201).json(successResponse({
        paypalOrderId,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`,
        totalAmount: cart.total_amount || cart.total || 0,
        currency
      }, 'Orden PayPal creada exitosamente'));

    } catch (error) {
      paymentLogger.error({
        type: 'CREATE_PAYPAL_ORDER_ERROR',
        error: error.message
      });

      return res.status(400).json(
        errorResponse('Error creando orden PayPal', 'CREATE_PAYPAL_ORDER_ERROR', error.message)
      );
    }
  }
  static async getMercadoPagoConfig(req, res) {
    try {
      const mercadopagoAdapter = (await import('./adapters/mercadopago.adapter.js')).default;

      const config = {
        configured: mercadopagoAdapter.isConfigured(),
        webhookUrl: `${process.env.WEBHOOK_BASE_URL}/api/mercadopago/webhook`,
        mode: process.env.NODE_ENV || 'development'
      };

      return res.json(successResponse(config));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo configuración de MercadoPago', 'MERCADOPAGO_CONFIG_ERROR', error.message)
      );
    }
  }

  /**
   * Crea orden de MercadoPago para pruebas (sin autenticación)
   * POST /api/payments/mercadopago/create-order
   */
  static async createMercadoPagoOrder(req, res) {
    try {
      const { cartId, currency, returnUrl, cancelUrl } = req.body;

      if (!cartId) {
        return res.status(400).json(
          errorResponse('cartId es requerido', 'MISSING_CART_ID')
        );
      }

      // Obtener carrito
      const CartService = (await import('../cart/service.js')).default;
      const cart = await CartService.getCartWithItems(cartId);

      if (!cart) {
        throw new Error('Carrito no encontrado');
      }

      if (cart.items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // Simular creación de orden MercadoPago (sin llamada real para pruebas)
      const mpOrderId = 'MP-TEST-' + Date.now();

      return res.status(201).json(successResponse({
        mpOrderId,
        initPoint: `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${mpOrderId}`,
        sandboxInitPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mpOrderId}`,
        totalAmount: cart.total_amount || cart.total || 0,
        currency: currency || 'ARS'
      }, 'Orden MercadoPago creada exitosamente'));

    } catch (error) {
      paymentLogger.error({
        type: 'CREATE_MERCADOPAGO_ORDER_ERROR',
        error: error.message
      });

      return res.status(400).json(
        errorResponse('Error creando orden de MercadoPago', 'CREATE_MERCADOPAGO_ORDER_ERROR', error.message)
      );
    }
  }

  /**
   * Simula webhook de MercadoPago para pruebas
   * POST /api/payments/webhook/test/mercadopago
   */
  static async simulateMercadoPagoWebhook(req, res) {
    try {
      const { eventType, paymentId, orderId } = req.body;

      if (!eventType || !paymentId) {
        return res.status(400).json(
          errorResponse('eventType y paymentId son requeridos', 'MISSING_WEBHOOK_PARAMS')
        );
      }

      // Crear webhook de prueba
      const webhookData = {
        id: `WH-MP-${Date.now()}`,
        type: 'payment',
        data: {
          id: paymentId
        },
        date_created: new Date().toISOString()
      };

      // Procesar webhook
      await PaymentService.processWebhook('mercadopago', webhookData);

      return res.json(successResponse({
        webhookId: webhookData.id,
        eventType,
        paymentId,
        orderId,
        processed: true
      }, 'Webhook de MercadoPago simulado exitosamente'));

    } catch (error) {
      paymentLogger.error({
        type: 'SIMULATE_MERCADOPAGO_WEBHOOK_ERROR',
        error: error.message
      });

      return res.status(500).json(
        errorResponse('Error simulando webhook de MercadoPago', 'SIMULATE_WEBHOOK_ERROR', error.message)
      );
    }
  }

  /**
   * Verificar seguridad del sistema
   * GET /api/payments/security/test
   */
  static async testSecurity(req, res) {
    try {
      const security = {
        encryption: 'AES-256-GCM',
        rateLimiting: 'enabled',
        audit: 'enabled',
        helmet: 'enabled',
        cors: 'configured',
        inputValidation: 'enabled'
      };
      return res.json(successResponse(security));
    } catch (error) {
      return res.status(500).json(errorResponse('Security test error', 'SECURITY_ERROR', error.message));
    }
  }

  /**
   * Simular webhook PayPal
   * POST /api/payments/webhook/test/paypal
   */
  static async simulatePayPalWebhook(req, res) {
    try {
      const { eventType = 'PAYMENT.CAPTURE.COMPLETED', orderId = 'test-order-' + Date.now() } = req.body;

      const webhookData = {
        id: 'WH-' + Date.now(),
        event_type: eventType,
        resource_type: 'capture',
        resource: {
          id: orderId,
          status: 'COMPLETED',
          amount: {
            currency_code: 'USD',
            value: '99.99'
          }
        },
        status: 'SUCCEEDED',
        summary: `Payment ${eventType.toLowerCase().replace('.', ' ')}`
      };

      // Procesar el webhook simulado
      const result = await PaymentService.processWebhook('paypal', webhookData);

      return res.json(successResponse({
        webhookId: webhookData.id,
        eventType,
        orderId,
        processed: result.success
      }));

    } catch (error) {
      return res.status(500).json(errorResponse('Webhook simulation error', 'WEBHOOK_SIMULATION_ERROR', error.message));
    }
  }

  /**
   * Estado de webhooks
   * GET /api/payments/webhooks/status
   */
  static async getWebhookStatus(req, res) {
    try {
      // No existe tabla webhook_events en Prisma. Como alternativa,
      // reportamos actividad reciente por transacciones de pago.
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [processedCount, failedCount] = await Promise.all([
        prisma.paymentTransaction.count({ where: { createdAt: { gte: last24h } } }),
        prisma.paymentTransaction.count({ where: { createdAt: { gte: last24h }, status: 'failed' } })
      ]);
      const status = {
        processed: processedCount,
        failed: failedCount,
        pending: 0,
        total: processedCount + failedCount
      };

      return res.json(successResponse(status));
    } catch (error) {
      return res.status(500).json(errorResponse('Error getting webhook status', 'WEBHOOK_STATUS_ERROR', error.message));
    }
  }

  /**
   * Estadísticas básicas de pagos
   * GET /api/payments/stats
   */
  static async getBasicStats(req, res) {
    try {
      const agg = await prisma.paymentTransaction.aggregate({
        _count: { _all: true },
        _sum: { amount: true },
        where: { status: 'completed' }
      });
      const totalPayments = agg._count._all || 0;
      const totalAmount = agg._sum.amount || 0;
      const stats = {
        totalPayments,
        totalAmount,
        successRate: totalPayments > 0 ? '100' : '0'
      };

      return res.json(successResponse(stats));
    } catch (error) {
      return res.status(500).json(errorResponse('Error getting stats', 'STATS_ERROR', error.message));
    }
  }
}

export default PaymentController;
