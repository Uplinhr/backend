// src/middleware/validation.js - Middleware de validación
const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// Validaciones para usuarios
const validateUser = [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('role').optional().isIn(['ADMINISTRADOR', 'CLIENTE']).withMessage('Invalid role'),
  handleValidationErrors,
];

// Validaciones para transacciones
const validateTransaction = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('gateway').isIn(['MERCADO_PAGO', 'PAYPAL', 'PAYONEER']).withMessage('Invalid gateway'),
  handleValidationErrors,
];

// Validaciones para planes
const validatePlan = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').isAlpha().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 letters'),
  handleValidationErrors,
];

// Validaciones para consultores
const validateConsultant = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
  handleValidationErrors,
];

module.exports = {
  validateUser,
  validateTransaction,
  validatePlan,
  validateConsultant,
  handleValidationErrors,
};