CREATE TABLE IF NOT EXISTS busquedas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_mod TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    info_busqueda VARCHAR(150) NOT NULL,
    creditos_usados INT NULL,
    observaciones VARCHAR(150) NULL,
    estado ENUM('Pendiente', 'En proceso', 'Finalizado', 'Eliminado') NOT NULL DEFAULT 'Pendiente',
    id_cred INT NULL,
    FOREIGN KEY (id_cred) 
        REFERENCES creditos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;