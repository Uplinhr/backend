CREATE TABLE IF NOT EXISTS consumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_consumo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_busqueda VARCHAR(50) NOT NULL,
    creditos_usados INT DEFAULT 1,
    observaciones VARCHAR(100) NOT NULL,
    estado ENUM('pendiente', 'en proceso', 'finalizado') NOT NULL DEFAULT 'pendiente',
    id_cred INT NULL,
    FOREIGN KEY (id_cred) 
        REFERENCES creditos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;