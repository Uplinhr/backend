import request from 'supertest';
let app;

beforeAll(async () => {
  ({ default: app } = await import('../src/app.js'));
});

afterAll(async () => {
  // Dar tiempo a que se drene el event loop
  await new Promise((r) => setTimeout(r, 0));
});

describe('Health Endpoints', () => {
  it('GET /api/health should return OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/payments/health should return DB connected', async () => {
    const res = await request(app).get('/api/payments/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('database', 'connected');
  });
});
