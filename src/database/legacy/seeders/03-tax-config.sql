-- Configuración de impuestos inicial
INSERT INTO tax_config (country_code, country_name, tax_name, tax_rate, active, apply_to_services, apply_to_memberships, notes) VALUES
('ARG', 'Argentina', 'IVA', 21.00, true, true, true, 'IVA del 21% aplicable a todos los servicios para clientes argentinos según normativa AFIP'),
('USA', 'United States', 'Sales Tax', 0.00, true, false, false, 'Sin impuestos para clientes internacionales. El cliente es responsable de impuestos locales (reverse charge)'),
('BRA', 'Brasil', 'ICMS', 0.00, false, false, false, 'Impuesto brasileño - configurar según necesidad futura'),
('MEX', 'México', 'IVA', 0.00, false, false, false, 'IVA mexicano - configurar según necesidad futura'),
('CHL', 'Chile', 'IVA', 0.00, false, false, false, 'IVA chileno - configurar según necesidad futura');
