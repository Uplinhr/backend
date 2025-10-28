-- Tabla de eventos de webhooks (registro de todas las notificaciones recibidas)
CREATE TABLE IF NOT EXISTS webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'ID único del evento',
    
    -- Información del webhook
    payment_gateway ENUM('mercadopago', 'paypal', 'payoneer') NOT NULL,
    event_type VARCHAR(100) NOT NULL COMMENT 'Tipo de evento (payment.created, payment.updated, etc)',
    
    -- Referencias
    id_order INT NULL COMMENT 'Orden relacionada (si existe)',
    external_reference VARCHAR(255) NULL COMMENT 'Referencia externa de la pasarela',
    
    -- Datos del evento
    payload JSON NOT NULL COMMENT 'Payload completo del webhook',
    headers JSON NULL COMMENT 'Headers HTTP recibidos',
    
    -- Estado del procesamiento
    processed BOOLEAN DEFAULT FALSE,
    processing_status ENUM('pending', 'processing', 'completed', 'failed', 'ignored') DEFAULT 'pending',
    processing_attempts INT DEFAULT 0,
    processing_error TEXT NULL,
    processed_at TIMESTAMP NULL,
    
    -- Seguridad
    signature VARCHAR(500) NULL COMMENT 'Firma del webhook para validación',
    signature_valid BOOLEAN NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Fechas
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_order) 
        REFERENCES payment_orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_gateway ON webhook_events(payment_gateway);
CREATE INDEX idx_event_type ON webhook_events(event_type);
CREATE INDEX idx_processed ON webhook_events(processed, processing_status);
CREATE INDEX idx_order ON webhook_events(id_order);
CREATE INDEX idx_external_ref ON webhook_events(external_reference);
CREATE INDEX idx_created ON webhook_events(fecha_alta);
