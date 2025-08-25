CREATE TABLE IF NOT EXISTS compra_planes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    medio_pago ENUM('mercado pago', 'tarjeta') DEFAULT 'tarjeta',
    observaciones VARCHAR(100) NOT NULL,
    precio_abonado DECIMAL(10, 2) NOT NULL,
    id_plan INT NULL,
    FOREIGN KEY (id_plan) 
        REFERENCES planes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    id_usuario INT NULL,
    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;