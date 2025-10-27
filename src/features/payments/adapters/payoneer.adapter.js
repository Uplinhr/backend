/**
 * ⚠️ ADVERTENCIA: Payoneer SDK no disponible en npm registry
 *
 * Este adaptador está DESHABILITADO porque 'payoneer-sdk' no existe como paquete oficial.
 *
 * Para habilitar la integración con Payoneer:
 * 1. Contactar a Payoneer para obtener su SDK oficial o documentación API
 * 2. Instalar el SDK oficial cuando esté disponible
 * 3. Implementar la integración según la documentación proporcionada
 *
 * Mientras tanto, el sistema funciona completamente con MercadoPago y PayPal.
 */

// Exportar objeto stub que NO lanza errores al importarse
const payoneerAdapter = {
  async createPayment() {
    throw new Error('Payoneer no disponible - SDK faltante');
  },

  async getPayment() {
    throw new Error('Payoneer no disponible - SDK faltante');
  },

  async processWebhook() {
    throw new Error('Payoneer no disponible - SDK faltante');
  },

  async refundPayment() {
    throw new Error('Payoneer no disponible - SDK faltante');
  },

  isConfigured() {
    // Siempre devuelve false para que no se use
    return false;
  },

  getImplementationNote() {
    return `
      INTEGRACIÓN PAYONEER PENDIENTE:

      Para completar la integración con Payoneer se necesita:

      1. SDK OFICIAL: Obtener el SDK oficial de Node.js de Payoneer
      2. DOCUMENTACIÓN: API docs específicas para el tipo de integración
      3. CREDENCIALES: Configuración específica según región/país
      4. WEBHOOKS: Formato y endpoints específicos de Payoneer

      Recursos recomendados:
      - https://developer.payoneer.com/
      - Soporte técnico de Payoneer para integración

      El sistema actualmente soporta completamente:
      ✅ MercadoPago (Argentina y Latinoamérica)
      ✅ PayPal (Internacional)
      ❌ Payoneer (pendiente de SDK oficial)
    `;
  }
};

// Exportar objeto stub sin instanciar clase
export default payoneerAdapter;
