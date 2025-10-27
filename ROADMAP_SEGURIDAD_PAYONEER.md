# 🛣️ ROADMAP DE SEGURIDAD PARA PRODUCCIÓN
## Preparación para Integración de Payoneer

---

## RESUMEN EJECUTIVO

**Estado Actual:** 65/100 (MEDIO-ALTO)  
**Estado Objetivo:** 90+/100 (PRODUCCIÓN-READY)  
**Tiempo Estimado:** 3-4 semanas  
**Prioridad:** ALTA - Requerido antes de procesar pagos reales

---

## FASE 1: CRÍTICO (Semana 1-2)
**Objetivo:** Cerrar vulnerabilidades críticas de autenticación

### Día 1-2: Account Lockout ⭐ CRÍTICO
- [x] Análisis completado
- [ ] Ejecutar migraciones SQL
- [ ] Implementar `accountSecurity.js`
- [ ] Modificar controller de login
- [ ] Testing manual
- [ ] Configurar emails de alerta

**Scripts disponibles:**
- `MIGRACIONES_SEGURIDAD.sql` (líneas 1-50)
- `GUIA_IMPLEMENTACION_ACCOUNT_LOCKOUT.md`

**Testing:**
```bash
# Verificar implementación
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","contrasenia":"wrong"}' \
  # Repetir 5 veces
```

---

### Día 3-4: Política de Contraseñas ⭐ CRÍTICO
- [ ] Instalar Joi: `npm install joi`
- [ ] Crear validador de contraseñas
- [ ] Aplicar en registro
- [ ] Aplicar en cambio de contraseña
- [ ] Validación frontend (UX)

**Código:**
```javascript
// src/utils/passwordValidator.js
import Joi from 'joi';

export const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.max': 'La contraseña no puede exceder 128 caracteres',
    'string.pattern.base': 'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)',
  });

export const validatePassword = (password) => {
  const { error } = passwordSchema.validate(password);
  return {
    isValid: !error,
    errors: error ? error.details.map(d => d.message) : []
  };
};

// Lista de contraseñas comunes prohibidas
const COMMON_PASSWORDS = [
  'password', '12345678', 'qwerty', 'abc123', 'password123',
  'admin123', 'letmein', 'welcome', '123456789', 'password1'
];

export const isCommonPassword = (password) => {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
};
```

**Aplicar en registro:**
```javascript
// src/features/auth/controller.js
import { validatePassword, isCommonPassword } from '../../utils/passwordValidator.js';

export const register = async (req, res) => {
  const { contrasenia } = req.body;
  
  // Validar complejidad
  const validation = validatePassword(contrasenia);
  if (!validation.isValid) {
    return errorRes(res, {
      message: validation.errors.join(', '),
      statusCode: 400
    });
  }
  
  // Verificar contraseña común
  if (isCommonPassword(contrasenia)) {
    return errorRes(res, {
      message: 'Esta contraseña es muy común. Por favor elige una más segura.',
      statusCode: 400
    });
  }
  
  // ... resto del código
};
```

---

### Día 5-6: Anti-Enumeration ⭐ CRÍTICO
- [ ] Modificar respuestas de login
- [ ] Implementar timing attack prevention
- [ ] Mensajes genéricos en todos los endpoints
- [ ] Testing de timing

**Modificaciones en login:**
```javascript
export const login = async (req, res) => {
  const { email, contrasenia } = req.body;
  
  const user = await authModel.login(email);
  
  // Hash dummy para timing attack prevention
  const dummyHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  const passwordToCompare = user ? user.contrasenia : dummyHash;
  
  // SIEMPRE comparar (mismo tiempo de ejecución)
  const isMatch = await bcrypt.compare(contrasenia, passwordToCompare);
  
  // Respuesta ÚNICA para todos los fallos
  if (!user || !isMatch || !user.active) {
    if (user) {
      await registerFailedLoginAttempt(user.id, req.ip, req.get('user-agent'));
    }
    
    return errorRes(res, {
      message: 'Credenciales inválidas',
      statusCode: 401,
      code: 'INVALID_CREDENTIALS'
    });
  }
  
  // ... resto del código
};
```

---

