-- =====================================================
-- MIGRACIONES DE SEGURIDAD
-- Fecha: 2025-10-16
-- Descripción: Scripts SQL para mejoras críticas de seguridad
-- =====================================================

-- =====================================================
-- 1. ACCOUNT LOCKOUT (CRÍTICO)
-- =====================================================

ALTER TABLE usuarios 
ADD COLUMN login_attempts INT DEFAULT 0 COMMENT 'Contador de intentos fallidos',
ADD COLUMN locked_until TIMESTAMP NULL COMMENT 'Timestamp hasta cuando está bloqueada la cuenta',
ADD COLUMN last_login_attempt TIMESTAMP NULL COMMENT 'Último intento de login (exitoso o fallido)',
ADD COLUMN last_login_success TIMESTAMP NULL COMMENT 'Último login exitoso',
ADD COLUMN last_login_ip VARCHAR(45) NULL COMMENT 'IP del último login';

-- Índices para mejorar rendimiento
CREATE INDEX idx_locked_until ON usuarios(locked_until);
CREATE INDEX idx_email_active ON usuarios(email, active);

-- =====================================================
-- 2. EMAIL VERIFICATION (CRÍTICO)
-- =====================================================

-- Agregar campo a usuarios
ALTER TABLE usuarios 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE COMMENT 'Indica si el email fue verificado';

-- Crear tabla de tokens de verificación
CREATE TABLE IF NOT EXISTS email_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(200) NOT NULL UNIQUE COMMENT 'Token de verificación único',
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL COMMENT 'Fecha de verificación exitosa',
    ip_address VARCHAR(45) NULL,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    INDEX idx_token (token),
    INDEX idx_expires (expires_at),
    INDEX idx_usuario (id_usuario)
) ENGINE=InnoDB COMMENT='Tokens de verificación de email';

-- =====================================================
-- 3. REFRESH TOKENS (CRÍTICO)
-- =====================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE COMMENT 'Refresh token JWT',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE COMMENT 'Token revocado',
    revoked_at TIMESTAMP NULL,
    replaced_by_token VARCHAR(500) NULL COMMENT 'Token que reemplazó a este (rotation)',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    INDEX idx_token (token),
    INDEX idx_usuario (id_usuario),
    INDEX idx_expires (expires_at),
    INDEX idx_revoked (revoked)
) ENGINE=InnoDB COMMENT='Refresh tokens para renovación de sesión';

-- =====================================================
-- 4. TWO-FACTOR AUTHENTICATION (ALTO)
-- =====================================================

ALTER TABLE usuarios 
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE COMMENT '2FA habilitado',
ADD COLUMN two_factor_secret VARCHAR(255) NULL COMMENT 'Secreto TOTP encriptado',
ADD COLUMN two_factor_backup_codes TEXT NULL COMMENT 'Códigos de backup encriptados (JSON)';

-- Tabla de logs de 2FA
CREATE TABLE IF NOT EXISTS two_factor_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    action ENUM('enabled', 'disabled', 'code_verified', 'code_failed', 'backup_used') NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON NULL,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    
    INDEX idx_usuario (id_usuario),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='Logs de actividad 2FA';

-- =====================================================
-- 5. PASSWORD HISTORY (ALTO)
-- =====================================================

CREATE TABLE IF NOT EXISTS password_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash de contraseña anterior',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    
    INDEX idx_usuario (id_usuario),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='Historial de contraseñas para evitar reutilización';

-- =====================================================
-- 6. SECURITY EVENTS LOG (ALTO)
-- =====================================================

CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL,
    event_type ENUM(
        'login_success', 
        'login_failed', 
        'account_locked', 
        'account_unlocked',
        'password_changed', 
        'password_reset_requested',
        'password_reset_completed',
        'email_verified',
        '2fa_enabled',
        '2fa_disabled',
        'suspicious_activity'
    ) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    metadata JSON NULL COMMENT 'Datos adicionales del evento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL,
    
    INDEX idx_usuario (id_usuario),
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_created (created_at),
    INDEX idx_ip (ip_address)
) ENGINE=InnoDB COMMENT='Log de eventos de seguridad';

