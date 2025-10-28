-- Servicios de Búsqueda de Talento con precios y descuentos
INSERT INTO talent_search_services (service_name, base_price, discount_percentage, hires_included, description, features, active, display_order) VALUES
(
    'Single Hire', 
    720.00, 
    0.00, 
    1,
    'Contratación individual de talento calificado',
    JSON_OBJECT(
        'hires', 1,
        'support', 'Email support',
        'guarantee', '30 days replacement guarantee',
        'delivery_time', '15-30 days'
    ),
    true,
    1
),
(
    'Pro', 
    3960.00, 
    5.00, 
    6,
    'Paquete profesional con 5% de descuento',
    JSON_OBJECT(
        'hires', 6,
        'discount', '5%',
        'support', 'Priority support',
        'guarantee', '60 days replacement guarantee',
        'delivery_time', '10-25 days',
        'account_manager', true
    ),
    true,
    2
),
(
    'Premium', 
    5940.00, 
    10.00, 
    10,
    'Paquete premium con 10% de descuento',
    JSON_OBJECT(
        'hires', 10,
        'discount', '10%',
        'support', 'Dedicated support',
        'guarantee', '90 days replacement guarantee',
        'delivery_time', '7-20 days',
        'account_manager', true,
        'custom_requirements', true
    ),
    true,
    3
),
(
    'Platinum', 
    7920.00, 
    15.00, 
    15,
    'Paquete platinum con 15% de descuento - Máximo ahorro',
    JSON_OBJECT(
        'hires', 15,
        'discount', '15%',
        'support', '24/7 Premium support',
        'guarantee', '120 days replacement guarantee',
        'delivery_time', '5-15 days',
        'account_manager', true,
        'custom_requirements', true,
        'priority_access', true,
        'quarterly_review', true
    ),
    true,
    4
);
