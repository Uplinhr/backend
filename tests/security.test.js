import request from 'supertest';
import app from '../src/app.js';

describe('Security Tests', () => {
  describe('Rate Limiting', () => {
    it('should enforce rate limiting on repeated requests', async () => {
      const requests = [];
      
      // Intentar hacer más de 100 requests en poco tiempo
      for (let i = 0; i < 110; i++) {
        requests.push(
          request(app).get('/api/health')
        );
      }

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);

      // Debería haber al menos algunos requests bloqueados
      expect(tooManyRequests.length).toBeGreaterThan(0);
    }, 30000); // Timeout extendido
  });

  describe('Security Headers', () => {
    it('should have security headers in response', async () => {
      const response = await request(app).get('/api/health');

      // Verificar headers de seguridad de Helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid cart item type', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send({
          item_type: 'invalid_type',
          item_id: 1
        });

      // Debería fallar por validación o autenticación
      expect([400, 401]).toContain(response.status);
    });

    it('should reject invalid tax calculation', async () => {
      const response = await request(app)
        .post('/api/taxes/calculate')
        .send({
          subtotal: -100, // Monto negativo inválido
          country_code: 'ARG'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('CORS', () => {
    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect([200, 204]).toContain(response.status);
    });
  });
});
