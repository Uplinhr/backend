-- Tabla para servicios de People Partner Staffing (precio personalizado por admin)
CREATE TABLE IF NOT EXISTS people_partner_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL COMMENT 'Cliente que solicita el servicio',
    service_type VARCHAR(100) NOT NULL COMMENT 'Tipo de servicio de People Partner',
    description TEXT NULL,
    
    -- Precio personalizado
    base_price DECIMAL(10, 2) NULL COMMENT 'Precio base establecido por admin',
    negotiated_price DECIMAL(10, 2) NULL COMMENT 'Precio negociado final',
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Estado
    status ENUM('requested', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled') DEFAULT 'requested',
    
    -- Información adicional
    duration_months INT NULL COMMENT 'Duración estimada en meses',
    team_size INT NULL COMMENT 'Tamaño del equipo requerido',
    requirements JSON NULL COMMENT 'Requerimientos específicos',
    
    -- Fechas
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quoted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Admin que cotiza
    quoted_by INT NULL COMMENT 'Admin que estableció el precio',
    
    -- Notas
    admin_notes TEXT NULL,
    customer_notes TEXT NULL,
    
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    FOREIGN KEY (quoted_by) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_usuario ON people_partner_services(id_usuario);
CREATE INDEX idx_status ON people_partner_services(status);
CREATE INDEX idx_quoted_by ON people_partner_services(quoted_by);