-- =====================================================
-- 7. TRUSTED DEVICES (MEDIO)
-- =====================================================

CREATE TABLE IF NOT EXISTS trusted_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL COMMENT 'Hash del device fingerprint',
    device_name VARCHAR(100) NULL COMMENT 'Nombre amigable del dispositivo',
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trust_expires_at TIMESTAMP NULL COMMENT 'Expiración de la confianza',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_trusted BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_device (id_usuario, device_fingerprint),
    INDEX idx_fingerprint (device_fingerprint),
    INDEX idx_trusted (is_trusted)
) ENGINE=InnoDB COMMENT='Dispositivos de confianza del usuario';

-- =====================================================
-- 8. MEJORAS A TABLA reinicio_contrasenia
-- =====================================================

-- Agregar índice para búsquedas rápidas
ALTER TABLE reinicio_contrasenia 
ADD INDEX idx_token (token),
ADD INDEX idx_used_exp (used, fecha_exp);

-- Agregar campos adicionales
ALTER TABLE reinicio_contrasenia 
ADD COLUMN ip_address VARCHAR(45) NULL COMMENT 'IP que solicitó el reset',
ADD COLUMN user_agent TEXT NULL,
ADD COLUMN attempts INT DEFAULT 0 COMMENT 'Intentos de uso del token';

-- =====================================================
-- 9. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =====================================================

-- Índices en payment_orders
CREATE INDEX idx_usuario_status ON payment_orders(id_usuario, status);
CREATE INDEX idx_payment_gateway_status ON payment_orders(payment_gateway, status);

-- Índices en payment_transactions
CREATE INDEX idx_usuario_tx ON payment_transactions(id_order, status);
CREATE INDEX idx_created_status ON payment_transactions(fecha_alta, status);

-- =====================================================
-- 10. CONFIGURACIÓN DE SEGURIDAD
-- =====================================================

-- Tabla de configuración de políticas de seguridad
CREATE TABLE IF NOT EXISTS security_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    
    FOREIGN KEY (updated_by) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL,
    
    INDEX idx_key (config_key)
) ENGINE=InnoDB COMMENT='Configuración de políticas de seguridad';

-- Valores por defecto de configuración
INSERT INTO security_config (config_key, config_value, description) VALUES
('max_login_attempts', '5', 'Máximo de intentos de login antes de bloqueo'),
('lockout_duration_minutes', '15', 'Duración del bloqueo en minutos'),
('password_min_length', '8', 'Longitud mínima de contraseña'),
('password_require_uppercase', 'true', 'Requiere mayúsculas'),
('password_require_lowercase', 'true', 'Requiere minúsculas'),
('password_require_numbers', 'true', 'Requiere números'),
('password_require_special', 'true', 'Requiere caracteres especiales'),
('password_history_count', '5', 'Cantidad de contraseñas anteriores a recordar'),
('session_duration_hours', '1', 'Duración de sesión activa'),
('refresh_token_duration_days', '7', 'Duración de refresh token'),
('email_verification_required', 'true', 'Verificación de email obligatoria'),
('2fa_enforced', 'false', '2FA obligatorio para todos'),
('trusted_device_duration_days', '30', 'Duración de confianza de dispositivo');

-- =====================================================
-- 11. LIMPIEZA DE DATOS (Eventos programados)
-- =====================================================

-- Evento para limpiar tokens de reinicio expirados
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_expired_reset_tokens
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM reinicio_contrasenia 
    WHERE fecha_exp < NOW() OR used = TRUE;
END$$

-- Evento para limpiar tokens de verificación expirados
CREATE EVENT IF NOT EXISTS cleanup_expired_verification_tokens
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM email_verification 
    WHERE expires_at < NOW() OR verified_at IS NOT NULL;
END$$

-- Evento para limpiar refresh tokens expirados
CREATE EVENT IF NOT EXISTS cleanup_expired_refresh_tokens
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() OR revoked = TRUE;
END$$

-- Evento para archivar logs de seguridad antiguos (opcional)
CREATE EVENT IF NOT EXISTS archive_old_security_logs
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Eliminar logs de más de 1 año (o mover a tabla de archivo)
    DELETE FROM security_events 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END$$