### Día 7-10: Email Verification ⭐ CRÍTICO
- [ ] Ejecutar migración de email_verification
- [ ] Crear service de verificación
- [ ] Endpoint de envío de verificación
- [ ] Endpoint de confirmación
- [ ] Template de email
- [ ] Limpieza automática de tokens

**Scripts disponibles:**
- `MIGRACIONES_SEGURIDAD.sql` (líneas 51-80)

**Estructura:**
```javascript
// src/services/emailVerification.service.js
class EmailVerificationService {
  async sendVerificationEmail(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    await pool.query(
      'INSERT INTO email_verification (id_usuario, token, email, expires_at) VALUES (?, ?, ?, ?)',
      [userId, token, email, expiresAt]
    );
    
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    // Enviar email con Resend
    await resend.emails.send({
      from: `UplinHR <${process.env.EMAIL_FROM}>`,
      to: [email],
      subject: 'Verifica tu email - UplinHR',
      html: `
        <h2>Verifica tu email</h2>
        <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
        <a href="${verifyUrl}">Verificar Email</a>
        <p>Este enlace expira en 24 horas.</p>
      `
    });
  }
  
  async verifyEmail(token) {
    const [rows] = await pool.query(
      'SELECT * FROM email_verification WHERE token = ? AND expires_at > NOW() AND verified_at IS NULL',
      [token]
    );
    
    if (!rows[0]) {
      return { success: false, error: 'Token inválido o expirado' };
    }
    
    await pool.query(
      'UPDATE usuarios SET email_verified = TRUE WHERE id = ?',
      [rows[0].id_usuario]
    );
    
    await pool.query(
      'UPDATE email_verification SET verified_at = NOW() WHERE id = ?',
      [rows[0].id]
    );
    
    return { success: true };
  }
}
```

---

### Día 11-14: Refresh Tokens ⭐ CRÍTICO
- [ ] Ejecutar migración de refresh_tokens
- [ ] Generar JWT_REFRESH_SECRET diferente
- [ ] Implementar generación de tokens
- [ ] Endpoint /auth/refresh
- [ ] Token rotation
- [ ] Cookie segura con SameSite

**Scripts disponibles:**
- `MIGRACIONES_SEGURIDAD.sql` (líneas 81-115)

**Configuración:**
```javascript
// .env
JWT_SECRET=tu_secret_para_access_tokens
JWT_REFRESH_SECRET=tu_secret_diferente_para_refresh_tokens
```

**Implementación:**
```javascript
// src/utils/tokenManager.js
export function generateTokenPair(userId) {
  const accessToken = jwt.sign(
    { id: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

// Controller
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Verificar en BD que no esté revocado
    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = FALSE AND expires_at > NOW()',
      [refreshToken]
    );
    
    if (!rows[0]) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }
    
    // Generar nuevos tokens (rotation)
    const tokens = generateTokenPair(decoded.id);
    
    // Revocar el anterior
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE, replaced_by_token = ? WHERE token = ?',
      [tokens.refreshToken, refreshToken]
    );
    
    // Guardar nuevo refresh token
    await saveRefreshToken(decoded.id, tokens.refreshToken, req.ip);
    
    // Enviar nuevos tokens
    res.cookie('token', tokens.accessToken, cookieOptions);
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
    
    return res.json({ success: true });
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

---

## FASE 2: ALTA PRIORIDAD (Semana 3)
**Objetivo:** Implementar capas adicionales de seguridad

### Día 15-17: 2FA (TOTP) ⭐ ALTO
- [ ] Instalar dependencias: `npm install speakeasy qrcode`
- [ ] Ejecutar migraciones de 2FA
- [ ] Implementar service de 2FA
- [ ] Endpoints de configuración
- [ ] Modificar login para soportar 2FA
- [ ] UI de configuración

**Scripts disponibles:**
- `GUIA_2FA_IMPLEMENTACION.md` (completa)

---

### Día 18-19: Security Notifications ⭐ ALTO
- [ ] Template de email para cambio de contraseña
- [ ] Template de email para login desde nueva IP
- [ ] Template de email para activación/desactivación 2FA
- [ ] Sistema de preferencias de notificaciones

**Eventos a notificar:**
1. Cambio de contraseña
2. Login desde nueva ubicación/IP
3. 2FA activado/desactivado
4. Cuenta bloqueada
5. Intento de recuperación de contraseña
6. Método de pago agregado/eliminado

---

### Día 20-21: Automated Cleanup & Monitoring ⭐ ALTO
- [ ] Script de limpieza de tokens expirados
- [ ] Cron job para ejecutar diariamente
- [ ] Dashboard de métricas de seguridad
- [ ] Alertas automáticas para admins

**Cron job:**
```javascript
// scripts/security-cleanup.js
import cron from 'node-cron';
import pool from '../src/database/database.js';
import logger from '../src/config/logger.config.js';

