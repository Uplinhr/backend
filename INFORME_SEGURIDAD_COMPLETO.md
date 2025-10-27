# 🔐 INFORME DE SEGURIDAD Y AUTENTICACIÓN
## Plataforma de Pagos UplinHR

**Fecha:** 2025-10-16  
**Versión:** 1.0

---

## RESUMEN EJECUTIVO

Tu plataforma tiene **bases sólidas de seguridad** pero requiere **mejoras críticas** antes de producción con pagos reales. Se identificaron **5 vulnerabilidades críticas** y **14 mejoras de alta prioridad**.

**Estado General:** 🟡 **MEDIO-ALTO** (65/100)

---

## 1. TABLAS DE AUTENTICACIÓN

### Tabla `usuarios`
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    num_celular VARCHAR(20) NULL,
    rol ENUM('cliente', 'admin') DEFAULT 'cliente'
);
```

**✅ Fortalezas:**
- Contraseña hasheada con bcrypt (salt rounds: 10)
- Email único
- Sistema de roles
- Motor InnoDB (ACID)

**❌ CAMPOS FALTANTES CRÍTICOS:**
- `login_attempts` - Contador de intentos fallidos
- `locked_until` - Timestamp de bloqueo temporal
- `email_verified` - Bandera de email verificado
- `last_login_at` - Última sesión exitosa
- `password_changed_at` - Último cambio de contraseña
- `two_factor_enabled` - Habilitación de 2FA
- `two_factor_secret` - Secreto TOTP encriptado

### Tabla `reinicio_contrasenia`
```sql
CREATE TABLE reinicio_contrasenia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_exp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NULL
);
```

**✅ Fortalezas:**
- Token de un solo uso
- Expiración implementada
- Tokens criptográficamente seguros (32 bytes)

**❌ MEJORAS NECESARIAS:**
- Agregar índice en `token` (búsquedas lentas)
- Agregar campo `ip_address`
- Implementar limpieza automática

### Tablas de Pagos

#### `payment_orders` ✅ EXCELENTE
- Estados bien definidos
- Información fiscal completa
- Tracking de fechas críticas

#### `payment_transactions` ✅ MUY BUENO
- Captura de IP y User-Agent
- Estados detallados
- Gateway response en JSON

#### `payment_audit_log` ⭐ EXCEPCIONAL
- Auditoría completa
- Old/new values
- Tracking de actor

#### `webhook_events` ✅ ROBUSTO
- Validación de firma
- Control de procesamiento
- Payload completo

---

## 2. MEDIDAS DE SEGURIDAD IMPLEMENTADAS

### ✅ Autenticación
| Medida | Estado | Calificación |
|--------|--------|--------------|
| Bcrypt para contraseñas | ✅ | A+ |
| JWT con expiración | ✅ | A |
| Middleware de auth robusto | ✅ | A+ |
| Verificación de usuario activo | ✅ | A |
| Múltiples fuentes de token | ✅ | B+ |
| Cookies HttpOnly | ✅ | B |

### ✅ Protección de Aplicación
| Medida | Estado | Calificación |
|--------|--------|--------------|
| Helmet (headers seguros) | ✅ | A |
| HPP (parameter pollution) | ✅ | A |
| Sanitización NoSQL injection | ✅ | A |
| CORS configurado | ✅ | B+ |

### ✅ Rate Limiting
| Endpoint | Límite | Calificación |
|----------|--------|--------------|
| API General | 100/15min | A |
| Login | **5/15min** | A+ ⭐ |
| Pagos | 10/15min | A |
| Webhooks | 100/min | A |

### ✅ Encriptación
**AES-256-GCM con PBKDF2**
- 100,000 iteraciones ⭐
- Salt único por encriptación
- IV aleatorio
- Tag de autenticación
- **Calificación: A+ (Nivel empresarial)**

### ✅ Logging & Auditoría
- Winston con rotación diaria
- Logger específico para pagos
- Logs de autenticación completos
- Captura de contexto (IP, UA, timestamps)
- **Calificación: A**

---

## 3. VULNERABILIDADES CRÍTICAS

### 🔴 V-001: Account Enumeration
**Severidad:** CRÍTICA  
**Riesgo:** Alto

**Problema actual:**
```javascript
// ❌ Respuestas diferentes revelan si usuario existe
if (!user) return errorRes(res, {message: 'Usuario no encontrado'});
if (!isMatch) return errorRes(res, {message: 'Contraseña incorrecta'});
```

**Solución:** Respuesta genérica única

---

### 🔴 V-002: Sin Account Lockout
**Severidad:** CRÍTICA  
**Riesgo:** Brute force por cuenta

**Problema:**
- Rate limit por IP (evadible con proxies)
- Sin contador de intentos por usuario
- Sin bloqueo temporal de cuenta

**Solución:** Implementar tabla de intentos y bloqueo

---

### 🔴 V-003: Sin Verificación de Email
**Severidad:** CRÍTICA  
**Riesgo:** Spam, cuentas falsas

**Problema:**
- Cualquiera puede registrarse con cualquier email
- No hay confirmación de propiedad del email

**Solución:** Flujo de verificación con token

---

### 🔴 V-004: Sin Refresh Tokens
**Severidad:** ALTA  
**Riesgo:** UX pobre + seguridad comprometida

**Problema:**
- Sesiones de solo 1 hora
- Sin mecanismo de renovación
- Cookie sin `sameSite`

**Solución:** Implementar refresh tokens

---

### 🔴 V-005: Contraseñas Débiles Permitidas
**Severidad:** CRÍTICA  
**Riesgo:** Cuentas fáciles de comprometer

**Problema:**
```javascript
// ❌ Sin validación de complejidad
const hashedPassword = await bcrypt.hash(contrasenia, 10);
```

**Solución:** Validación con Joi/regex

---

## 4. RECOMENDACIONES PRIORITARIAS

### 🔴 CRÍTICAS (Implementar ANTES de producción)

#### 1️⃣ Account Lockout (1-2 días)
```sql
ALTER TABLE usuarios 
ADD COLUMN login_attempts INT DEFAULT 0,
ADD COLUMN locked_until TIMESTAMP NULL,
ADD COLUMN last_login_attempt TIMESTAMP NULL,
ADD INDEX idx_locked_until (locked_until);
```

#### 2️⃣ Email Verification (2-3 días)
```sql
CREATE TABLE email_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token VARCHAR(200) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  INDEX idx_token (token)
);

