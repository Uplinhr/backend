-- Tabla de órdenes de pago
CREATE TABLE IF NOT EXISTS payment_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Número de orden único (ej: ORD-2025-00001)',
    id_usuario INT NOT NULL,
    id_cart INT NULL COMMENT 'Referencia al carrito original',
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_gateway ENUM('mercadopago', 'paypal', 'payoneer') NOT NULL,
    
    -- Montos
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Información fiscal
    country_code VARCHAR(3) NULL,
    tax_rate DECIMAL(5, 2) NULL,
    tax_name VARCHAR(50) NULL,
    
    -- Información de pago
    payment_method VARCHAR(50) NULL COMMENT 'Ej: credit_card, debit_card, etc',
    external_payment_id VARCHAR(255) NULL COMMENT 'ID de la transacción en la pasarela',
    payment_url TEXT NULL COMMENT 'URL de pago generada por la pasarela',
    
    -- Fechas
    expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración del link de pago',
    paid_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    refunded_at TIMESTAMP NULL,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Metadata
    customer_email VARCHAR(100) NULL,
    customer_name VARCHAR(200) NULL,
    billing_address JSON NULL,
    notes TEXT NULL,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    FOREIGN KEY (id_cart) 
        REFERENCES shopping_cart(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices para búsquedas rápidas
CREATE INDEX idx_usuario ON payment_orders(id_usuario);
CREATE INDEX idx_status ON payment_orders(status);
CREATE INDEX idx_gateway ON payment_orders(payment_gateway);
CREATE INDEX idx_external_id ON payment_orders(external_payment_id);
CREATE INDEX idx_created ON payment_orders(fecha_alta);
