-- Actualizar tabla compra_creditos para integrar con el nuevo sistema de pagos
ALTER TABLE compra_creditos 
ADD COLUMN id_order INT NULL COMMENT 'Referencia a la orden de pago',
ADD COLUMN id_transaction INT NULL COMMENT 'Referencia a la transacción',
ADD COLUMN status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
ADD COLUMN subtotal DECIMAL(10, 2) NULL COMMENT 'Precio sin impuestos',
ADD COLUMN tax_amount DECIMAL(10, 2) NULL COMMENT 'Monto de impuestos',
ADD FOREIGN KEY (id_order) REFERENCES payment_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Actualizar medio_pago para incluir nuevas opciones
ALTER TABLE compra_creditos 
MODIFY COLUMN medio_pago ENUM('mercadopago', 'paypal', 'payoneer', 'tarjeta', 'transferencia', 'otro') DEFAULT 'tarjeta';
