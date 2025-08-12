CREATE TABLE IF NOT EXISTS consulta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad_horas INT NOT NULL,
    id_consultoria INT NULL,
    FOREIGN KEY (id_consultoria) 
        REFERENCES consultorias(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;