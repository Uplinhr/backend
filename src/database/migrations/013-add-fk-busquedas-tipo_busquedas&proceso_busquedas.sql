ALTER TABLE busquedas
ADD COLUMN id_tipo INT NULL COMMENT 'FK a tipo_busquedas';

ALTER TABLE busquedas
ADD CONSTRAINT fk_busquedas_tipoBusquedas
    FOREIGN KEY (id_tipo) REFERENCES tipo_busquedas(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE busquedas
ADD COLUMN id_proceso INT NULL COMMENT 'FK a proceso_busquedas';

ALTER TABLE busquedas
ADD CONSTRAINT fk_busquedas_procesoBusquedas
    FOREIGN KEY (id_proceso) REFERENCES proceso_busquedas(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;