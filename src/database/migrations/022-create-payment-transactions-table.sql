-- Tabla de transacciones de pago (registro detallado de cada intento)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'ID único de transacción',
    id_order INT NOT NULL,
    
    -- Estado de la transacción
    status ENUM('initiated', 'pending', 'authorized', 'captured', 'completed', 'failed', 'cancelled', 'refunded', 'chargeback') NOT NULL,
    
    -- Información de la pasarela
    payment_gateway ENUM('mercadopago', 'paypal', 'payoneer') NOT NULL,
    gateway_transaction_id VARCHAR(255) NULL COMMENT 'ID de transacción de la pasarela',
    gateway_status VARCHAR(50) NULL COMMENT 'Estado reportado por la pasarela',
    gateway_response JSON NULL COMMENT 'Respuesta completa de la pasarela',
    
    -- Montos
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    gateway_fee DECIMAL(10, 2) NULL COMMENT 'Comisión de la pasarela',
    net_amount DECIMAL(10, 2) NULL COMMENT 'Monto neto recibido',
    
    -- Información de pago
    payment_method VARCHAR(50) NULL,
    card_last_four VARCHAR(4) NULL COMMENT 'Últimos 4 dígitos de tarjeta',
    card_brand VARCHAR(20) NULL COMMENT 'Visa, Mastercard, etc',
    
    -- Mensajes
    error_code VARCHAR(50) NULL,
    error_message TEXT NULL,
    
    -- Fechas
    processed_at TIMESTAMP NULL,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Seguridad
    ip_address VARCHAR(45) NULL COMMENT 'IP del cliente (IPv4/IPv6)',
    user_agent TEXT NULL,
    
    FOREIGN KEY (id_order) 
        REFERENCES payment_orders(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_order ON payment_transactions(id_order);
CREATE INDEX idx_gateway_tx ON payment_transactions(gateway_transaction_id);
CREATE INDEX idx_status ON payment_transactions(status);
CREATE INDEX idx_gateway ON payment_transactions(payment_gateway);
