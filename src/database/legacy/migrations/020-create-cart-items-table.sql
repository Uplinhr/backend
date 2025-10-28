-- Tabla de items del carrito
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cart INT NOT NULL,
    item_type ENUM('membership', 'talent_search', 'consultancy', 'people_partner', 'credits') NOT NULL,
    item_id INT NULL COMMENT 'ID del servicio/plan específico',
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    metadata JSON NULL COMMENT 'Datos adicionales del item (ej: consultor, duración)',
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_cart) 
        REFERENCES shopping_cart(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_cart ON cart_items(id_cart);
CREATE INDEX idx_item_type ON cart_items(item_type);
