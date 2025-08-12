CREATE TABLE IF NOT EXISTS compra_planes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    medio_pago ENUM('mercado pago', 'tarjeta') DEFAULT 'tarjeta',
    observaciones VARCHAR(100) NOT NULL,
    id_plan INT NULL,
    FOREIGN KEY (id_plan) 
        REFERENCES planes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;