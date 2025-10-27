# 🔐 GUÍA DE IMPLEMENTACIÓN: 2FA (Two-Factor Authentication)

## Objetivo
Implementar autenticación de dos factores usando TOTP (Time-based One-Time Password) compatible con Google Authenticator, Microsoft Authenticator, etc.

---

## PASO 1: Instalar Dependencias

```bash
npm install speakeasy qrcode
```

**Librerías:**
- `speakeasy` - Generación y verificación de códigos TOTP
- `qrcode` - Generación de códigos QR para apps de autenticación

---

## PASO 2: Ejecutar Migraciones

```sql
ALTER TABLE usuarios 
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_secret VARCHAR(255) NULL,
ADD COLUMN two_factor_backup_codes TEXT NULL;

CREATE TABLE IF NOT EXISTS two_factor_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    action ENUM('enabled', 'disabled', 'code_verified', 'code_failed', 'backup_used') NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (id_usuario),
    INDEX idx_action (action)
) ENGINE=InnoDB;
```

---

## PASO 3: Crear Service de 2FA

**Archivo:** `src/services/twoFactor.service.js`

```javascript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import pool from '../database/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import logger from '../config/logger.config.js';

class TwoFactorService {
  /**
   * Genera un secreto 2FA para el usuario
   */
  async generateSecret(userId, email) {
    try {
      const secret = speakeasy.generateSecret({
        name: `UplinHR (${email})`,
        issuer: 'UplinHR',
        length: 32
      });
      
      // Generar QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        otpauthUrl: secret.otpauth_url
      };
    } catch (error) {
      logger.error('Error generating 2FA secret:', error);
      throw error;
    }
  }
  
  /**
   * Verifica un código TOTP
   */
  verifyToken(secret, token) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Tolerancia de 60 segundos (2 * 30s)
      });
      
      return verified;
    } catch (error) {
      logger.error('Error verifying 2FA token:', error);
      return false;
    }
  }
  
  /**
   * Genera códigos de backup
   */
  generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generar código de 8 dígitos
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
  
  /**
   * Activa 2FA para un usuario
   */
  async enable2FA(userId, secret, backupCodes) {
    try {
      // Encriptar el secreto y los códigos de backup
      const encryptedSecret = encrypt(secret);
      const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));
      
      await pool.query(
        `UPDATE usuarios 
         SET two_factor_enabled = TRUE,
             two_factor_secret = ?,
             two_factor_backup_codes = ?
         WHERE id = ?`,
        [encryptedSecret, encryptedBackupCodes, userId]
      );
      
      // Log del evento
      await this.log2FAEvent(userId, 'enabled', null);
      
      logger.info(`2FA enabled for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Desactiva 2FA para un usuario
   */
  async disable2FA(userId) {
    try {
      await pool.query(
        `UPDATE usuarios 
         SET two_factor_enabled = FALSE,
             two_factor_secret = NULL,
             two_factor_backup_codes = NULL
         WHERE id = ?`,
        [userId]
      );
      
      await this.log2FAEvent(userId, 'disabled', null);
      
      logger.info(`2FA disabled for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el secreto 2FA de un usuario (desencriptado)
   */
  async getSecret(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT two_factor_secret FROM usuarios WHERE id = ?',
        [userId]
      );
      
      if (!rows[0] || !rows[0].two_factor_secret) {
        return null;
      }
      
      return decrypt(rows[0].two_factor_secret);
    } catch (error) {
      logger.error('Error getting 2FA secret:', error);
      throw error;
    }
  }
  
  /**
   * Verifica un código de backup
   */
  async verifyBackupCode(userId, code) {
    try {
      const [rows] = await pool.query(
        'SELECT two_factor_backup_codes FROM usuarios WHERE id = ?',
        [userId]
      );
      
      if (!rows[0] || !rows[0].two_factor_backup_codes) {
        return false;
      }
      
      // Desencriptar códigos
      const backupCodes = JSON.parse(decrypt(rows[0].two_factor_backup_codes));
      
      // Verificar si el código existe
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      if (codeIndex === -1) {
        return false;
      }
      
      // Remover el código usado
      backupCodes.splice(codeIndex, 1);
      
      // Actualizar en BD
      const encryptedCodes = encrypt(JSON.stringify(backupCodes));
      await pool.query(
        'UPDATE usuarios SET two_factor_backup_codes = ? WHERE id = ?',
        [encryptedCodes, userId]
      );
      
      await this.log2FAEvent(userId, 'backup_used', null);
      
      logger.info(`Backup code used for user ${userId}. Remaining: ${backupCodes.length}`);
      return true;
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      return false;
    }
  }
  
  /**
   * Registra evento de 2FA
   */
  async log2FAEvent(userId, action, ipAddress, userAgent = null, metadata = null) {
    try {
      await pool.query(
        `INSERT INTO two_factor_logs 
         (id_usuario, action, ip_address, user_agent, metadata) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, action, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null]
      );
    } catch (error) {
      logger.error('Error logging 2FA event:', error);
    }
  }
}

