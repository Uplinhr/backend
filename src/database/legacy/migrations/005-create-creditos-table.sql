CREATE TABLE IF NOT EXISTS creditos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vencimiento TIMESTAMP NULL,
    tipo_credito ENUM('plan', 'adicional', 'devuelto') DEFAULT 'plan',
    cantidad INT NOT NULL,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NULL,
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;