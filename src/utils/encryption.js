import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

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
 * Encripta datos de tarjeta para almacenamiento seguro
 */
export function encryptCardData(cardData) {
  return {
    last_four: cardData.last_four || cardData.number?.slice(-4),
    brand: cardData.brand,
    encrypted_full_number: cardData.number ? encrypt(cardData.number) : null,
    expiry_month: cardData.expiry_month,
    expiry_year: cardData.expiry_year,
  };
}
