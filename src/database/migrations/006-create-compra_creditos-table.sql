CREATE TABLE IF NOT EXISTS compra_creditos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    medio_pago ENUM('mercado pago', 'tarjeta') DEFAULT 'tarjeta',
    costo DECIMAL(10, 2) NOT NULL,
    observaciones VARCHAR(100) NOT NULL,
    moneda ENUM('ARS', 'USD', 'EUR') NULL DEFAULT 'ARS',
    id_cred INT NULL,
    FOREIGN KEY (id_cred) 
        REFERENCES creditos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;