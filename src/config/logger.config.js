// src/config/logger.config.js - Configuración actualizada con sanitize (ES modules)
import winston from 'winston';
// Daily rotate deshabilitado para compatibilidad ESM/Jest

// Formato para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
    return log;
  })
);

const isTest = process.env.NODE_ENV === 'test';
const errorTransport = null;
const combinedTransport = null;

// Logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      silent: isTest,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    ...(errorTransport ? [errorTransport] : []),
    ...(combinedTransport ? [combinedTransport] : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Función para filtrar datos sensibles
const sanitizeLog = (obj) => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'cardNumber'];
  const sanitized = { ...obj };
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  return sanitized;
};

// Logger específico para transacciones de pago
export const paymentLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({ silent: isTest })
  ],
});

logger.sanitize = sanitizeLog;

export default logger;