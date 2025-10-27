-- Tabla de servicios de búsqueda de talento con precios y descuentos
CREATE TABLE IF NOT EXISTS talent_search_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Single Hire, Pro, Premium, Platinum',
    base_price DECIMAL(10, 2) NOT NULL COMMENT 'Precio base en USD',
    discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Porcentaje de descuento',
    hires_included INT NOT NULL DEFAULT 1 COMMENT 'Cantidad de contrataciones incluidas',
    description TEXT NULL,
    features JSON NULL COMMENT 'Características del servicio en formato JSON',
    active BOOLEAN DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Índice para ordenamiento
CREATE INDEX idx_active_order ON talent_search_services(active, display_order);