// Ejecutar diariamente a las 3 AM
cron.schedule('0 3 * * *', async () => {
  logger.info('Starting security cleanup...');
  
  // 1. Tokens de reinicio expirados
  const [reset] = await pool.query(
    'DELETE FROM reinicio_contrasenia WHERE fecha_exp < NOW() OR used = TRUE'
  );
  logger.info(`Cleaned ${reset.affectedRows} password reset tokens`);
  
  // 2. Tokens de verificación expirados
  const [verify] = await pool.query(
    'DELETE FROM email_verification WHERE expires_at < NOW() OR verified_at IS NOT NULL'
  );
  logger.info(`Cleaned ${verify.affectedRows} email verification tokens`);
  
  // 3. Refresh tokens expirados
  const [refresh] = await pool.query(
    'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE'
  );
  logger.info(`Cleaned ${refresh.affectedRows} refresh tokens`);
  
  // 4. Desbloquear cuentas cuyo lockout expiró
  const [unlock] = await pool.query(
    'UPDATE usuarios SET locked_until = NULL, login_attempts = 0 WHERE locked_until < NOW()'
  );
  logger.info(`Unlocked ${unlock.affectedRows} accounts`);
  
  logger.info('Security cleanup completed');
});

export default cron;
```

---

## FASE 3: MEJORAS (Semana 4)
**Objetivo:** Optimizaciones y features avanzados

### Día 22-23: Session Management
- [ ] Tabla de sesiones activas
- [ ] Endpoint para ver dispositivos activos
- [ ] Opción de cerrar sesión remota
- [ ] Límite de sesiones simultáneas

### Día 24-25: Password History
- [ ] Tabla password_history
- [ ] Verificar últimas 5 contraseñas
- [ ] Prevenir reutilización

### Día 26-28: Testing & Auditoría
- [ ] Penetration testing
- [ ] OWASP ZAP scan
- [ ] `npm audit` y fix vulnerabilidades
- [ ] Load testing
- [ ] Documentación final

---

## PREPARACIÓN ESPECÍFICA PARA PAYONEER

### Requisitos de Payoneer

**1. Compliance & Regulaciones**
- [ ] PCI DSS Level 2 (si almacenas tarjetas)
- [ ] GDPR compliance (si operas en EU)
- [ ] AML/KYC procedures
- [ ] Data encryption at rest y in transit

**2. Seguridad de API**
- [ ] TLS 1.2+ obligatorio
- [ ] Webhook signature validation
- [ ] API key rotation policy
- [ ] Rate limiting por merchant

**3. Auditoría**
- [ ] Log de todas las transacciones
- [ ] Audit trail completo
- [ ] Retención de logs (mínimo 2 años)
- [ ] Alertas de actividad sospechosa

---

### Estructura de Integración Payoneer

**Archivo:** `src/services/payoneer.service.js`

```javascript
import axios from 'axios';
import { encrypt, decrypt, hashData, validateSignature } from '../utils/encryption.js';
import logger from '../config/logger.config.js';
import AuditModel from '../features/payments/models/audit.model.js';

class PayoneerService {
  constructor() {
    this.apiUrl = process.env.PAYONEER_API_URL;
    this.clientId = process.env.PAYONEER_CLIENT_ID;
    this.clientSecret = process.env.PAYONEER_CLIENT_SECRET;
    this.webhookSecret = process.env.PAYONEER_WEBHOOK_SECRET;
  }
  
