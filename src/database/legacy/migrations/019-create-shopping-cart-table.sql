-- Tabla de carrito de compras
CREATE TABLE IF NOT EXISTS shopping_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_uuid VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUID para identificación externa',
    id_usuario INT NULL,
    session_id VARCHAR(255) NULL COMMENT 'Para usuarios no autenticados',
    status ENUM('active', 'checkout', 'converted', 'abandoned', 'expired') DEFAULT 'active',
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    country_code VARCHAR(3) NULL COMMENT 'País del cliente para impuestos',
    expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración del carrito',
    converted_at TIMESTAMP NULL COMMENT 'Fecha de conversión a orden',
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_usuario ON shopping_cart(id_usuario);
CREATE INDEX idx_session ON shopping_cart(session_id);
CREATE INDEX idx_status ON shopping_cart(status);
CREATE INDEX idx_expires ON shopping_cart(expires_at);