ALTER TABLE usuarios ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
```

#### 3️⃣ Password Policy (1 día)
```javascript
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .required();
```

#### 4️⃣ Refresh Tokens (3-4 días)
```sql
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  INDEX idx_token (token)
);
```

#### 5️⃣ Fix Account Enumeration (1 día)
```javascript
// ✅ Respuesta única para todos los casos
if (!user || !isMatch || !user.active) {
  return errorRes(res, {
    message: 'Credenciales inválidas',
    statusCode: 401
  });
}
```

---

### 🟡 ALTAS (1-2 semanas después)

#### 6️⃣ 2FA (TOTP) (3-5 días)
- Librería: `speakeasy` + `qrcode`
- Google Authenticator compatible
- Códigos de backup

#### 7️⃣ Limpieza Automática (2 días)
- Cron job para tokens expirados
- Archivo de audit logs viejos
- Limpieza de webhooks procesados

#### 8️⃣ Notificaciones de Seguridad (2-3 días)
- Email en cambio de contraseña
- Email en login desde nueva IP
- Email en activación de 2FA

#### 9️⃣ Session Management (2 días)
- Tracking de sesiones activas
- Cerrar sesiones remotamente
- Límite de sesiones simultáneas

---

### 🟢 MEJORAS GRADUALES

#### 🔟 Geolocalización de Login
- Detectar logins desde países inusuales
- Alert en cambio de ubicación

#### 1️⃣1️⃣ Password History
- Evitar reutilización de últimas 5 contraseñas
- Forzar cambio periódico (opcional)

#### 1️⃣2️⃣ Device Fingerprinting
- Identificar dispositivos conocidos
- Alert en nuevo dispositivo

#### 1️⃣3️⃣ CAPTCHA en Login
- Después de 2-3 intentos fallidos
- Protección adicional anti-bot

---

## 5. IMPLEMENTACIONES PARA PAYONEER

### Consideraciones Específicas

**Payoneer requiere:**
1. ✅ Validación de webhook robusta (YA IMPLEMENTADO)
2. ✅ Encriptación de datos sensibles (YA IMPLEMENTADO)
3. ✅ Audit logging completo (YA IMPLEMENTADO)
4. ⚠️ PCI DSS compliance (SI ALMACENAS TARJETAS)
5. ⚠️ KYC/AML verification (Según tu modelo)

### Estructura Sugerida

```sql
CREATE TABLE payoneer_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  payoneer_account_id VARCHAR(255) NOT NULL,
  account_status ENUM('pending', 'verified', 'suspended') DEFAULT 'pending',
  kyc_verified BOOLEAN DEFAULT FALSE,
  encrypted_credentials TEXT,
  last_sync_at TIMESTAMP NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);
```

### API Integration Pattern
```javascript
class PayoneerService {
  constructor() {
    this.apiUrl = process.env.PAYONEER_API_URL;
    this.clientId = process.env.PAYONEER_CLIENT_ID;
    this.clientSecret = process.env.PAYONEER_CLIENT_SECRET;
  }
  
