import { Resend } from 'resend';
import logger from '../../config/logger.config.js';
import { formatCurrency } from '../../utils/helpers.js';

const resend = new Resend(process.env.MAIL_API_KEY);

class EmailService {
  /**
   * Envía email de confirmación de orden
   */
  static async sendOrderConfirmation(orderData) {
    try {
      const { order, customer, items } = orderData;

      const itemsList = items.map(item => 
        `<li>${item.item_name} x${item.quantity} - ${formatCurrency(item.total, order.currency)}</li>`
      ).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .total { font-size: 1.2em; font-weight: bold; color: #4F46E5; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
            ul { padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Gracias por tu compra!</h1>
            </div>
            <div class="content">
              <p>Hola ${customer.name},</p>
              <p>Hemos recibido tu orden correctamente. A continuación encontrarás los detalles:</p>
              
              <div class="order-details">
                <h2>Orden #${order.order_number}</h2>
                <p><strong>Fecha:</strong> ${new Date(order.fecha_alta).toLocaleDateString('es-AR')}</p>
                <p><strong>Estado:</strong> ${this.getStatusText(order.status)}</p>
                
                <h3>Productos:</h3>
                <ul>${itemsList}</ul>
                
                <hr>
                <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal, order.currency)}</p>
                <p><strong>Impuestos (${order.tax_rate}%):</strong> ${formatCurrency(order.tax_amount, order.currency)}</p>
                ${order.discount_amount > 0 ? `<p><strong>Descuento:</strong> -${formatCurrency(order.discount_amount, order.currency)}</p>` : ''}
                <p class="total"><strong>Total:</strong> ${formatCurrency(order.total_amount, order.currency)}</p>
              </div>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              
              <div class="footer">
                <p>UplinHR - Soluciones de RRHH</p>
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: customer.email,
        subject: `Confirmación de Orden #${order.order_number} - UplinHR`,
        html
      });

      logger.info({
        type: 'EMAIL_SENT',
        emailType: 'order_confirmation',
        orderId: order.id,
        to: customer.email
      });

      return true;

    } catch (error) {
      logger.error({
        type: 'EMAIL_ERROR',
        emailType: 'order_confirmation',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Envía email de pago completado
   */
  static async sendPaymentCompleted(orderData) {
    try {
      const { order, customer } = orderData;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-icon { font-size: 3em; }
            .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✓</div>
              <h1>¡Pago Confirmado!</h1>
            </div>
            <div class="content">
              <p>Hola ${customer.name},</p>
              <p>Tu pago ha sido procesado exitosamente.</p>
              
              <div class="order-info">
                <h2>Detalles del Pago</h2>
                <p><strong>Orden:</strong> #${order.order_number}</p>
                <p><strong>Monto:</strong> ${formatCurrency(order.total_amount, order.currency)}</p>
                <p><strong>Método de pago:</strong> ${this.getGatewayName(order.payment_gateway)}</p>
                <p><strong>Fecha:</strong> ${new Date(order.paid_at).toLocaleDateString('es-AR')}</p>
              </div>
              
              <p>Tus servicios han sido activados y puedes comenzar a utilizarlos de inmediato.</p>
              <p>Puedes ver el detalle de tu orden en tu panel de usuario.</p>
              
              <div class="footer">
                <p>UplinHR - Soluciones de RRHH</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: customer.email,
        subject: `Pago Confirmado - Orden #${order.order_number}`,
        html
      });

      logger.info({
        type: 'EMAIL_SENT',
        emailType: 'payment_completed',
        orderId: order.id,
        to: customer.email
      });

      return true;

    } catch (error) {
      logger.error({
        type: 'EMAIL_ERROR',
        emailType: 'payment_completed',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Envía email de pago fallido
   */
  static async sendPaymentFailed(orderData) {
    try {
      const { order, customer, reason } = orderData;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .retry-button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pago No Procesado</h1>
            </div>
            <div class="content">
              <p>Hola ${customer.name},</p>
              <p>Lamentablemente tu pago no pudo ser procesado.</p>
              
              <p><strong>Orden:</strong> #${order.order_number}</p>
              <p><strong>Monto:</strong> ${formatCurrency(order.total_amount, order.currency)}</p>
              ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ''}
              
              <p>Por favor, intenta nuevamente o utiliza otro método de pago.</p>
              
              <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="retry-button">Reintentar Pago</a>
              
              <div class="footer">
                <p>UplinHR - Soluciones de RRHH</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: customer.email,
        subject: `Problema con tu Pago - Orden #${order.order_number}`,
        html
      });

      logger.info({
        type: 'EMAIL_SENT',
        emailType: 'payment_failed',
        orderId: order.id,
        to: customer.email
      });

      return true;

    } catch (error) {
      logger.error({
        type: 'EMAIL_ERROR',
        emailType: 'payment_failed',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Envía email de reembolso procesado
   */
  static async sendRefundProcessed(orderData) {
    try {
      const { order, customer, refundAmount, reason } = orderData;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reembolso Procesado</h1>
            </div>
            <div class="content">
              <p>Hola ${customer.name},</p>
              <p>Tu reembolso ha sido procesado exitosamente.</p>
              
              <p><strong>Orden:</strong> #${order.order_number}</p>
              <p><strong>Monto reembolsado:</strong> ${formatCurrency(refundAmount || order.total_amount, order.currency)}</p>
              ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
              
              <p>El reembolso será acreditado en tu método de pago original en los próximos 5-10 días hábiles.</p>
              
              <div class="footer">
                <p>UplinHR - Soluciones de RRHH</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: customer.email,
        subject: `Reembolso Procesado - Orden #${order.order_number}`,
        html
      });

      logger.info({
        type: 'EMAIL_SENT',
        emailType: 'refund_processed',
        orderId: order.id,
        to: customer.email
      });

      return true;

    } catch (error) {
      logger.error({
        type: 'EMAIL_ERROR',
        emailType: 'refund_processed',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Helpers
   */
  static getStatusText(status) {
    const statusMap = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'completed': 'Completado',
      'failed': 'Fallido',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };
    return statusMap[status] || status;
  }

  static getGatewayName(gateway) {
    const gatewayMap = {
      'mercadopago': 'MercadoPago',
      'paypal': 'PayPal',
      'payoneer': 'Payoneer'
    };
    return gatewayMap[gateway] || gateway;
  }
}

export default EmailService;