export default new TwoFactorService();
```

---

## PASO 4: Crear Controller de 2FA

**Archivo:** `src/features/auth/twoFactor.controller.js`

```javascript
import twoFactorService from '../../services/twoFactor.service.js';
import { successRes, errorRes } from '../../utils/apiResponse.js';
import jwt from 'jsonwebtoken';

/**
 * PASO 1: Generar QR code para configurar 2FA
 */
export const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    
    // Verificar que no tenga 2FA ya activo
    if (req.user.two_factor_enabled) {
      return errorRes(res, {
        message: '2FA ya está activado. Desactívalo primero si quieres reconfigurarlo.',
        statusCode: 400
      });
    }
    
    // Generar secreto y QR
    const { secret, qrCode, otpauthUrl } = await twoFactorService.generateSecret(userId, email);
    
    // Guardar temporalmente en sesión o BD (tabla temporal)
    // Por ahora lo retornamos para que el frontend lo maneje
    
    successRes(res, {
      data: {
        secret: secret, // Para entrada manual
        qrCode: qrCode,
        otpauthUrl: otpauthUrl
      },
      message: 'Escanea el código QR con tu app de autenticación',
      statusCode: 200
    });
  } catch (error) {
    console.error('Error en setup2FA:', error);
    errorRes(res, {
      message: 'Error al configurar 2FA',
      statusCode: 500
    });
  }
};

/**
 * PASO 2: Verificar código y activar 2FA
 */
export const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { secret, token } = req.body;
    
    if (!secret || !token) {
      return errorRes(res, {
        message: 'Secreto y código son requeridos',
        statusCode: 400
      });
    }
    
    // Verificar el código TOTP
    const verified = twoFactorService.verifyToken(secret, token);
    
    if (!verified) {
      return errorRes(res, {
        message: 'Código inválido. Intenta nuevamente.',
        statusCode: 400
      });
    }
    
    // Generar códigos de backup
    const backupCodes = twoFactorService.generateBackupCodes(8);
    
    // Activar 2FA
    await twoFactorService.enable2FA(userId, secret, backupCodes);
    
    successRes(res, {
      data: {
        backupCodes: backupCodes,
        message: '⚠️ IMPORTANTE: Guarda estos códigos en un lugar seguro. Solo se mostrarán una vez.'
      },
      message: '2FA activado exitosamente',
      statusCode: 200
    });
  } catch (error) {
    console.error('Error en enable2FA:', error);
    errorRes(res, {
      message: 'Error al activar 2FA',
      statusCode: 500
    });
  }
};

/**
 * Desactivar 2FA
 */
export const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, token } = req.body;
    
    // Requerir contraseña Y código 2FA para desactivar
    if (!password || !token) {
      return errorRes(res, {
        message: 'Contraseña y código 2FA son requeridos',
        statusCode: 400
      });
    }
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, req.user.contrasenia);
    if (!isMatch) {
      return errorRes(res, {
        message: 'Contraseña incorrecta',
        statusCode: 401
      });
    }
    
    // Verificar código 2FA
    const secret = await twoFactorService.getSecret(userId);
    const verified = twoFactorService.verifyToken(secret, token);
    
    if (!verified) {
      return errorRes(res, {
        message: 'Código 2FA inválido',
        statusCode: 400
      });
    }
    
    // Desactivar 2FA
    await twoFactorService.disable2FA(userId);
    
    successRes(res, {
      message: '2FA desactivado exitosamente',
      statusCode: 200
    });
  } catch (error) {
    console.error('Error en disable2FA:', error);
    errorRes(res, {
      message: 'Error al desactivar 2FA',
      statusCode: 500
    });
  }
};

