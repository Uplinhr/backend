import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import paymentConfig from '../config/payment.config.js';
import logger, { paymentLogger } from '../config/logger.config.js';
import { validateSignature } from '../utils/encryption.js';

/**
 * CAPA 1: SEGURIDAD A NIVEL DE APLICACIÓN
 * Helmet, HPP, Sanitización
 */

// Helmet: Configura headers HTTP seguros
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      scriptSrcElem: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", "https://api-m.sandbox.paypal.com", "https://www.sandbox.paypal.com"],
      frameSrc: ["'self'", "https://www.sandbox.paypal.com", "https://api-m.sandbox.paypal.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// HPP: Previene HTTP Parameter Pollution
export const preventParameterPollution = hpp();

// Sanitización de datos NoSQL injection
export const sanitizeData = mongoSanitize({
  replaceWith: '_',
});

/**
 * CAPA 2: RATE LIMITING (Protección contra ataques DDoS/Brute Force)
 */

// Rate limiter general para toda la API
export const generalRateLimiter = rateLimit({
  windowMs: paymentConfig.rateLimit.windowMs,
  max: paymentConfig.rateLimit.maxRequests,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
    retryAfter: Math.ceil(paymentConfig.rateLimit.windowMs / 60000) + ' minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes. Intenta nuevamente más tarde.',
    });
  },
});

// Rate limiter estricto para endpoints de pago
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Solo 10 intentos de pago por IP cada 15 minutos
  message: {
    error: 'Demasiados intentos de pago',
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    paymentLogger.warn(`Payment rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id}`);
    res.status(429).json({
      error: 'Demasiados intentos de pago',
      message: 'Por favor, espera 15 minutos antes de intentar nuevamente.',
    });
  },
});

// Rate limiter para webhooks
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 webhooks por minuto por IP
  message: {
    error: 'Webhook rate limit exceeded',
  },
  handler: (req, res) => {
    logger.warn(`Webhook rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Rate limit exceeded',
    });
  },
});

// Rate limiter para login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login
  message: {
    error: 'Demasiados intentos de inicio de sesión',
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Login rate limit exceeded for IP: ${req.ip}, Email: ${req.body.email}`);
    res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión',
      message: 'Tu cuenta ha sido temporalmente bloqueada. Intenta en 15 minutos.',
    });
  },
});

/**
 * CAPA 3: AUDITORÍA Y LOGGING
 */

// Middleware de auditoría para todas las solicitudes
export const auditLog = (req, res, next) => {
  const startTime = Date.now();

  // Log de request
  logger.info({
    type: 'REQUEST',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  });

  // Capturar response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    logger.info({
      type: 'RESPONSE',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });

    res.send = originalSend;
    return res.send(data);
  };

  next();
};

// Middleware de auditoría específico para pagos
export const paymentAuditLog = (req, res, next) => {
  const startTime = Date.now();

  paymentLogger.info({
    type: 'PAYMENT_REQUEST',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    cartId: req.body?.cart_id || req.params?.cartId,
    gateway: req.body?.payment_gateway,
  });

  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;

    paymentLogger.info({
      type: 'PAYMENT_RESPONSE',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      success: data?.success || false,
    });

    res.json = originalJson;
    return res.json(data);
  };

  next();
};

/**
 * Middleware de validación de webhook signature
 */
export const validateWebhookSignature = (gateway) => {
  return async (req, res, next) => {
    try {
      const signature = req.headers['x-signature'] || req.headers['x-webhook-signature'];
      
      if (!signature) {
        paymentLogger.warn({
          type: 'WEBHOOK_NO_SIGNATURE',
          gateway,
          ip: req.ip,
        });
        return res.status(401).json({ error: 'No signature provided' });
      }

      const payload = JSON.stringify(req.body);
      const isValid = validateSignature(payload, signature);

      if (!isValid) {
        paymentLogger.warn({
          type: 'WEBHOOK_INVALID_SIGNATURE',
          gateway,
          ip: req.ip,
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }

      paymentLogger.info({
        type: 'WEBHOOK_SIGNATURE_VALID',
        gateway,
        ip: req.ip,
      });

      next();
    } catch (error) {
      paymentLogger.error({
        type: 'WEBHOOK_SIGNATURE_ERROR',
        gateway,
        error: error.message,
        ip: req.ip,
      });
      return res.status(500).json({ error: 'Signature validation error' });
    }
  };
};

/**
 * Middleware para verificar que el usuario sea el dueño del recurso
 */
export const verifyOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const resourceId = req.params.id || req.params.orderId || req.params.cartId;

      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      // Aquí implementarías la verificación según el tipo de recurso
      // Por ahora, solo registramos el intento
      logger.info({
        type: 'OWNERSHIP_CHECK',
        resourceType,
        resourceId,
        userId,
      });

      next();
    } catch (error) {
      logger.error({
        type: 'OWNERSHIP_CHECK_ERROR',
        error: error.message,
      });
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};

/**
 * Middleware para verificar que el usuario es admin
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    logger.warn({
      type: 'UNAUTHORIZED_ADMIN_ACCESS',
      userId: req.user?.id,
      url: req.originalUrl,
    });
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

/**
 * Middleware para sanitizar entrada de usuario
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

/**
 * Middleware de manejo de errores global
 */
export const errorHandler = (err, req, res, next) => {
  logger.error({
    type: 'ERROR',
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  });

  // No exponer detalles en producción
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;

  res.status(err.statusCode || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
