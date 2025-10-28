ALTER TABLE usuarios
ADD COLUMN id_plan INT NULL COMMENT 'FK a planes';

ALTER TABLE usuarios
ADD CONSTRAINT fk_usuarios_planes
    FOREIGN KEY (id_plan) REFERENCES planes(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


-- Opcional, lo recomienda deepseek por temas de rendimiento
CREATE INDEX idx_usuarios_planes ON usuarios (id_plan);