import mercadopagoAdapter from './mercadopago.adapter.js';
import paypalAdapter from './paypal.adapter.js';
import payoneerAdapter from './payoneer.adapter.js';

/**
 * Factory de adaptadores de pasarelas de pago
 */
class PaymentGatewayFactory {
  /**
   * Obtiene adaptador según la pasarela
   */
  static getAdapter(gateway) {
    const adapters = {
      mercadopago: mercadopagoAdapter,
      paypal: paypalAdapter,
      payoneer: payoneerAdapter
    };

    const adapter = adapters[gateway];

    if (!adapter) {
      throw new Error(`Pasarela de pago no soportada: ${gateway}`);
    }

    if (!adapter.isConfigured()) {
      throw new Error(`Pasarela ${gateway} no está configurada correctamente`);
    }

    return adapter;
  }

  /**
   * Obtiene todas las pasarelas disponibles
   */
  static getAvailableGateways() {
    const gateways = [];

    if (mercadopagoAdapter.isConfigured()) {
      gateways.push({
        id: 'mercadopago',
        name: 'MercadoPago',
        description: 'Acepta pagos con tarjeta, efectivo y más',
        countries: ['ARG', 'BRA', 'CHL', 'MEX', 'COL', 'PER', 'URY'],
        currencies: ['ARS', 'BRL', 'CLP', 'MXN', 'COP', 'PEN', 'UYU', 'USD']
      });
    }

    if (paypalAdapter.isConfigured()) {
      gateways.push({
        id: 'paypal',
        name: 'PayPal',
        description: 'Paga con PayPal o tarjeta de crédito',
        countries: ['*'], // Disponible globalmente
        currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
      });
    }

    if (payoneerAdapter.isConfigured()) {
      gateways.push({
        id: 'payoneer',
        name: 'Payoneer',
        description: 'Pagos internacionales para empresas',
        countries: ['*'], // Disponible globalmente
        currencies: ['USD', 'EUR', 'GBP']
      });
    }

    return gateways;
  }

  /**
   * Valida si una pasarela está disponible
   */
  static isGatewayAvailable(gateway) {
    try {
      const adapter = this.getAdapter(gateway);
      return adapter.isConfigured();
    } catch (error) {
      return false;
    }
  }
}

export default PaymentGatewayFactory;
export { mercadopagoAdapter, paypalAdapter, payoneerAdapter };
