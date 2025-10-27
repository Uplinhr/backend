import crypto from 'crypto';

/**
 * Script para generar claves de seguridad
 * Ejecutar: node scripts/generate-keys.js
 */

console.log('\n🔐 Generador de Claves de Seguridad\n');
console.log('='.repeat(60));

// Generar ENCRYPTION_KEY (32 bytes = 64 caracteres hex)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n✅ ENCRYPTION_KEY (AES-256):');
console.log(encryptionKey);

// Generar WEBHOOK_SECRET (32 bytes = 64 caracteres hex)
const webhookSecret = crypto.randomBytes(32).toString('hex');
console.log('\n✅ WEBHOOK_SECRET:');
console.log(webhookSecret);

// Generar JWT_SECRET (opcional, si necesitas uno nuevo)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n✅ JWT_SECRET (opcional):');
console.log(jwtSecret);

console.log('\n' + '='.repeat(60));
console.log('\n📝 Copia estas claves a tu archivo .env.local\n');
console.log('⚠️  IMPORTANTE: Estas claves son únicas, guárdalas en un lugar seguro');
console.log('⚠️  NO las compartas ni las subas a git\n');
