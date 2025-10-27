import pkg from 'mercadopago';
const { MercadoPagoConfig, Payment, Preference, PaymentRefund } = pkg;
import paymentConfig from '../../../config/payment.config.js';
import logger, { paymentLogger } from '../../../config/logger.config.js';
import { generateTransactionId } from '../../../utils/helpers.js';

class MercadoPagoAdapter {
  constructor() {
    this.client = null;
    if (paymentConfig.mercadopago.accessToken) {
      this.client = new MercadoPagoConfig({
        accessToken: paymentConfig.mercadopago.accessToken
      });
    }
  }

  /**
   * Crea preferencia de pago en MercadoPago
   */
  async createPayment(orderData) {
    try {
      if (!this.client) {
        throw new Error('MercadoPago no está configurado');
      }

      const preference = new Preference(this.client);

      const preferenceData = {
        items: orderData.items.map(item => ({
          title: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          currency_id: orderData.currency || 'ARS'
        })),

        payer: {
          name: orderData.customer_name,
          email: orderData.customer_email,
          ...(orderData.billing_address && {
            address: {
              zip_code: orderData.billing_address.postal_code || '',
              street_name: orderData.billing_address.street || '',
              street_number: orderData.billing_address.number || ''
            }
          })
        },

        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`
        },

        auto_return: 'approved',

        external_reference: orderData.order_number,

        notification_url: paymentConfig.mercadopago.webhookUrl,

        statement_descriptor: 'UPLINHR',

        metadata: {
          order_id: orderData.order_id,
          user_id: orderData.user_id
        }
      };

      const response = await preference.create({ body: preferenceData });

      paymentLogger.info({
        type: 'MERCADOPAGO_PAYMENT_CREATED',
        orderId: orderData.order_id,
        preferenceId: response.id
      });

      return {
        success: true,
        payment_id: response.id,
        payment_url: response.init_point,
        sandbox_url: response.sandbox_init_point,
        external_reference: response.external_reference,
        expires_at: null // MercadoPago no tiene expiración por defecto
      };

    } catch (error) {
      paymentLogger.error({
        type: 'MERCADOPAGO_PAYMENT_ERROR',
        orderId: orderData.order_id,
        error: error.message
      });

      throw new Error(`Error creando pago en MercadoPago: ${error.message}`);
    }
  }

  /**
   * Obtiene información de un pago
   */
  async getPayment(paymentId) {
    try {
      if (!this.client) {
        throw new Error('MercadoPago no está configurado');
      }

      const payment = new Payment(this.client);
      const response = await payment.get({ id: paymentId });

      return {
        id: response.id,
        status: this.mapStatus(response.status),
        status_detail: response.status_detail,
        amount: response.transaction_amount,
        currency: response.currency_id,
        payment_method: response.payment_method_id,
        payment_type: response.payment_type_id,
        external_reference: response.external_reference,
        payer: response.payer,
        date_created: response.date_created,
        date_approved: response.date_approved,
        raw_response: response
      };

    } catch (error) {
      paymentLogger.error({
        type: 'MERCADOPAGO_GET_PAYMENT_ERROR',
        paymentId,
        error: error.message
      });

      throw new Error(`Error obteniendo pago de MercadoPago: ${error.message}`);
    }
  }

  /**
   * Procesa webhook de MercadoPago
   */
  async processWebhook(webhookData) {
    try {
      const { type, data } = webhookData;

      if (type === 'payment') {
        const paymentInfo = await this.getPayment(data.id);
        
        paymentLogger.info({
          type: 'MERCADOPAGO_WEBHOOK_PROCESSED',
          paymentId: data.id,
          status: paymentInfo.status
        });

        return {
          event_type: 'payment.updated',
          payment_id: data.id,
          external_reference: paymentInfo.external_reference,
          status: paymentInfo.status,
          amount: paymentInfo.amount,
          currency: paymentInfo.currency,
          payment_data: paymentInfo
        };
      }

      return null;

    } catch (error) {
      paymentLogger.error({
        type: 'MERCADOPAGO_WEBHOOK_ERROR',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Realiza reembolso
   */
  async refundPayment(paymentId, amount = null) {
    try {
      if (!this.client) {
        throw new Error('MercadoPago no está configurado');
      }

      const refund = new PaymentRefund(this.client);
      const refundData = amount ? { amount } : {};

      const response = await refund.create({
        payment_id: paymentId,
        body: refundData
      });

      paymentLogger.info({
        type: 'MERCADOPAGO_REFUND_CREATED',
        paymentId,
        refundId: response.id,
        amount: response.amount
      });

      return {
        success: true,
        refund_id: response.id,
        status: response.status,
        amount: response.amount
      };

    } catch (error) {
      paymentLogger.error({
        type: 'MERCADOPAGO_REFUND_ERROR',
        paymentId,
        error: error.message
      });

      throw new Error(`Error procesando reembolso: ${error.message}`);
    }
  }

  /**
   * Mapea estados de MercadoPago a estados internos
   */
  mapStatus(mpStatus) {
    const statusMap = {
      'pending': 'pending',
      'approved': 'completed',
      'authorized': 'authorized',
      'in_process': 'processing',
      'in_mediation': 'processing',
      'rejected': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'chargeback'
    };

    return statusMap[mpStatus] || 'pending';
  }

  /**
   * Valida configuración
   */
  isConfigured() {
    return !!paymentConfig.mercadopago.accessToken;
  }
}

export default new MercadoPagoAdapter();
