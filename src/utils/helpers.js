import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un número de orden único
 * Formato: ORD-YYYY-NNNNN
 */
export function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${random}`;
}

/**
 * Genera un UUID para el carrito
 */
export function generateCartUUID() {
  return uuidv4();
}

/**
 * Genera un ID de transacción único
 */
export function generateTransactionId(gateway) {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${gateway.toUpperCase()}-${timestamp}-${random}`;
}

/**
 * Calcula el subtotal de items del carrito
 */
export function calculateSubtotal(items) {
  return items.reduce((total, item) => {
    const itemSubtotal = item.unit_price * item.quantity;
    const discount = itemSubtotal * (item.discount_percentage / 100);
    return total + (itemSubtotal - discount);
  }, 0);
}

/**
 * Calcula el monto de impuestos
 */
export function calculateTax(subtotal, taxRate) {
  return subtotal * (taxRate / 100);
}

/**
 * Calcula el total incluyendo impuestos y descuentos
 */
export function calculateTotal(subtotal, taxAmount, discountAmount = 0) {
  return subtotal + taxAmount - discountAmount;
}

/**
 * Calcula descuento basado en porcentaje
 */
export function calculateDiscount(amount, discountPercentage) {
  return amount * (discountPercentage / 100);
}

/**
 * Redondea a 2 decimales
 */
export function roundToTwoDecimals(amount) {
  return Math.round(amount * 100) / 100;
}

/**
 * Formatea monto a string con símbolo de moneda
 */
export function formatCurrency(amount, currency = 'USD') {
  const symbols = {
    USD: '$',
    ARS: 'ARS $',
    EUR: '€',
    BRL: 'R$',
    MXN: 'MX$',
    CLP: 'CL$'
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${roundToTwoDecimals(amount).toFixed(2)}`;
}

/**
 * Convierte timestamp a fecha ISO
 */
export function toISODate(timestamp) {
  return new Date(timestamp).toISOString();
}

/**
 * Calcula fecha de expiración
 */
export function calculateExpirationDate(hours) {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Verifica si una fecha ha expirado
 */
export function isExpired(expirationDate) {
  return new Date() > new Date(expirationDate);
}

/**
 * Obtiene el país desde la IP (simplificado)
 * En producción, usar un servicio como ipapi.co o MaxMind
 */
export function getCountryFromIP(ip) {
  // Por defecto, retornar Argentina
  // En producción, implementar lookup real
  return 'ARG';
}

/**
 * Sanitiza datos de respuesta de API (elimina datos sensibles)
 */
export function sanitizeResponse(data, sensitiveFields = ['password', 'token', 'secret']) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Construye objeto de paginación
 */
export function buildPagination(page = 1, limit = 20, totalItems) {
  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(limit);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    current_page: currentPage,
    items_per_page: itemsPerPage,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: currentPage < totalPages,
    has_previous: currentPage > 1,
  };
}

/**
 * Valida y limpia parámetros de paginación
 */
export function validatePaginationParams(page, limit, maxLimit = 100) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));

  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit,
  };
}

/**
 * Construye respuesta de éxito estandarizada
 */
export function successResponse(data, message = 'Success', meta = {}) {
  return {
    success: true,
    message,
    data,
    ...meta,
  };
}

/**
 * Construye respuesta de error estandarizada
 */
export function errorResponse(message, code = 'ERROR', details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Extrae información del user agent
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown' };
  }

  // Detección básica (en producción usar librería como 'ua-parser-js')
  const browser = userAgent.match(/(chrome|safari|firefox|edge|opera)/i)?.[1] || 'Unknown';
  const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[1] || 'Unknown';

  return { browser, os };
}

/**
 * Genera descripción para transacción
 */
export function generateTransactionDescription(items) {
  if (!items || items.length === 0) {
    return 'Compra en UplinHR';
  }

  const itemNames = items.map(item => item.item_name).slice(0, 3);
  const description = itemNames.join(', ');

  if (items.length > 3) {
    return `${description} y ${items.length - 3} más`;
  }

  return description;
}
