import request from 'supertest';
let app;

beforeAll(async () => {
  ({ default: app } = await import('../src/app.js'));
});

afterAll(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

describe('Payments Public Endpoints', () => {
  it('GET /api/payments/gateways returns available gateways', async () => {
    const res = await request(app).get('/api/payments/gateways');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/payments/config/paypal returns config object', async () => {
    const res = await request(app).get('/api/payments/config/paypal');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('mode');
    expect(res.body.data).toHaveProperty('clientId');
    expect(res.body.data).toHaveProperty('isConfigured');
  });

  it('POST /api/payments/webhook/test/paypal simulates webhook', async () => {
    const res = await request(app)
      .post('/api/payments/webhook/test/paypal')
      .send({ eventType: 'PAYMENT.CAPTURE.COMPLETED', orderId: 'test-order' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('processed');
  });

  it('GET /api/payments/webhooks/status returns status object', async () => {
    const res = await request(app).get('/api/payments/webhooks/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('total');
  });

  it('GET /api/payments/stats returns basic stats', async () => {
    const res = await request(app).get('/api/payments/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('totalPayments');
    expect(res.body.data).toHaveProperty('totalAmount');
  });
});
