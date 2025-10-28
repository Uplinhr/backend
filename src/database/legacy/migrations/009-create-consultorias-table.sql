CREATE TABLE IF NOT EXISTS consultorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    horas_totales INT NOT NULL,
    horas_restantes INT NOT NULL,
    vencimiento TIMESTAMP NULL,
    id_usuario INT NULL,
    FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;