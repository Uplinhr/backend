-- Tabla de configuración de impuestos por país/región
CREATE TABLE IF NOT EXISTS tax_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(3) NOT NULL UNIQUE COMMENT 'ISO 3166-1 alpha-3',
    country_name VARCHAR(100) NOT NULL,
    tax_name VARCHAR(50) NOT NULL COMMENT 'Ej: IVA, VAT, GST, Sales Tax',
    tax_rate DECIMAL(5, 2) NOT NULL COMMENT 'Porcentaje del impuesto (ej: 21.00)',
    active BOOLEAN DEFAULT TRUE,
    apply_to_services BOOLEAN DEFAULT TRUE,
    apply_to_memberships BOOLEAN DEFAULT TRUE,
    notes TEXT NULL COMMENT 'Notas legales o excepciones',
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Índice para búsquedas rápidas
CREATE INDEX idx_country_active ON tax_config(country_code, active);
