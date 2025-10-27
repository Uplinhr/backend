import dotenv from 'dotenv';
dotenv.config();

export default {
  // MercadoPago Configuration
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    webhookUrl: `${process.env.WEBHOOK_BASE_URL}/mercadopago`,
  },

  // PayPal Configuration
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
    webhookUrl: `${process.env.WEBHOOK_BASE_URL}/paypal`,
  },

  // Payoneer Configuration
  payoneer: {
    clientId: process.env.PAYONEER_CLIENT_ID,
    clientSecret: process.env.PAYONEER_CLIENT_SECRET,
    apiUrl: process.env.PAYONEER_API_URL || 'https://api.payoneer.com',
    webhookUrl: `${process.env.WEBHOOK_BASE_URL}/payoneer`,
  },

  // Security Configuration
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    webhookSecret: process.env.WEBHOOK_SECRET,
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Tax Configuration
  tax: {
    defaultCountry: 'ARG',
    defaultRate: 21.00,
  },

  // Cart Configuration
  cart: {
    expirationHours: 24, // Carrito expira en 24 horas
    maxItems: 50, // Máximo de items por carrito
  },

  // Order Configuration
  order: {
    paymentExpirationHours: 48, // Link de pago expira en 48 horas
    orderNumberPrefix: 'ORD',
  },

  // Currency Configuration
  currency: {
    default: 'USD',
    supported: ['USD', 'ARS', 'EUR'],
  },
};
