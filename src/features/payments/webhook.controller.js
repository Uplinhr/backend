import PaymentService from './payment.service.js';
import { paymentLogger } from '../../config/logger.config.js';
import AuditModel from './models/audit.model.js';

class WebhookController {
  /**
   * Procesa webhook de MercadoPago
   * POST /api/webhooks/mercadopago
   */
  static async mercadopagoWebhook(req, res) {
    try {
      const webhookData = req.body;
      const headers = req.headers;

      // Registrar webhook recibido
      await this.logWebhook('mercadopago', webhookData, headers, req.ip);

      paymentLogger.info({
        type: 'MERCADOPAGO_WEBHOOK_RECEIVED',
        data: webhookData
      });

      // Procesar webhook
      await PaymentService.processWebhook('mercadopago', webhookData, headers);

      // MercadoPago espera respuesta 200 o 201
      return res.status(200).json({ received: true });

    } catch (error) {
      paymentLogger.error({
        type: 'MERCADOPAGO_WEBHOOK_ERROR',
        error: error.message,
        data: req.body
      });

      // Retornar 200 para evitar reintentos de MercadoPago
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * Procesa webhook de PayPal
   * POST /api/webhooks/paypal
   */
  static async paypalWebhook(req, res) {
    try {
      const webhookData = req.body;
      const headers = req.headers;

      // Registrar webhook recibido
      await this.logWebhook('paypal', webhookData, headers, req.ip);

      paymentLogger.info({
        type: 'PAYPAL_WEBHOOK_RECEIVED',
        eventType: webhookData.event_type
      });

      // Procesar webhook
      await PaymentService.processWebhook('paypal', webhookData, headers);

      // PayPal espera respuesta 200
      return res.status(200).json({ received: true });

    } catch (error) {
      paymentLogger.error({
        type: 'PAYPAL_WEBHOOK_ERROR',
        error: error.message,
        data: req.body
      });

      return res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * Procesa webhook de Payoneer
   * POST /api/webhooks/payoneer
   */
  static async payoneerWebhook(req, res) {
    try {
      const webhookData = req.body;
      const headers = req.headers;

      // Registrar webhook recibido
      await this.logWebhook('payoneer', webhookData, headers, req.ip);

      paymentLogger.info({
        type: 'PAYONEER_WEBHOOK_RECEIVED',
        data: webhookData
      });

      // Procesar webhook
      await PaymentService.processWebhook('payoneer', webhookData, headers);

      return res.status(200).json({ received: true });

    } catch (error) {
      paymentLogger.error({
        type: 'PAYONEER_WEBHOOK_ERROR',
        error: error.message,
        data: req.body
      });

      return res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * Registra webhook en la base de datos
   */
  static async logWebhook(gateway, payload, headers, ipAddress) {
    try {
      const eventId = payload.id || payload.event_id || `EVENT-${Date.now()}`;
      const eventType = payload.type || payload.event_type || 'unknown';
      await AuditModel.logEvent({
        id_order: null,
        id_transaction: null,
        id_usuario: null,
        event_type: `${gateway}_webhook_received`,
        event_description: `Webhook ${eventType} recibido (${eventId})`,
        performed_by_type: 'gateway',
        metadata: {
          eventId,
          gateway,
          headers,
          payload,
          ipAddress
        }
      });
    } catch (error) {
      paymentLogger.error({
        type: 'WEBHOOK_LOG_ERROR',
        gateway,
        error: error.message
      });
    }
  }
}

export default WebhookController;
