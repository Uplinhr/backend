-- Tabla de auditoría de pagos (registro de todos los eventos importantes)
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencias
    id_order INT NULL,
    id_transaction INT NULL,
    id_usuario INT NULL,
    
    -- Evento
    event_type VARCHAR(100) NOT NULL COMMENT 'Tipo de evento (order_created, payment_completed, refund_issued, etc)',
    event_description TEXT NULL,
    
    -- Actor
    performed_by INT NULL COMMENT 'Usuario que realizó la acción (admin, sistema, cliente)',
    performed_by_type ENUM('system', 'admin', 'customer', 'gateway') DEFAULT 'system',
    
    -- Datos
    old_value JSON NULL COMMENT 'Valor anterior (para cambios de estado)',
    new_value JSON NULL COMMENT 'Nuevo valor',
    metadata JSON NULL COMMENT 'Información adicional',
    
    -- Contexto
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Fecha
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_order) 
        REFERENCES payment_orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    FOREIGN KEY (id_transaction) 
        REFERENCES payment_transactions(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    FOREIGN KEY (performed_by) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_order ON payment_audit_log(id_order);
CREATE INDEX idx_transaction ON payment_audit_log(id_transaction);
CREATE INDEX idx_usuario ON payment_audit_log(id_usuario);
CREATE INDEX idx_event_type ON payment_audit_log(event_type);
CREATE INDEX idx_created ON payment_audit_log(fecha_alta);
