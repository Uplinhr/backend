import paypalSDK from '@paypal/checkout-server-sdk';
import paymentConfig from '../../../config/payment.config.js';
import logger, { paymentLogger } from '../../../config/logger.config.js';

class PayPalAdapter {
  constructor() {
    this.client = this.createClient();
  }

  /**
   * Crea cliente de PayPal
   */
  createClient() {
    const clientId = paymentConfig.paypal.clientId;
    const clientSecret = paymentConfig.paypal.clientSecret;
    
    if (!clientId || !clientSecret) {
      return null;
    }

    const environment = paymentConfig.paypal.mode === 'live'
      ? new paypalSDK.core.LiveEnvironment(clientId, clientSecret)
      : new paypalSDK.core.SandboxEnvironment(clientId, clientSecret);

    return new paypalSDK.core.PayPalHttpClient(environment);
  }

  /**
   * Crea orden de pago en PayPal
   */
  async createPayment(orderData) {
    try {
      if (!this.client) {
        throw new Error('PayPal no está configurado');
      }

      const request = new paypalSDK.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      
      request.requestBody({
        intent: 'CAPTURE',
        
        purchase_units: [{
          reference_id: orderData.order_number,
          description: `Orden ${orderData.order_number}`,
          custom_id: orderData.order_id.toString(),
          
          amount: {
            currency_code: orderData.currency || 'USD',
            value: orderData.total_amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: orderData.currency || 'USD',
                value: orderData.subtotal.toFixed(2)
              },
              tax_total: {
                currency_code: orderData.currency || 'USD',
                value: orderData.tax_amount.toFixed(2)
              },
              ...(orderData.discount_amount > 0 && {
                discount: {
                  currency_code: orderData.currency || 'USD',
                  value: orderData.discount_amount.toFixed(2)
                }
              })
            }
          },

          items: orderData.items.map(item => ({
            name: item.name,
            description: item.description || '',
            unit_amount: {
              currency_code: orderData.currency || 'USD',
              value: item.unit_price.toFixed(2)
            },
            quantity: item.quantity.toString(),
            category: 'DIGITAL_GOODS'
          }))
        }],

        application_context: {
          brand_name: 'UplinHR',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        }
      });

      const response = await this.client.execute(request);

      const approveLink = response.result.links.find(
        link => link.rel === 'approve'
      );

      paymentLogger.info({
        type: 'PAYPAL_PAYMENT_CREATED',
        orderId: orderData.order_id,
        paypalOrderId: response.result.id
      });

      return {
        success: true,
        payment_id: response.result.id,
        payment_url: approveLink?.href,
        external_reference: orderData.order_number,
        expires_at: null,
        status: response.result.status
      };

    } catch (error) {
      paymentLogger.error({
        type: 'PAYPAL_PAYMENT_ERROR',
        orderId: orderData.order_id,
        error: error.message
      });

      throw new Error(`Error creando pago en PayPal: ${error.message}`);
    }
  }

  /**
   * Captura un pago autorizado
   */
  async capturePayment(paypalOrderId) {
    try {
      const request = new paypalSDK.orders.OrdersCaptureRequest(paypalOrderId);
      request.requestBody({});

      const response = await this.client.execute(request);

      paymentLogger.info({
        type: 'PAYPAL_PAYMENT_CAPTURED',
        paypalOrderId,
        status: response.result.status
      });

      return {
        success: true,
        order_id: response.result.id,
        status: this.mapStatus(response.result.status),
        capture_id: response.result.purchase_units[0]?.payments?.captures[0]?.id,
        amount: response.result.purchase_units[0]?.payments?.captures[0]?.amount,
        raw_response: response.result
      };

    } catch (error) {
      paymentLogger.error({
        type: 'PAYPAL_CAPTURE_ERROR',
        paypalOrderId,
        error: error.message
      });

      throw new Error(`Error capturando pago: ${error.message}`);
    }
  }

  /**
   * Obtiene detalles de una orden
   */
  async getPayment(paypalOrderId) {
    try {
      const request = new paypalSDK.orders.OrdersGetRequest(paypalOrderId);
      const response = await this.client.execute(request);

      return {
        id: response.result.id,
        status: this.mapStatus(response.result.status),
        amount: response.result.purchase_units[0]?.amount?.value,
        currency: response.result.purchase_units[0]?.amount?.currency_code,
        payer: response.result.payer,
        create_time: response.result.create_time,
        update_time: response.result.update_time,
        raw_response: response.result
      };

    } catch (error) {
      paymentLogger.error({
        type: 'PAYPAL_GET_PAYMENT_ERROR',
        paypalOrderId,
        error: error.message
      });

      throw new Error(`Error obteniendo pago: ${error.message}`);
    }
  }

  /**
   * Procesa webhook de PayPal
   */
  async processWebhook(webhookData) {
    try {
      const { event_type, resource } = webhookData;

      paymentLogger.info({
        type: 'PAYPAL_WEBHOOK_RECEIVED',
        eventType: event_type,
        resourceId: resource.id
      });

      return {
        event_type,
        payment_id: resource.id,
        status: this.mapStatus(resource.status),
        amount: resource.amount?.value,
        currency: resource.amount?.currency_code,
        payment_data: resource
      };

    } catch (error) {
      paymentLogger.error({
        type: 'PAYPAL_WEBHOOK_ERROR',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Realiza reembolso
   */
  async refundPayment(captureId, amount = null) {
    try {
      const request = new paypalSDK.payments.CapturesRefundRequest(captureId);
      
      if (amount) {
        request.requestBody({
          amount: {
            value: amount.toFixed(2),
            currency_code: 'USD'
          }
        });
      }

      const response = await this.client.execute(request);

      paymentLogger.info({
        type: 'PAYPAL_REFUND_CREATED',
        captureId,
        refundId: response.result.id,
        status: response.result.status
      });

      return {
        success: true,
        refund_id: response.result.id,
        status: response.result.status,
        amount: response.result.amount?.value
      };

    } catch (error) {
      paymentLogger.error({
        type: 'PAYPAL_REFUND_ERROR',
        captureId,
        error: error.message
      });

      throw new Error(`Error procesando reembolso: ${error.message}`);
    }
  }

  /**
   * Mapea estados de PayPal a estados internos
   */
  mapStatus(paypalStatus) {
    const statusMap = {
      'CREATED': 'pending',
      'SAVED': 'pending',
      'APPROVED': 'authorized',
      'VOIDED': 'cancelled',
      'COMPLETED': 'completed',
      'PAYER_ACTION_REQUIRED': 'pending'
    };

    return statusMap[paypalStatus] || 'pending';
  }

  /**
   * Valida configuración
   */
  isConfigured() {
    return !!this.client;
  }
}

export default new PayPalAdapter();
