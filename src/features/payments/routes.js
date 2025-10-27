import { Router } from 'express';
import PaymentController from './payment.controller.js';
import WebhookController from './webhook.controller.js';
import { verifyToken } from '../../middlewares/auth.js';
import { requireAdmin, paymentRateLimiter, webhookRateLimiter } from '../../middlewares/security.middleware.js';
import { orderValidators } from '../../utils/validators.js';

const router = Router();

// Rutas de webhooks (públicas, sin autenticación)
router.post('/webhooks/mercadopago', webhookRateLimiter, WebhookController.mercadopagoWebhook);
router.post('/webhooks/paypal', webhookRateLimiter, WebhookController.paypalWebhook);
// router.post('/webhooks/payoneer', webhookRateLimiter, WebhookController.payoneerWebhook); // Deshabilitado - SDK no disponible

// Rutas públicas (con rate limiting de pago)
router.get('/gateways', PaymentController.getAvailableGateways);

// Nuevas rutas de prueba (públicas)
router.get('/health', PaymentController.getHealth);
router.get('/config/paypal', PaymentController.getPayPalConfig);
router.get('/config/mercadopago', PaymentController.getMercadoPagoConfig);
router.post('/paypal/create-order', paymentRateLimiter, PaymentController.createPayPalOrder);
router.post('/mercadopago/create-order', paymentRateLimiter, PaymentController.createMercadoPagoOrder);
router.get('/security/test', PaymentController.testSecurity);
router.post('/webhook/test/paypal', PaymentController.simulatePayPalWebhook);
router.post('/webhook/test/mercadopago', PaymentController.simulateMercadoPagoWebhook);
router.get('/webhooks/status', PaymentController.getWebhookStatus);
router.get('/stats', PaymentController.getBasicStats);

// Rutas protegidas (requieren autenticación)
router.post('/create-order', verifyToken, paymentRateLimiter, orderValidators.create, PaymentController.createOrder);
router.get('/orders/:orderId', verifyToken, PaymentController.getOrder);
router.get('/my-orders', verifyToken, PaymentController.getMyOrders);

// Rutas de administrador
router.post('/orders/:orderId/refund', verifyToken, requireAdmin, orderValidators.refund, PaymentController.refundOrder);
router.get('/stats', verifyToken, requireAdmin, PaymentController.getStats);

export default router;
