ALTER TABLE consumos
ADD COLUMN estado ENUM('pendiente', 'en proceso', 'finalizado') NOT NULL DEFAULT ('pendiente');

ALTER TABLE consultorias
ADD COLUMN estado ENUM('pendiente', 'en proceso', 'finalizado') NOT NULL DEFAULT 'pendiente',
ADD COLUMN observaciones VARCHAR(100) NULL;