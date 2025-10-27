# 🔒 GUÍA DE IMPLEMENTACIÓN: ACCOUNT LOCKOUT

## Objetivo
Implementar bloqueo automático de cuentas después de múltiples intentos fallidos de login para prevenir ataques de fuerza bruta.

---

## PASO 1: Ejecutar Migraciones SQL

```bash
# Ejecutar solo la sección de Account Lockout de MIGRACIONES_SEGURIDAD.sql
mysql -u root -p uplindb
```

```sql
ALTER TABLE usuarios 
ADD COLUMN login_attempts INT DEFAULT 0,
ADD COLUMN locked_until TIMESTAMP NULL,
ADD COLUMN last_login_attempt TIMESTAMP NULL,
ADD COLUMN last_login_success TIMESTAMP NULL,
ADD COLUMN last_login_ip VARCHAR(45) NULL;

CREATE INDEX idx_locked_until ON usuarios(locked_until);
CREATE INDEX idx_email_active ON usuarios(email, active);
```

---

## PASO 2: Crear Helper Functions

**Archivo:** `src/utils/accountSecurity.js`

```javascript
import pool from '../database/database.js';
import logger from '../config/logger.config.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.MAIL_API_KEY);

// Configuración (mejor moverlas a security_config en BD)
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const LOCKOUT_WARNING_THRESHOLD = 3; // Advertir al usuario después de 3 intentos

/**
 * Verifica si una cuenta está bloqueada
 */
export async function isAccountLocked(userId) {
  try {
    const [rows] = await pool.query(
      'SELECT locked_until FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (!rows[0] || !rows[0].locked_until) {
      return false;
    }
    
    const lockedUntil = new Date(rows[0].locked_until);
    const now = new Date();
    
    // Si aún está bloqueado
    if (lockedUntil > now) {
      return {
        locked: true,
        lockedUntil: lockedUntil,
        minutesRemaining: Math.ceil((lockedUntil - now) / 60000)
      };
    }
    
    // Si el bloqueo expiró, limpiar campos
    await pool.query(
      'UPDATE usuarios SET locked_until = NULL, login_attempts = 0 WHERE id = ?',
      [userId]
    );
    
    return false;
  } catch (error) {
    logger.error('Error checking account lock:', error);
    throw error;
  }
}

/**
 * Registra un intento fallido de login
 */
export async function registerFailedLoginAttempt(userId, ipAddress, userAgent = null) {
  try {
    // Incrementar contador
    await pool.query(
      `UPDATE usuarios 
       SET login_attempts = login_attempts + 1,
           last_login_attempt = NOW(),
           last_login_ip = ?
       WHERE id = ?`,
      [ipAddress, userId]
    );
    
    // Obtener intentos actuales
    const [rows] = await pool.query(
      'SELECT login_attempts, email, nombre FROM usuarios WHERE id = ?',
      [userId]
    );
    
    const { login_attempts, email, nombre } = rows[0];
    
    logger.warn(`Failed login attempt for user ${userId} (${email}). Attempts: ${login_attempts}/${MAX_LOGIN_ATTEMPTS}`);
    
    // Si alcanzó el máximo, bloquear cuenta
    if (login_attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      
      await pool.query(
        'UPDATE usuarios SET locked_until = ? WHERE id = ?',
        [lockedUntil, userId]
      );
      
      logger.error(`Account locked for user ${userId} (${email}). Locked until: ${lockedUntil}`);
      
      // Enviar email de alerta
      await sendAccountLockedEmail(email, nombre, lockedUntil, ipAddress);
      
      // Registrar evento de seguridad
      await logSecurityEvent({
        userId: userId,
        eventType: 'account_locked',
        severity: 'high',
        ipAddress: ipAddress,
        userAgent: userAgent,
        description: `Cuenta bloqueada por ${MAX_LOGIN_ATTEMPTS} intentos fallidos`
      });
      
      return {
        locked: true,
        attempts: login_attempts,
        lockedUntil: lockedUntil
      };
    }
    
    // Advertencia si está cerca del límite
    if (login_attempts >= LOCKOUT_WARNING_THRESHOLD) {
      const remainingAttempts = MAX_LOGIN_ATTEMPTS - login_attempts;
      logger.warn(`User ${userId} has ${remainingAttempts} attempts remaining`);
      
      return {
        locked: false,
        attempts: login_attempts,
        remainingAttempts: remainingAttempts,
        warning: true
      };
    }
    
    return {
      locked: false,
      attempts: login_attempts,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - login_attempts
    };
  } catch (error) {
    logger.error('Error registering failed login attempt:', error);
    throw error;
  }
}

/**
 * Resetea los intentos fallidos después de login exitoso
 */
export async function resetLoginAttempts(userId, ipAddress) {
  try {
    await pool.query(
      `UPDATE usuarios 
       SET login_attempts = 0,
           locked_until = NULL,
           last_login_success = NOW(),
           last_login_attempt = NOW(),
           last_login_ip = ?
       WHERE id = ?`,
      [ipAddress, userId]
    );
    
    logger.info(`Login attempts reset for user ${userId}`);
    
    // Registrar evento exitoso
    await logSecurityEvent({
      userId: userId,
      eventType: 'login_success',
      severity: 'low',
      ipAddress: ipAddress,
      description: 'Login exitoso'
    });
  } catch (error) {
    logger.error('Error resetting login attempts:', error);
    throw error;
  }
}

/**
 * Envía email de alerta de cuenta bloqueada
 */
async function sendAccountLockedEmail(email, nombre, lockedUntil, ipAddress) {
  try {
    const { data, error } = await resend.emails.send({
      from: `UplinHR Seguridad <${process.env.EMAIL_FROM}>`,
      to: [email],
      subject: '⚠️ Cuenta Bloqueada por Seguridad - UplinHR',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #fff; padding: 30px; border-radius: 10px; border-top: 4px solid #dc3545;">
                    <h2 style="color: #dc3545; margin-top: 0;">⚠️ Cuenta Bloqueada Temporalmente</h2>
                    
                    <p>Hola <strong>${nombre}</strong>,</p>
                    
                    <p>Tu cuenta ha sido <strong>bloqueada temporalmente</strong> por motivos de seguridad debido a múltiples intentos fallidos de inicio de sesión.</p>
                    
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Detalles del bloqueo:</strong></p>
                        <ul style="margin: 10px 0;">
                            <li>Intentos fallidos: ${MAX_LOGIN_ATTEMPTS}</li>
                            <li>Bloqueada hasta: ${lockedUntil.toLocaleString('es-AR')}</li>
                            <li>Dirección IP: ${ipAddress}</li>
                        </ul>
                    </div>
                    
                    <p><strong>¿Fuiste tú?</strong></p>
                    <ul>
                        <li>Si intentaste iniciar sesión y olvidaste tu contraseña, espera ${LOCKOUT_DURATION_MINUTES} minutos y luego usa la opción "Recuperar Contraseña".</li>
                        <li>Tu cuenta se desbloqueará automáticamente después de ${LOCKOUT_DURATION_MINUTES} minutos.</li>
                    </ul>
                    
                    <p><strong>¿NO fuiste tú?</strong></p>
                    <ul>
                        <li>Si no intentaste iniciar sesión, es posible que alguien esté intentando acceder a tu cuenta.</li>
                        <li><strong>Recomendamos cambiar tu contraseña inmediatamente</strong> cuando se desbloquee tu cuenta.</li>
                        <li>Considera activar la autenticación de dos factores (2FA) para mayor seguridad.</li>
                    </ul>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            Si necesitas ayuda o crees que hay un problema, contacta a nuestro equipo de soporte.
                        </p>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        Equipo de Seguridad de UplinHR<br>
                        Este es un email automático, por favor no responder.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    });
    
    if (error) {
      logger.error('Error sending account locked email:', error);
    } else {
      logger.info(`Account locked email sent to ${email}`);
    }
  } catch (error) {
    logger.error('Error in sendAccountLockedEmail:', error);
  }
}

/**
 * Registra evento de seguridad (si tienes la tabla security_events)
 */
async function logSecurityEvent({ userId, eventType, severity, ipAddress, userAgent = null, description = null }) {
  try {
    await pool.query(
      `INSERT INTO security_events 
       (id_usuario, event_type, severity, ip_address, user_agent, description) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, eventType, severity, ipAddress, userAgent, description]
    );
  } catch (error) {
    // Si la tabla no existe todavía, solo loguear
    logger.warn('Could not log security event (table may not exist):', error.message);
  }
}