/**
 * Verificar código 2FA durante login
 */
export const verify2FALogin = async (req, res) => {
  try {
    const { tempToken, code, isBackupCode } = req.body;
    
    if (!tempToken || !code) {
      return errorRes(res, {
        message: 'Token temporal y código son requeridos',
        statusCode: 400
      });
    }
    
    // Verificar token temporal
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return errorRes(res, {
        message: 'Token temporal inválido o expirado',
        statusCode: 401
      });
    }
    
    if (!decoded.pending2FA) {
      return errorRes(res, {
        message: 'Token inválido',
        statusCode: 401
      });
    }
    
    const userId = decoded.id;
    let verified = false;
    
    // Verificar código de backup o código TOTP
    if (isBackupCode) {
      verified = await twoFactorService.verifyBackupCode(userId, code);
      if (verified) {
        await twoFactorService.log2FAEvent(userId, 'backup_used', req.ip, req.get('user-agent'));
      }
    } else {
      const secret = await twoFactorService.getSecret(userId);
      verified = twoFactorService.verifyToken(secret, code);
      
      if (verified) {
        await twoFactorService.log2FAEvent(userId, 'code_verified', req.ip, req.get('user-agent'));
      } else {
        await twoFactorService.log2FAEvent(userId, 'code_failed', req.ip, req.get('user-agent'));
      }
    }
    
    if (!verified) {
      return errorRes(res, {
        message: 'Código inválido',
        statusCode: 400
      });
    }
    
    // Generar token final
    const finalToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.cookie('token', finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    });
    
    successRes(res, {
      data: { token: finalToken },
      message: 'Autenticación completada',
      statusCode: 200
    });
  } catch (error) {
    console.error('Error en verify2FALogin:', error);
    errorRes(res, {
      message: 'Error al verificar código 2FA',
      statusCode: 500
    });
  }
};
```

---

## PASO 5: Modificar Login para Soportar 2FA

**En `src/features/auth/controller.js`, modificar `login`:**

```javascript
export const login = async (req, res) => {
  try {
    // ... código de verificación de email/password ...
    
    // Después de verificar contraseña exitosamente
    if (user.two_factor_enabled) {
      // Generar token temporal (pendiente verificación 2FA)
      const tempToken = jwt.sign(
        { id: user.id, pending2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' } // Solo 5 minutos para completar 2FA
      );
      
      return successRes(res, {
        data: {
          requiresTwoFactor: true,
          tempToken: tempToken
        },
        message: 'Ingresa tu código de autenticación',
        statusCode: 200
      });
    }
    
    // Login normal sin 2FA
    // ... resto del código ...
  } catch (error) {
    // ...
  }
};
```

---

## PASO 6: Crear Rutas

**En `src/features/auth/routes.js`:**

```javascript
import { authRequired } from '../../middlewares/auth.js';
import { setup2FA, enable2FA, disable2FA, verify2FALogin } from './twoFactor.controller.js';

// Configuración de 2FA (requiere autenticación)
router.get('/2fa/setup', authRequired, setup2FA);
router.post('/2fa/enable', authRequired, enable2FA);
router.post('/2fa/disable', authRequired, disable2FA);

// Verificación durante login (no requiere autenticación)
router.post('/2fa/verify-login', verify2FALogin);
```

---

## PASO 7: Frontend - Flujo de Activación

### Pantalla de Configuración

```typescript
// React/Next.js component
const Setup2FA = () => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  
  const initiate2FA = async () => {
    const response = await fetch('/api/auth/2fa/setup', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setQrCode(data.data.qrCode);
    setSecret(data.data.secret);
  };
  
  const verify2FA = async () => {
    const response = await fetch('/api/auth/2fa/enable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ secret, token: verificationCode })
    });
    
    if (response.ok) {
      const data = await response.json();
      setBackupCodes(data.data.backupCodes);
      // Mostrar códigos de backup para que el usuario los guarde
    }
  };
  
  return (
    <div>
      <h2>Configurar Autenticación de Dos Factores</h2>
      {!qrCode ? (
        <button onClick={initiate2FA}>Activar 2FA</button>
      ) : (
        <>
          <img src={qrCode} alt="QR Code" />
          <p>Código manual: {secret}</p>
          <input 
            type="text" 
            placeholder="Ingresa el código de 6 dígitos"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={verify2FA}>Verificar y Activar</button>
        </>
      )}
      
      {backupCodes.length > 0 && (
        <div className="backup-codes">
          <h3>⚠️ Códigos de Respaldo</h3>
          <p>Guarda estos códigos en un lugar seguro. Solo se mostrarán una vez.</p>
          <ul>
            {backupCodes.map(code => <li key={code}>{code}</li>)}
          </ul>
          <button onClick={() => {
            navigator.clipboard.writeText(backupCodes.join('\n'));
          }}>
            Copiar Códigos
          </button>
        </div>
      )}
    </div>
  );
};
```

### Pantalla de Login con 2FA

```typescript
const LoginWith2FA = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  const handleLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.data.requiresTwoFactor) {
      setRequires2FA(true);
      setTempToken(data.data.tempToken);
    } else {
      // Login exitoso sin 2FA
      localStorage.setItem('token', data.data.token);
      router.push('/dashboard');
    }
  };
  
  const verify2FA = async () => {
    const response = await fetch('/api/auth/2fa/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempToken,
        code: code2FA,
        isBackupCode: useBackupCode
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.data.token);
      router.push('/dashboard');
    } else {
      alert('Código inválido');
    }
  };
  
  if (!requires2FA) {
    return (
      <div>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Iniciar Sesión</button>
      </div>
    );
  }
  
  return (
    <div>
      <h2>Verificación de Dos Factores</h2>
      <input 
        type="text" 
        placeholder={useBackupCode ? "Código de respaldo" : "Código de 6 dígitos"}
        value={code2FA}
        onChange={e => setCode2FA(e.target.value)}
      />
      <button onClick={verify2FA}>Verificar</button>
      <button onClick={() => setUseBackupCode(!useBackupCode)}>
        {useBackupCode ? 'Usar código de app' : 'Usar código de respaldo'}
      </button>
    </div>
  );
};
```

---

## PASO 8: Testing

### Test 1: Configurar 2FA
```bash
# 1. Setup (obtener QR)
GET http://localhost:4000/api/auth/2fa/setup
Authorization: Bearer <token>

