import routes from './routes.js';

export const paymentsRoutes = routes;
export { default as PaymentService } from './payment.service.js';
export { default as PaymentController } from './payment.controller.js';
export { default as WebhookController } from './webhook.controller.js';