export default {
  isAccountLocked,
  registerFailedLoginAttempt,
  resetLoginAttempts,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES
};
```

---

## PASO 3: Modificar Controller de Auth

**Archivo:** `src/features/auth/controller.js`

**Modificar la función `login`:**

```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authModel from './model.js';
import { successRes, errorRes } from "../../utils/apiResponse.js";
import { 
  isAccountLocked, 
  registerFailedLoginAttempt, 
  resetLoginAttempts,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES
} from '../../utils/accountSecurity.js';

export const login = async (req, res) => {
  const ipAddress = req.ip;
  const userAgent = req.get('user-agent');
  
  try {
    const { email, contrasenia } = req.body;
    
    // Validar campos requeridos
    if (!email || !contrasenia) {
      return errorRes(res, {
        message: 'Email y contraseña son requeridos',
        statusCode: 400
      });
    }
    
    // Buscar usuario
    const user = await authModel.login(email);
    
    // Hash dummy para prevenir timing attacks
    const dummyHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const passwordToCompare = user ? user.contrasenia : dummyHash;
    
    // SIEMPRE comparar contraseña (timing attack prevention)
    const isMatch = await bcrypt.compare(contrasenia, passwordToCompare);
    
    // Verificar si el usuario existe y está activo
    if (!user || !user.active) {
      // No revelar si el usuario existe o no
      return errorRes(res, {
        message: 'Credenciales inválidas',
        statusCode: 401,
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // ========================================
    // VERIFICAR CUENTA BLOQUEADA
    // ========================================
    const lockStatus = await isAccountLocked(user.id);
    
    if (lockStatus && lockStatus.locked) {
      return errorRes(res, {
        message: `Cuenta bloqueada temporalmente. Intenta nuevamente en ${lockStatus.minutesRemaining} minutos.`,
        statusCode: 423, // 423 Locked
        code: 'ACCOUNT_LOCKED',
        data: {
          lockedUntil: lockStatus.lockedUntil,
          minutesRemaining: lockStatus.minutesRemaining
        }
      });
    }
    
    // ========================================
    // VERIFICAR CONTRASEÑA
    // ========================================
    if (!isMatch) {
      // Registrar intento fallido
      const attemptResult = await registerFailedLoginAttempt(user.id, ipAddress, userAgent);
      
      if (attemptResult.locked) {
        // Cuenta recién bloqueada
        return errorRes(res, {
          message: `Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por ${LOCKOUT_DURATION_MINUTES} minutos.`,
          statusCode: 423,
          code: 'ACCOUNT_LOCKED',
          data: {
            lockedUntil: attemptResult.lockedUntil
          }
        });
      }
      
      // Advertencia si está cerca del límite
      if (attemptResult.warning) {
        return errorRes(res, {
          message: `Contraseña incorrecta. Te quedan ${attemptResult.remainingAttempts} intentos antes de que tu cuenta sea bloqueada.`,
          statusCode: 401,
          code: 'INVALID_PASSWORD_WARNING',
          data: {
            remainingAttempts: attemptResult.remainingAttempts
          }
        });
      }
      
      // Error genérico
      return errorRes(res, {
        message: 'Credenciales inválidas',
        statusCode: 401,
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // ========================================
    // LOGIN EXITOSO
    // ========================================
    
    // Resetear intentos fallidos
    await resetLoginAttempts(user.id, ipAddress);
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Configurar cookie segura
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hora
    });
    
    // Eliminar contraseña de la respuesta
    delete user.contrasenia;
    
    successRes(res, {
      data: { user, token },
      message: 'Sesión iniciada exitosamente',
      statusCode: 200
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    
    // No revelar detalles del error al usuario
    errorRes(res, {
      message: 'Error al iniciar sesión',
      statusCode: 500,
      code: 'INTERNAL_ERROR'
    });
  }
};
```

---

## PASO 4: Endpoint para Desbloquear Cuenta (Admin)

**Agregar a `src/features/auth/controller.js`:**

```javascript
/**
 * Desbloquea manualmente una cuenta (Solo Admin)
 */
export const unlockAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar que el usuario que ejecuta sea admin
    if (req.user.rol !== 'admin') {
      return errorRes(res, {
        message: 'No autorizado',
        statusCode: 403
      });
    }
    
    // Desbloquear cuenta
    await pool.query(
      `UPDATE usuarios 
       SET locked_until = NULL, login_attempts = 0 
       WHERE id = ?`,
      [userId]
    );
    
    // Registrar evento
    await logSecurityEvent({
      userId: userId,
      eventType: 'account_unlocked',
      severity: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      description: `Cuenta desbloqueada manualmente por admin ${req.user.id}`
    });
    
    successRes(res, {
      message: 'Cuenta desbloqueada exitosamente',
      statusCode: 200
    });
    
  } catch (error) {
    console.error('Error unlocking account:', error);
    errorRes(res, {
      message: 'Error al desbloquear cuenta',
      statusCode: 500
    });
  }
};
```

**Agregar ruta en `src/features/auth/routes.js`:**

```javascript
import { authRequired, checkRole } from '../../middlewares/auth.js';

router.post('/unlock-account/:userId', authRequired, checkRole(['admin']), unlockAccount);
```

---

## PASO 5: Testing

### Test Manual con Postman

1. **Intento fallido de login:**
```json
POST http://localhost:4000/api/auth/login
{
  "email": "test@example.com",
  "contrasenia": "wrong_password"
}
```

**Respuesta esperada (intento 1-2):**
```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "code": "INVALID_CREDENTIALS"
}
```

**Respuesta esperada (intento 3-4):**
```json
{
  "success": false,
  "message": "Contraseña incorrecta. Te quedan 2 intentos antes de que tu cuenta sea bloqueada.",
  "code": "INVALID_PASSWORD_WARNING",
  "data": {
    "remainingAttempts": 2
  }
}
```

**Respuesta esperada (intento 5):**
```json
{
  "success": false,
  "message": "Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por 15 minutos.",
  "code": "ACCOUNT_LOCKED",
  "data": {
    "lockedUntil": "2025-10-16T17:45:00.000Z"
  }
}
```

2. **Verificar en base de datos:**
```sql
SELECT 
  id, 
  email, 
  login_attempts, 
  locked_until, 
  last_login_attempt,
  last_login_ip
FROM usuarios 
WHERE email = 'test@example.com';
```

3. **Desbloquear cuenta (como admin):**
```json
POST http://localhost:4000/api/auth/unlock-account/1
Authorization: Bearer <admin_token>
```

---

## PASO 6: Monitoreo y Logs

### Dashboard de Cuentas Bloqueadas

**Query SQL:**
```sql
-- Ver cuentas actualmente bloqueadas
SELECT 
  id,
  email,
  nombre,
  login_attempts,
  locked_until,
  TIMESTAMPDIFF(MINUTE, NOW(), locked_until) AS minutes_remaining,
  last_login_ip
FROM usuarios
WHERE locked_until IS NOT NULL 
  AND locked_until > NOW()
ORDER BY locked_until DESC;
```

### Ver Actividad Sospechosa

```sql
-- Usuarios con muchos intentos fallidos en últimas 24 horas
SELECT 
  u.id,
  u.email,
  COUNT(*) as failed_attempts,
  MAX(se.created_at) as last_attempt,
  GROUP_CONCAT(DISTINCT se.ip_address) as ip_addresses
FROM security_events se
JOIN usuarios u ON se.id_usuario = u.id
WHERE se.event_type = 'login_failed'
  AND se.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY u.id, u.email
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;
```

---

## CONSIDERACIONES ADICIONALES

### 1. **Configuración Dinámica**
En lugar de constantes hardcodeadas, leer de `security_config`:

```javascript
async function getSecurityConfig(key, defaultValue) {
  const [rows] = await pool.query(
    'SELECT config_value FROM security_config WHERE config_key = ?',
    [key]
  );
  return rows[0] ? rows[0].config_value : defaultValue;
}

const MAX_LOGIN_ATTEMPTS = await getSecurityConfig('max_login_attempts', 5);
```

### 2. **Limpieza Automática**
Los bloqueos se limpian automáticamente al verificar el estado, pero considera un cron job:

```javascript
// scripts/cleanup-expired-locks.js
import cron from 'node-cron';
import pool from '../src/database/database.js';

cron.schedule('*/5 * * * *', async () => {
  // Cada 5 minutos
  await pool.query(
    'UPDATE usuarios SET locked_until = NULL, login_attempts = 0 WHERE locked_until < NOW()'
  );
});
```

### 3. **Rate Limiting Complementario**
El account lockout complementa el rate limiting por IP, no lo reemplaza.

### 4. **Alertas Administrativas**
Enviar email/Slack/Telegram a admins cuando hay múltiples bloqueos:

```javascript
if (lockedAccountsToday > 10) {
  await sendAdminAlert('Unusual number of account lockouts today');
}
```

---

## RESUMEN

✅ **Implementado:**
- Contador de intentos fallidos
- Bloqueo temporal automático
- Desbloqueo automático por tiempo
- Desbloqueo manual por admin
- Emails de notificación
- Logs de seguridad
- Respuestas que no revelan información

🎯 **Resultado:** Protección efectiva contra ataques de fuerza bruta por cuenta individual.
