-- Mejorar tabla planes para soportar más información
ALTER TABLE planes 
ADD COLUMN description TEXT NULL COMMENT 'Descripción del plan',
ADD COLUMN features JSON NULL COMMENT 'Características del plan en formato JSON',
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN billing_cycle ENUM('monthly', 'quarterly', 'yearly', 'once') DEFAULT 'monthly',
ADD COLUMN display_order INT NOT NULL DEFAULT 0 COMMENT 'Orden de visualización',
ADD COLUMN is_popular BOOLEAN DEFAULT FALSE COMMENT 'Marcar plan como popular',
ADD COLUMN tax_included BOOLEAN DEFAULT FALSE COMMENT 'Si el precio incluye impuestos';

-- Índice para ordenamiento
CREATE INDEX idx_active_order ON planes(active, display_order);
