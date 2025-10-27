import {
  generateOrderNumber,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  roundToTwoDecimals,
  formatCurrency,
  isExpired
} from '../src/utils/helpers.js';

describe('Helper Functions Tests', () => {
  describe('generateOrderNumber', () => {
    it('should generate valid order number format', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber).toMatch(/^ORD-\d{4}-\d{5}$/);
    });

    it('should generate unique order numbers', () => {
      const order1 = generateOrderNumber();
      const order2 = generateOrderNumber();
      expect(order1).not.toBe(order2);
    });
  });

  describe('calculateTax', () => {
    it('should calculate 21% tax correctly', () => {
      const tax = calculateTax(100, 21);
      expect(tax).toBe(21);
    });

    it('should calculate 0% tax correctly', () => {
      const tax = calculateTax(100, 0);
      expect(tax).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const tax = calculateTax(99.99, 21);
      expect(tax).toBeCloseTo(20.9979, 2);
    });
  });

  describe('roundToTwoDecimals', () => {
    it('should round correctly', () => {
      expect(roundToTwoDecimals(10.555)).toBe(10.56);
      expect(roundToTwoDecimals(10.554)).toBe(10.55);
      expect(roundToTwoDecimals(10)).toBe(10);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const formatted = formatCurrency(100.5, 'USD');
      expect(formatted).toBe('$100.50');
    });

    it('should format ARS correctly', () => {
      const formatted = formatCurrency(100.5, 'ARS');
      expect(formatted).toBe('ARS $100.50');
    });
  });

  describe('isExpired', () => {
    it('should detect expired dates', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hora atrás
      expect(isExpired(pastDate)).toBe(true);
    });

    it('should detect non-expired dates', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hora adelante
      expect(isExpired(futureDate)).toBe(false);
    });
  });
});