  async createPayment(orderData) {
    // Usar las utilidades de encriptación existentes
    const encryptedData = encrypt(JSON.stringify(orderData));
    
    // Log de auditoría
    await AuditModel.logEvent({
      event_type: 'payoneer_payment_initiated',
      id_usuario: orderData.userId,
      metadata: { orderId: orderData.orderId }
    });
    
    // Llamada API
    const response = await this.callPayoneerAPI('/payments', {
      encrypted_data: encryptedData
    });
    
    return response;
  }
}
```

---

## 6. PLAN DE ACCIÓN SUGERIDO

### Fase 1: CRÍTICO (Semana 1-2)
- [ ] Day 1-2: Account Lockout
- [ ] Day 3-4: Password Policy
- [ ] Day 5-6: Fix Account Enumeration
- [ ] Day 7-10: Email Verification
- [ ] Day 11-14: Refresh Tokens

### Fase 2: ALTO (Semana 3-4)
- [ ] 2FA Implementation
- [ ] Security Notifications
- [ ] Automated Cleanup
- [ ] Session Management

### Fase 3: MEJORAS (Semana 5-6)
- [ ] Geolocation
- [ ] Device Fingerprinting
- [ ] Password History
- [ ] CAPTCHA Integration

### Fase 4: PAYONEER (Semana 7-8)
- [ ] Payoneer SDK Integration
- [ ] KYC Flow (si aplica)
- [ ] Testing en Sandbox
- [ ] Production Deploy

---

## 7. CHECKLIST DE SEGURIDAD PRE-PRODUCCIÓN

### Autenticación
- [ ] Account lockout implementado
- [ ] Email verification obligatorio
- [ ] Password policy fuerte
- [ ] Refresh tokens funcionando
- [ ] 2FA disponible (opcional para usuarios)
- [ ] Anti-enumeration implementado

### Datos
- [ ] Variables de entorno seguras
- [ ] ENCRYPTION_KEY rotada y segura (32+ chars)
- [ ] JWT_SECRET y JWT_REFRESH_SECRET diferentes
- [ ] WEBHOOK_SECRET único por gateway
- [ ] Backups automáticos de BD
- [ ] Datos sensibles encriptados

### Infraestructura
- [ ] HTTPS habilitado (certificado SSL válido)
- [ ] Firewall configurado
- [ ] Rate limiting en producción
- [ ] Logs centralizados
- [ ] Monitoring/Alerting configurado
- [ ] CORS restrictivo (solo dominios permitidos)

### Compliance
- [ ] Política de privacidad actualizada
- [ ] Términos y condiciones
- [ ] GDPR compliance (si aplica UE)
- [ ] PCI DSS (si almacenas tarjetas)
- [ ] Auditoría de seguridad externa

### Testing
- [ ] Penetration testing
- [ ] Load testing
- [ ] Security scanning (OWASP ZAP)
- [ ] Dependency audit (`npm audit`)

---

## 8. MÉTRICAS DE SEGURIDAD SUGERIDAS

### Monitorear en Producción
```javascript
// Dashboard de seguridad
{
  "failed_login_attempts_24h": 0,
  "locked_accounts": 0,
  "suspicious_ips": [],
  "2fa_adoption_rate": "0%",
  "password_reset_requests_24h": 0,
  "webhook_validation_failures": 0,
  "rate_limit_hits": 0
}
```

### Alertas Automáticas
- ⚠️ Más de 10 intentos fallidos desde misma IP
- ⚠️ Más de 5 cuentas bloqueadas en 1 hora
- ⚠️ Webhook con firma inválida
- ⚠️ Transacción mayor a $10,000
- ⚠️ Login desde país bloqueado

---

## CONCLUSIÓN

Tu plataforma tiene **fundamentos sólidos** con:
- ✅ Encriptación de nivel empresarial
- ✅ Audit logging completo
- ✅ Rate limiting bien implementado
- ✅ Arquitectura de pagos robusta

Pero requiere **5 implementaciones críticas** antes de producción:
1. Account Lockout
2. Email Verification
3. Password Policy
4. Refresh Tokens
5. Fix Account Enumeration

**Tiempo estimado:** 2-3 semanas de desarrollo para estar production-ready.

**Recomendación:** Implementar Fase 1 COMPLETA antes de procesar pagos reales.

---

**Documentos Adicionales Generados:**
- `IMPLEMENTACION_ACCOUNT_LOCKOUT.md` - Guía paso a paso
- `IMPLEMENTACION_2FA.md` - Código completo para 2FA
- `SCRIPT_MIGRACIONES_SEGURIDAD.sql` - Todas las migraciones SQL