DELIMITER ;

-- =====================================================
-- 12. VISTAS ÚTILES PARA SEGURIDAD
-- =====================================================

-- Vista de usuarios con información de seguridad
CREATE OR REPLACE VIEW v_user_security AS
SELECT 
    u.id,
    u.email,
    u.active,
    u.email_verified,
    u.login_attempts,
    u.locked_until,
    u.last_login_success,
    u.two_factor_enabled,
    CASE 
        WHEN u.locked_until IS NOT NULL AND u.locked_until > NOW() THEN TRUE
        ELSE FALSE
    END AS is_locked,
    (SELECT COUNT(*) FROM security_events WHERE id_usuario = u.id AND event_type = 'login_failed' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS failed_logins_24h,
    (SELECT COUNT(*) FROM refresh_tokens WHERE id_usuario = u.id AND revoked = FALSE AND expires_at > NOW()) AS active_sessions
FROM usuarios u;

-- Vista de actividad sospechosa
CREATE OR REPLACE VIEW v_suspicious_activity AS
SELECT 
    se.id,
    se.id_usuario,
    u.email,
    se.event_type,
    se.severity,
    se.ip_address,
    se.created_at,
    se.description
FROM security_events se
LEFT JOIN usuarios u ON se.id_usuario = u.id
WHERE se.severity IN ('high', 'critical')
ORDER BY se.created_at DESC;

-- =====================================================
-- 13. PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

DELIMITER $$

-- Procedimiento para registrar intento de login fallido
CREATE PROCEDURE sp_register_failed_login(
    IN p_user_id INT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_max_attempts INT;
    DECLARE v_lockout_minutes INT;
    DECLARE v_current_attempts INT;
    
    -- Obtener configuración
    SELECT CAST(config_value AS UNSIGNED) INTO v_max_attempts 
    FROM security_config WHERE config_key = 'max_login_attempts';
    
    SELECT CAST(config_value AS UNSIGNED) INTO v_lockout_minutes 
    FROM security_config WHERE config_key = 'lockout_duration_minutes';
    
    -- Incrementar intentos
    UPDATE usuarios 
    SET login_attempts = login_attempts + 1,
        last_login_attempt = NOW(),
        last_login_ip = p_ip_address
    WHERE id = p_user_id;
    
    -- Obtener intentos actuales
    SELECT login_attempts INTO v_current_attempts 
    FROM usuarios WHERE id = p_user_id;
    
    -- Bloquear cuenta si se alcanzó el máximo
    IF v_current_attempts >= v_max_attempts THEN
        UPDATE usuarios 
        SET locked_until = DATE_ADD(NOW(), INTERVAL v_lockout_minutes MINUTE)
        WHERE id = p_user_id;
        
        -- Registrar evento de bloqueo
        INSERT INTO security_events (id_usuario, event_type, severity, ip_address, user_agent)
        VALUES (p_user_id, 'account_locked', 'high', p_ip_address, p_user_agent);
    END IF;
    
    -- Registrar evento de login fallido
    INSERT INTO security_events (id_usuario, event_type, severity, ip_address, user_agent)
    VALUES (p_user_id, 'login_failed', 'medium', p_ip_address, p_user_agent);
END$$

-- Procedimiento para resetear intentos después de login exitoso
CREATE PROCEDURE sp_register_successful_login(
    IN p_user_id INT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    UPDATE usuarios 
    SET login_attempts = 0,
        locked_until = NULL,
        last_login_success = NOW(),
        last_login_attempt = NOW(),
        last_login_ip = p_ip_address
    WHERE id = p_user_id;
    
    INSERT INTO security_events (id_usuario, event_type, severity, ip_address, user_agent)
    VALUES (p_user_id, 'login_success', 'low', p_ip_address, p_user_agent);
END$$

DELIMITER ;

-- =====================================================
-- FIN DE MIGRACIONES
-- =====================================================

-- Para ejecutar estas migraciones, corre este archivo completo:
-- mysql -u root -p uplindb < MIGRACIONES_SEGURIDAD.sql