# 2. Escanear QR con Google Authenticator

# 3. Verificar código
POST http://localhost:4000/api/auth/2fa/enable
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

### Test 2: Login con 2FA
```bash
# 1. Login normal
POST http://localhost:4000/api/auth/login
{
  "email": "test@example.com",
  "contrasenia": "password123"
}

# Respuesta:
{
  "requiresTwoFactor": true,
  "tempToken": "eyJhbGci..."
}

# 2. Verificar 2FA
POST http://localhost:4000/api/auth/2fa/verify-login
{
  "tempToken": "eyJhbGci...",
  "code": "123456",
  "isBackupCode": false
}
```

---

## MEJORES PRÁCTICAS

### 1. **Recovery Options**
- Siempre generar códigos de backup
- Permitir desactivar 2FA con verificación de email si pierde dispositivo
- Considerar múltiples métodos (SMS, email) como respaldo

### 2. **UX**
- Mostrar códigos de backup SOLO UNA VEZ
- Permitir descargar códigos de backup como PDF
- Opción "Recordar este dispositivo por 30 días"

### 3. **Seguridad**
- Secretos siempre encriptados en BD
- Logs de todos los eventos 2FA
- Rate limiting en verificación de códigos
- Alertar al usuario cuando se activa/desactiva 2FA

### 4. **Soporte**
- Proceso de recuperación para usuarios que pierden acceso
- Soporte admin para desactivar 2FA en casos excepcionales

---

## RESUMEN

✅ **Implementado:**
- TOTP compatible con Google Authenticator
- Códigos de backup
- Logs de actividad 2FA
- Encriptación de secretos
- Flujo completo de setup y login

🎯 **Resultado:** Autenticación robusta de dos factores para proteger cuentas, especialmente crítico en plataforma de pagos.
