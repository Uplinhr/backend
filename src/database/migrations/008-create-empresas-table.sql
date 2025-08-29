CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    nombre_fantasia VARCHAR(50) NULL,
    cuit VARCHAR(50) NULL UNIQUE,
    condicion_iva ENUM('Responsable inscripto', 'Monotributista', 'Exento', 'No_Alcanzado', 'Otro') NULL,
    tipo_societario ENUM('SA', 'SAU', 'SRL', 'SAS', 'SCS', 'SCA', 'Cooperativa', 'Asociacion civil', 
    'Fundacion', 'Sociedad de hecho', 'Otro') NULL,
    actividad_principal VARCHAR(100) NULL,
    domicilio_legal_calle_numero VARCHAR(50) NULL,
    domicilio_legal_ciudad VARCHAR(50) NULL,
    domicilio_legal_pais VARCHAR(50) NULL,
    codigo_postal VARCHAR(50) NULL,
    email VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NULL UNIQUE,
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;