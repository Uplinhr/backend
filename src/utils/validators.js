import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware para validar resultados de express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validaciones para carrito de compras
 */
export const cartValidators = {
  addItem: [
    body('item_type')
      .isIn(['membership', 'talent_search', 'consultancy', 'people_partner', 'credits'])
      .withMessage('Tipo de item inválido'),
    body('item_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID de item debe ser un número positivo'),
    body('quantity')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Cantidad debe estar entre 1 y 100'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata debe ser un objeto'),
    validate
  ],

  updateItem: [
    param('itemId')
      .isInt({ min: 1 })
      .withMessage('ID de item inválido'),
    body('quantity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Cantidad debe estar entre 1 y 100'),
    validate
  ],

  removeItem: [
    param('itemId')
      .isInt({ min: 1 })
      .withMessage('ID de item inválido'),
    validate
  ],

  applyDiscount: [
    body('discount_code')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Código de descuento requerido'),
    validate
  ]
};

/**
 * Validaciones para órdenes de pago
 */
export const orderValidators = {
  create: [
    body('payment_gateway')
      .isIn(['mercadopago', 'paypal', 'payoneer'])
      .withMessage('Pasarela de pago inválida'),
    body('country_code')
      .optional()
      .isLength({ min: 3, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Código de país debe ser ISO 3166-1 alpha-3'),
    body('customer_email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('customer_name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Nombre del cliente requerido'),
    body('billing_address')
      .optional()
      .isObject()
      .withMessage('Dirección de facturación debe ser un objeto'),
    validate
  ],

  updateStatus: [
    param('orderId')
      .isInt({ min: 1 })
      .withMessage('ID de orden inválido'),
    body('status')
      .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
      .withMessage('Estado inválido'),
    validate
  ],

  refund: [
    param('orderId')
      .isInt({ min: 1 })
      .withMessage('ID de orden inválido'),
    body('reason')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Motivo de reembolso requerido'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Monto debe ser mayor a 0'),
    validate
  ]
};

/**
 * Validaciones para webhooks
 */
export const webhookValidators = {
  mercadopago: [
    body('id')
      .optional()
      .isString()
      .withMessage('ID inválido'),
    body('type')
      .optional()
      .isString()
      .withMessage('Tipo de evento inválido'),
    validate
  ],

  paypal: [
    body('event_type')
      .isString()
      .withMessage('Tipo de evento requerido'),
    body('resource')
      .isObject()
      .withMessage('Recurso inválido'),
    validate
  ],

  payoneer: [
    body('event_type')
      .isString()
      .withMessage('Tipo de evento requerido'),
    validate
  ]
};

/**
 * Validación de UUID
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validación de email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validación de número de tarjeta (Luhn algorithm)
 */
export function isValidCardNumber(cardNumber) {
  if (!/^\d+$/.test(cardNumber)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validación de moneda
 */
export function isValidCurrency(currency) {
  const validCurrencies = ['USD', 'ARS', 'EUR', 'BRL', 'MXN', 'CLP'];
  return validCurrencies.includes(currency);
}

/**
 * Sanitiza input para prevenir XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Valida monto de pago
 */
export function isValidAmount(amount, min = 0.01, max = 1000000) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount >= min && numAmount <= max;
}
