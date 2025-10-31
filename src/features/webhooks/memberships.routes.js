import express from 'express';
import { mpMembershipsWebhook, paypalMembershipsWebhook } from './memberships.controller.js';

const router = express.Router();

// MercadoPago webhook for memberships auto-debit
router.post('/mercadopago', express.json({ type: '*/*' }), mpMembershipsWebhook);

// PayPal webhook for memberships auto-debit
router.post('/paypal', express.json({ type: '*/*' }), paypalMembershipsWebhook);

export default router;
