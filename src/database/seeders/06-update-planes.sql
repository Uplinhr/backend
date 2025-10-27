-- Actualizar planes existentes con información adicional
UPDATE planes SET 
    description = 'Plan ideal para startups y pequeñas empresas que están comenzando',
    features = JSON_OBJECT(
        'creditos_mes', 10,
        'meses_creditos', 1,
        'horas_consultoria', 2,
        'support', 'Email support',
        'response_time', '48 hours'
    ),
    currency = 'USD',
    billing_cycle = 'monthly',
    display_order = 1,
    is_popular = false,
    tax_included = false
WHERE nombre = 'Start';

UPDATE planes SET 
    description = 'Plan perfecto para empresas en crecimiento con necesidades regulares de contratación',
    features = JSON_OBJECT(
        'creditos_mes', 20,
        'meses_creditos', 3,
        'horas_consultoria', 4,
        'support', 'Priority support',
        'response_time', '24 hours',
        'account_manager', true
    ),
    currency = 'USD',
    billing_cycle = 'monthly',
    display_order = 2,
    is_popular = true,
    tax_included = false,
    precio = 499.00
WHERE nombre = 'Growth';

UPDATE planes SET 
    description = 'Plan premium para grandes empresas con altos volúmenes de contratación',
    features = JSON_OBJECT(
        'creditos_mes', 40,
        'meses_creditos', 4,
        'horas_consultoria', 8,
        'support', 'Dedicated support',
        'response_time', '12 hours',
        'account_manager', true,
        'custom_reports', true,
        'api_access', true
    ),
    currency = 'USD',
    billing_cycle = 'monthly',
    display_order = 3,
    is_popular = false,
    tax_included = false
WHERE nombre = 'Premium';

-- Agregar plan Custom si no existe
INSERT INTO planes (nombre, creditos_mes, meses_cred, horas_cons, precio, custom, description, features, currency, billing_cycle, display_order, is_popular, tax_included, active) 
SELECT 
    'Custom', 
    0, 
    0, 
    0, 
    0.00, 
    true,
    'Plan personalizado según las necesidades específicas de tu empresa. Contáctanos para una cotización.',
    JSON_OBJECT(
        'customizable', true,
        'flexible_terms', true,
        'dedicated_support', true,
        'custom_integration', true,
        'sla_agreement', true
    ),
    'USD',
    'monthly',
    4,
    false,
    false,
    true
WHERE NOT EXISTS (SELECT 1 FROM planes WHERE nombre = 'Custom');
