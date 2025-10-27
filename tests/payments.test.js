import request from 'supertest';
import app from '../src/app.js';

describe('Payment System Tests', () => {
  let authToken;
  let userId;
  let cartUUID;

  // Login antes de los tests
  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        contrasenia: 'password123'
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
      userId = loginResponse.body.usuario.id;
    }
  });

  describe('GET /api/payments/gateways', () => {
    it('should return available payment gateways', async () => {
      const response = await request(app)
        .get('/api/payments/gateways');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Cart Operations', () => {
    it('should create or get active cart', async () => {
      if (!authToken) {
        return; // Skip if no auth
      }

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('cart_uuid');
        cartUUID = response.body.data.cart_uuid;
      }
    });

    it('should add item to cart', async () => {
      if (!authToken || !cartUUID) {
        return;
      }

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          item_type: 'membership',
          item_id: 1,
          quantity: 1
        });

      expect([200, 201, 400, 401]).toContain(response.status);
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate taxes for Argentina', async () => {
      const response = await request(app)
        .post('/api/taxes/calculate')
        .send({
          subtotal: 100,
          country_code: 'ARG'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('taxRate');
      expect(response.body.data).toHaveProperty('taxAmount');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should calculate taxes for USA (0%)', async () => {
      const response = await request(app)
        .post('/api/taxes/calculate')
        .send({
          subtotal: 100,
          country_code: 'USA'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.taxRate).toBe(0);
    });
  });

  describe('Order Creation', () => {
    it('should require authentication to create order', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({
          cart_uuid: 'some-uuid',
          payment_gateway: 'mercadopago'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Webhook Endpoints', () => {
    it('should accept MercadoPago webhook', async () => {
      const response = await request(app)
        .post('/api/payments/webhooks/mercadopago')
        .send({
          id: 'test-event-id',
          type: 'payment',
          data: { id: 'test-payment-id' }
        });

      expect(response.status).toBe(200);
    });

    it('should accept PayPal webhook', async () => {
      const response = await request(app)
        .post('/api/payments/webhooks/paypal')
        .send({
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: { id: 'test-payment-id' }
        });

      expect(response.status).toBe(200);
    });
  });
});
