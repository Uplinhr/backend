CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad_horas INT NOT NULL,
    id_consultoria INT NULL,
    estado ENUM('Pendiente', 'En proceso', 'Finalizado', 'Eliminado') NOT NULL DEFAULT 'Pendiente',
    comentarios VARCHAR(150) NULL,
    observaciones VARCHAR(150) NULL,
    FOREIGN KEY (id_consultoria) 
        REFERENCES consultorias(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;