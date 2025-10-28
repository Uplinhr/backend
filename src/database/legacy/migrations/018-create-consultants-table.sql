-- Tabla de consultores para servicios de consultoría
CREATE TABLE IF NOT EXISTS consultants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL UNIQUE,
    phone VARCHAR(20) NULL,
    specialization VARCHAR(100) NULL COMMENT 'Área de especialización',
    hourly_rate DECIMAL(10, 2) NULL COMMENT 'Tarifa por hora (personalizada)',
    bio TEXT NULL,
    photo_url VARCHAR(255) NULL,
    active BOOLEAN DEFAULT TRUE,
    available BOOLEAN DEFAULT TRUE COMMENT 'Disponible para nuevas consultas',
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Índice para búsquedas
CREATE INDEX idx_active_available ON consultants(active, available);
