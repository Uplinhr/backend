import crypto from 'crypto';
import bcrypt from 'bcrypt';
import logger from '../config/logger.config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Deriva una clave de cifrado desde la clave maestra
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encripta datos sensibles (tarjetas, tokens, etc.)
 * @param {string} text - Texto a encriptar
 * @param {string} masterKey - Clave maestra (ENCRYPTION_KEY)
 * @returns {string} - Texto encriptado en formato: salt:iv:tag:encrypted
 */
export function encrypt(text, masterKey = process.env.ENCRYPTION_KEY) {
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY no configurada');
  }

  if (!text) {
    return null;
  }

  // Generar salt e IV aleatorios
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derivar clave
  const key = deriveKey(masterKey, salt);

  // Encriptar
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Obtener tag de autenticación
  const tag = cipher.getAuthTag();

  // Retornar: salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta datos
 * @param {string} encryptedData - Datos encriptados
 * @param {string} masterKey - Clave maestra
 * @returns {string} - Texto original
 */
export function decrypt(encryptedData, masterKey = process.env.ENCRYPTION_KEY) {
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY no configurada');
  }

  if (!encryptedData) {
    return null;
  }

  try {
    // Separar componentes
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Formato de dato encriptado inválido');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    // Derivar clave
    const key = deriveKey(masterKey, salt);

    // Desencriptar
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Error al desencriptar: ${error.message}`);
  }
}

/**
 * Hash de datos sensibles (unidireccional)
 * Útil para validación de webhooks
 */
export function hashData(data, secret = process.env.WEBHOOK_SECRET) {
  if (!secret) {
    throw new Error('WEBHOOK_SECRET no configurado');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * Valida firma HMAC
 */
export function validateSignature(data, signature, secret = process.env.WEBHOOK_SECRET) {
  const expectedSignature = hashData(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Genera un token seguro aleatorio
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Ofusca información sensible para logs
 * Ej: "4532123456789012" -> "4532********9012"
 */
export function maskSensitiveData(data, visibleStart = 4, visibleEnd = 4) {
  if (!data || data.length <= visibleStart + visibleEnd) {
    return '****';
  }

  const start = data.slice(0, visibleStart);
  const end = data.slice(-visibleEnd);
  const masked = '*'.repeat(data.length - visibleStart - visibleEnd);

  return `${start}${masked}${end}`;
}

/**
 * Encripta datos de tarjeta para almacenamiento seguro (compatibilidad)
 */
export function encryptCardData(cardData) {
  if (!cardData || typeof cardData !== 'object') return null;
  return {
    last_four: cardData.last_four || cardData.number?.slice(-4) || null,
    brand: cardData.brand || null,
    encrypted_full_number: cardData.number ? encrypt(cardData.number) : null,
    expiry_month: cardData.expiry_month || null,
    expiry_year: cardData.expiry_year || null,
  };
}

/**
 * Hash de contraseñas usando bcrypt (según prompt Día 2)
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Hash bcrypt
 */
export async function hashPassword(password) {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Contraseña inválida');
    }

    if (password.length < 8) {
      throw new Error('Contraseña debe tener al menos 8 caracteres');
    }

    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    logger.info('Contraseña hasheada exitosamente', logger.sanitize({
      length: password.length,
      hashLength: hash.length
    }));

    return hash;

  } catch (error) {
    logger.error('Error hasheando contraseña', logger.sanitize({
      error: error.message,
      length: password ? password.length : 0
    }));
    throw new Error('Error procesando contraseña');
  }
}

/**
 * Verifica contraseña contra hash bcrypt
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash bcrypt
 * @returns {Promise<boolean>} - True si coincide
 */
export async function verifyPassword(password, hash) {
  try {
    if (!password || !hash) {
      return false;
    }

    const isValid = await bcrypt.compare(password, hash);

    logger.debug('Verificación de contraseña completada', logger.sanitize({
      isValid,
      passwordLength: password.length
    }));

    return isValid;

  } catch (error) {
    logger.error('Error verificando contraseña', logger.sanitize({
      error: error.message
    }));
    return false;
  }
}

/**
 * Encripta datos de pago según prompt Día 2
 * Para tokens temporales y datos de transacción
 */
export function encryptPaymentData(paymentData) {
  try {
    if (!paymentData || typeof paymentData !== 'object') {
      throw new Error('Datos de pago inválidos');
    }

    const jsonData = JSON.stringify({
      ...paymentData,
      encryptedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    const encrypted = encrypt(jsonData);

    logger.info('Datos de pago encriptados', logger.sanitize({
      gateway: paymentData.gateway,
      expiresIn: '24h'
    }));

    return encrypted;

  } catch (error) {
    logger.error('Error encriptando datos de pago', logger.sanitize({
      error: error.message
    }));
    throw new Error('Error procesando datos de pago');
  }
}

/**
 * Verifica si datos de pago han expirado
 */
export function isPaymentDataExpired(encryptedData) {
  try {
    const decrypted = decrypt(encryptedData);
    const data = JSON.parse(decrypted);

    if (!data.expiresAt) {
      return true;
    }

    const isExpired = new Date() > new Date(data.expiresAt);

    if (isExpired) {
      logger.warn('Datos de pago expirados', logger.sanitize({
        expiredAt: data.expiresAt
      }));
    }

    return isExpired;

  } catch (error) {
    logger.error('Error verificando expiración', logger.sanitize({
      error: error.message
    }));
    return true;
  }
}

/**
 * Encripta metadatos de transacción para auditoría
 */
export function encryptTransactionMetadata(transactionData) {
  try {
    const auditData = {
      ...transactionData,
      encryptedAt: new Date().toISOString(),
      encryptionVersion: '2.0',
      sensitiveFields: ['cardData', 'personalInfo', 'securityTokens']
    };

    return encrypt(JSON.stringify(auditData));

  } catch (error) {
    logger.error('Error encriptando metadatos de transacción', logger.sanitize({
      error: error.message
    }));
    throw error;
  }
}

/**
 * Documentación de estrategia de encriptación según prompt Día 2
 */
export const ENCRYPTION_STRATEGY = {
  // Configuración principal
  algorithm: ALGORITHM,
  keyDerivation: {
    method: 'PBKDF2',
    iterations: ITERATIONS,
    keyLength: KEY_LENGTH,
    hash: 'sha512'
  },

  // Configuración de bcrypt
  bcrypt: {
    saltRounds: BCRYPT_SALT_ROUNDS,
    minPasswordLength: 8
  },

  // Campos sensibles que se encriptan
  sensitiveFields: [
    'cardNumber',
    'cvv',
    'expiryDate',
    'cardHolderName',
    'personalData',
    'securityCode',
    'token',
    'apiKey',
    'secret',
    'paymentTokens'
  ],

  // Campos que solo se hashean (unidireccional)
  hashOnlyFields: [
    'password',
    'passwordHash',
    'confirmPassword',
    'webhookSignature'
  ],

  // Estrategia de manejo de claves
  keyManagement: {
    environmentVariable: 'ENCRYPTION_KEY',
    minimumLength: 32,
    rotationPolicy: '6 months',
    backupStrategy: 'multiple keys with versioning'
  },

  // Configuración de tokens de pago
  paymentTokens: {
    defaultExpiration: '24 hours',
    maxExpiration: '7 days',
    renewalThreshold: '2 hours'
  },

  // Configuración de auditoría
  audit: {
    encryptTransactionData: true,
    logEncryptionEvents: true,
    retainEncryptionLogs: '90 days'
  }
};

export default {
  encrypt,
  decrypt,
  hashData,
  validateSignature,
  generateSecureToken,
  maskSensitiveData,
  encryptCardData,
  hashPassword,
  verifyPassword,
  encryptPaymentData,
  isPaymentDataExpired,
  encryptTransactionMetadata,
  ENCRYPTION_STRATEGY
};