  /**
   * Autenticación con Payoneer
   */
  async authenticate() {
    try {
      const response = await axios.post(`${this.apiUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });
      
      return response.data.access_token;
    } catch (error) {
      logger.error('Payoneer authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Crear pago
   */
  async createPayment(orderData) {
    try {
      const token = await this.authenticate();
      
      // Encriptar datos sensibles antes de enviar
      const encryptedData = {
        ...orderData,
        // Campos sensibles encriptados
        customer_email: encrypt(orderData.customer_email),
        billing_address: encrypt(JSON.stringify(orderData.billing_address))
      };
      
      // Log de auditoría ANTES de enviar
      await AuditModel.logEvent({
        id_order: orderData.orderId,
        id_usuario: orderData.userId,
        event_type: 'payoneer_payment_initiated',
        performed_by_type: 'system',
        metadata: {
          amount: orderData.amount,
          currency: orderData.currency
        }
      });
      
      const response = await axios.post(
        `${this.apiUrl}/v1/payments`,
        encryptedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID() // Idempotency
          },
          timeout: 30000 // 30 segundos
        }
      );
      
      // Log de auditoría DESPUÉS de respuesta
      await AuditModel.logEvent({
        id_order: orderData.orderId,
        id_usuario: orderData.userId,
        event_type: 'payoneer_payment_created',
        performed_by_type: 'gateway',
        new_value: {
          payoneer_payment_id: response.data.payment_id,
          status: response.data.status
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Payoneer payment creation failed:', error);
      
      // Log de error
      await AuditModel.logEvent({
        id_order: orderData.orderId,
        id_usuario: orderData.userId,
        event_type: 'payoneer_payment_failed',
        performed_by_type: 'system',
        metadata: {
          error: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Validar webhook de Payoneer
   */
  validateWebhook(payload, signature) {
    const expectedSignature = hashData(JSON.stringify(payload), this.webhookSecret);
    
    try {
      return validateSignature(JSON.stringify(payload), signature, this.webhookSecret);
    } catch (error) {
      logger.error('Webhook signature validation failed:', error);
      return false;
    }
  }
  
  /**
   * Procesar webhook de Payoneer
   */
  async handleWebhook(payload, signature) {
    // Validar firma
    if (!this.validateWebhook(payload, signature)) {
      logger.warn('Invalid webhook signature from Payoneer');
      throw new Error('Invalid signature');
    }
    
    // Registrar webhook recibido
    const webhookId = await this.saveWebhookEvent(payload, signature);
    
    try {
      // Procesar según tipo de evento
      switch (payload.event_type) {
        case 'payment.completed':
          await this.handlePaymentCompleted(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'refund.completed':
          await this.handleRefundCompleted(payload);
          break;
        default:
          logger.warn(`Unknown Payoneer webhook event: ${payload.event_type}`);
      }
      
      // Marcar webhook como procesado
      await this.markWebhookProcessed(webhookId, 'completed');
    } catch (error) {
      logger.error('Error processing Payoneer webhook:', error);
      await this.markWebhookProcessed(webhookId, 'failed', error.message);
      throw error;
    }
  }
  
  async saveWebhookEvent(payload, signature) {
    const [result] = await pool.query(
      `INSERT INTO webhook_events 
       (event_id, payment_gateway, event_type, payload, signature, ip_address) 
       VALUES (?, 'payoneer', ?, ?, ?, ?)`,
      [
        payload.event_id || crypto.randomUUID(),
        payload.event_type,
        JSON.stringify(payload),
        signature,
        payload.source_ip
      ]
    );
    return result.insertId;
  }
}

export default new PayoneerService();
```

---

### Configuración de Variables de Entorno

**Agregar a `.env`:**
```bash
# Payoneer Configuration
PAYONEER_CLIENT_ID=your_client_id_here
PAYONEER_CLIENT_SECRET=your_client_secret_here
PAYONEER_API_URL=https://api.payoneer.com
PAYONEER_WEBHOOK_SECRET=your_webhook_secret_here

# Encryption (REQUERIDO - Generar con openssl rand -hex 32)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Webhook Secrets (uno por gateway)
WEBHOOK_SECRET=your_general_webhook_secret
MERCADOPAGO_WEBHOOK_SECRET=your_mp_webhook_secret
PAYPAL_WEBHOOK_SECRET=your_paypal_webhook_secret
```

**Generar claves seguras:**
```bash
# Generar ENCRYPTION_KEY
openssl rand -hex 32

# Generar JWT secrets
openssl rand -base64 64

# Generar webhook secrets
openssl rand -hex 32
```

---

## CHECKLIST PRE-PRODUCCIÓN

### Seguridad de Autenticación
- [ ] Account lockout implementado
- [ ] Password policy fuerte
- [ ] Anti-enumeration aplicado
- [ ] Email verification obligatorio
- [ ] Refresh tokens funcionando
- [ ] 2FA disponible (opcional para usuarios)
- [ ] Cookies con httpOnly, secure, sameSite

### Seguridad de Datos
- [ ] ENCRYPTION_KEY generada y rotada
- [ ] Secrets diferentes para cada propósito
- [ ] Datos sensibles encriptados en BD
- [ ] HTTPS habilitado con certificado válido
- [ ] Backups automáticos configurados
- [ ] Variables de entorno protegidas (no en repositorio)

### Seguridad de API
- [ ] Rate limiting activo en producción
- [ ] CORS restrictivo (solo dominios permitidos)
- [ ] Helmet configurado
- [ ] Validación de input en todos los endpoints
- [ ] Sanitización de datos
- [ ] Error messages no revelan información sensible

### Auditoría & Monitoring
- [ ] Logs centralizados (Winston configurado)
- [ ] Audit trail de transacciones
- [ ] Alertas automáticas configuradas
- [ ] Dashboard de métricas de seguridad
- [ ] Retención de logs definida

### Payoneer Específico
- [ ] Credenciales de sandbox funcionando
- [ ] Webhook endpoint configurado
- [ ] Signature validation implementada
- [ ] Idempotency keys en requests
- [ ] Error handling robusto
- [ ] Timeout configurado (30s)

### Compliance
- [ ] Política de privacidad actualizada
- [ ] Términos y condiciones
- [ ] GDPR compliance (si aplica)
- [ ] PCI DSS assessment (si almacenas tarjetas)
- [ ] Documentación de seguridad completa

### Testing
- [ ] Unit tests para funciones críticas
- [ ] Integration tests de flujo completo
- [ ] Penetration testing
- [ ] Load testing (1000+ usuarios concurrentes)
- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] OWASP ZAP scan sin issues críticos

---

## SCRIPTS ÚTILES

### Generar Reporte de Seguridad
```bash
# scripts/security-report.js
node scripts/security-report.js

# Output:
# - Cuentas bloqueadas actualmente
# - Intentos fallidos últimas 24h
# - Sesiones activas por usuario
# - Eventos de seguridad críticos
# - Webhooks pendientes
```

### Rotar Secrets
```bash
# scripts/rotate-secrets.js
node scripts/rotate-secrets.js

# Rotará:
# - ENCRYPTION_KEY (re-encriptará datos)
# - JWT_SECRET (invalidará tokens)
# - WEBHOOK_SECRETS
```

### Health Check de Seguridad
```bash
curl http://localhost:4000/api/security/health

# Response:
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "encryption": "ok",
    "rate_limiting": "ok",
    "webhooks": "ok"
  }
}
```

---

## CONTACTOS Y RECURSOS

### Documentación Payoneer
- API Reference: https://developer.payoneer.com/docs
- Sandbox: https://sandbox.payoneer.com
- Support: support@payoneer.com

### Recursos de Seguridad
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- PCI DSS: https://www.pcisecuritystandards.org/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725

---

## RESUMEN DE ARCHIVOS GENERADOS

1. **INFORME_SEGURIDAD_COMPLETO.md** - Análisis detallado
2. **MIGRACIONES_SEGURIDAD.sql** - Todos los scripts SQL
3. **GUIA_IMPLEMENTACION_ACCOUNT_LOCKOUT.md** - Account lockout completo
4. **GUIA_2FA_IMPLEMENTACION.md** - 2FA paso a paso
5. **ROADMAP_SEGURIDAD_PAYONEER.md** - Este documento

---

**Próximos Pasos:**
1. Revisar informe completo
2. Priorizar implementaciones críticas
3. Comenzar con Fase 1 (Semana 1-2)
4. Establecer contacto con Payoneer para credenciales
5. Ejecutar testing exhaustivo antes de producción

**¿Dudas o necesitas asistencia?** Documenta cualquier bloqueador o pregunta técnica.
