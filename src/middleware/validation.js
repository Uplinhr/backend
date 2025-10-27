// src/middleware/validation.js - Middleware de validación robusto según prompt Día 2
import { body, param, query, validationResult } from 'express-validator';
import logger from '../config/logger.config.js';

// Middleware para validar resultados de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Errores de validación detectados', logger.sanitize({
      path: req.path,
      method: req.method,
      errors: errors.array(),
      ip: req.ip
    }));

    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array(),
      errorId: require('crypto').randomUUID()
    });
  }

  next();
};

// Validaciones para usuarios
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido')
    .isLength({ max: 255 })
    .withMessage('Email demasiado largo'),

  body('nombre')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nombre debe tener entre 1 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),

  body('apellido')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Apellido debe tener entre 1 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),

  body('contrasenia')
    .isLength({ min: 8, max: 128 })
    .withMessage('Contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial'),

  body('num_celular')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/)
    .withMessage('Número de teléfono inválido'),

  handleValidationErrors
];

export const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nombre debe tener entre 1 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),

  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Apellido debe tener entre 1 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),

  handleValidationErrors
];

export const validatePasswordChange = [
  body('contrasenia')
    .isLength({ min: 8, max: 128 })
    .withMessage('Contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial'),

  body('confirmarContrasenia')
    .custom((value, { req }) => {
      if (value !== req.body.contrasenia) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

// Validaciones para autenticación
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  body('contrasenia')
    .notEmpty()
    .withMessage('Contraseña es requerida'),

  handleValidationErrors
];

export const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  handleValidationErrors
];

// Validaciones para planes
export const validatePlanCreation = [
  body('nombre')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre del plan debe tener entre 1 y 100 caracteres'),

  body('precio')
    .isFloat({ min: 0 })
    .withMessage('Precio debe ser un número positivo'),

  body('creditos_mes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Créditos por mes debe ser un número entero positivo'),

  body('meses_cred')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Meses de créditos debe ser al menos 1'),

  body('horas_cons')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Horas de consultoría debe ser un número positivo'),

  body('custom')
    .optional()
    .isBoolean()
    .withMessage('Campo custom debe ser verdadero o falso'),

  handleValidationErrors
];

// Validaciones para pagos
export const validatePaymentCreation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Monto debe ser mayor a 0'),

  body('currency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .withMessage('Moneda debe ser un código de 3 letras'),

  body('gateway')
    .isIn(['MERCADO_PAGO', 'PAYPAL', 'PAYONEER'])
    .withMessage('Gateway inválido'),

  body('planId')
    .optional()
    .isUUID()
    .withMessage('ID de plan inválido'),

  handleValidationErrors
];

// Validaciones para parámetros de ruta
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID debe ser un UUID válido'),

  handleValidationErrors
];

export const validateEmailParam = [
  param('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  handleValidationErrors
];

// Validaciones para consultas
export const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Consulta de búsqueda debe tener entre 1 y 100 caracteres')
    .matches(/^[^<>\"'&]*$/)
    .withMessage('Consulta contiene caracteres no permitidos'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser un número positivo'),

  handleValidationErrors
];

// Validaciones para consultores
export const validateConsultantCreation = [
  body('full_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre completo debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  body('specialization')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Especialización no puede tener más de 200 caracteres'),

  body('hourly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tarifa por hora debe ser un número positivo'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Biografía no puede tener más de 1000 caracteres'),

  body('available')
    .optional()
    .isBoolean()
    .withMessage('Campo available debe ser verdadero o falso'),

  handleValidationErrors
];

// Middleware de sanitización general
export const sanitizeInput = (req, res, next) => {
  // Sanitizar strings contra XSS
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>\"'&]/g, '') // Remover caracteres peligrosos
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  };

  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  // Sanitizar query parameters
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  // Sanitizar parámetros de ruta
  if (req.params && typeof req.params === 'object') {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    });
  }

  next();
};

// Validación de tamaño de request
export const validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    const maxBytes = parseInt(maxSize.replace('mb', '')) * 1024 * 1024;

    if (contentLength && parseInt(contentLength) > maxBytes) {
      logger.warn('Request demasiado grande rechazado', logger.sanitize({
        size: contentLength,
        maxSize: maxSize,
        ip: req.ip
      }));

      return res.status(413).json({
        error: 'Request demasiado grande',
        errorId: require('crypto').randomUUID()
      });
    }

    next();
  };
};

// Validación de tipos de archivo (para uploads futuros)
export const validateFileType = (allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) => {
  return (req, res, next) => {
    if (!req.file) return next();

    if (!allowedTypes.includes(req.file.mimetype)) {
      logger.warn('Tipo de archivo no permitido', logger.sanitize({
        type: req.file.mimetype,
        allowed: allowedTypes,
        ip: req.ip
      }));

      return res.status(400).json({
        error: 'Tipo de archivo no permitido',
        errorId: require('crypto').randomUUID()
      });
    }

    next();
  };
};

export default {
  handleValidationErrors,
  validateUserRegistration,
  validateUserUpdate,
  validatePasswordChange,
  validateLogin,
  validatePasswordReset,
  validatePlanCreation,
  validatePaymentCreation,
  validateUUID,
  validateEmailParam,
  validateSearchQuery,
  validateConsultantCreation,
  sanitizeInput,
  validateRequestSize,
  validateFileType
};
