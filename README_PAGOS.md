# 💳 Sistema de Pagos - UplinHR

Sistema completo de pagos con múltiples pasarelas, carrito de compras y seguridad profesional.

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env.local (copiar de .env.example)
cp .env.example .env.local

# 3. Ejecutar migraciones
npm run migrate

# 4. Cargar datos iniciales
npm run seeders

# 5. Iniciar servidor
npm run dev
```

## ✨ Características

- ✅ **3 Pasarelas de Pago**: MercadoPago, PayPal, Payoneer
- ✅ **Carrito de Compras** con expiración automática
- ✅ **Sistema de Impuestos** (21% IVA Argentina)
- ✅ **Seguridad 3 Capas**: Headers, Rate Limiting, Auditoría
- ✅ **Webhooks** con validación de firmas
- ✅ **Emails Automáticos** con Resend
- ✅ **Encriptación AES-256-GCM** para datos sensibles
- ✅ **Tests Completos** con Jest

## 📋 Endpoints Principales

### Carrito
```
GET    /api/cart              - Obtener carrito
POST   /api/cart/items        - Agregar item
PUT    /api/cart/items/:id    - Actualizar cantidad
DELETE /api/cart/items/:id    - Eliminar item
GET    /api/cart/summary      - Resumen para checkout
```

### Pagos
```
GET  /api/payments/gateways              - Pasarelas disponibles
POST /api/payments/create-order          - Crear orden de pago
GET  /api/payments/orders/:id            - Ver orden
GET  /api/payments/my-orders             - Mis órdenes
POST /api/payments/orders/:id/refund     - Reembolso (Admin)
GET  /api/payments/stats                 - Estadísticas (Admin)
```

### Webhooks (Públicos)
```
POST /api/payments/webhooks/mercadopago
POST /api/payments/webhooks/paypal
POST /api/payments/webhooks/payoneer
```

### Impuestos
```
POST /api/taxes/calculate       - Calcular impuestos
GET  /api/taxes/config          - Ver configuración (Admin)
POST /api/taxes/config          - Crear config (Admin)
```

## 💰 Servicios Disponibles

### Membresías (Mensual)
| Plan | Precio | Créditos | Horas |
|------|--------|----------|-------|
| Start | $149 | 10 | 2 |
| Growth | $499 | 20 | 4 |
| Premium | $1,399 | 40 | 8 |

### Búsqueda de Talento (Único)
| Servicio | Precio | Descuento | Hires |
|----------|--------|-----------|-------|
| Single | $720 | 0% | 1 |
| Pro | $3,960 | 5% | 6 |
| Premium | $5,940 | 10% | 10 |
| Platinum | $7,920 | 15% | 15 |

## 🔐 Variables de Entorno

```env
# Pasarelas
MERCADOPAGO_ACCESS_TOKEN=tu_token
PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_secret
PAYPAL_MODE=sandbox

# Seguridad
ENCRYPTION_KEY=32_caracteres_minimo
WEBHOOK_SECRET=tu_secret_webhooks

# Email
MAIL_API_KEY=tu_resend_api_key
EMAIL_FROM=noreply@uplinhr.com

# Webhooks
WEBHOOK_BASE_URL=http://localhost:4000/api/payments
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Con coverage
npm run test:coverage

# Tests específicos
npm test payments.test.js
```

## 📊 Impuestos

- **Argentina**: 21% IVA (activo)
- **Internacional**: 0% (reverse charge)
- **Configurable** por país desde admin

## 🛡️ Seguridad

### Capa 1: Aplicación
- Helmet (headers seguros)
- HPP (prevención parameter pollution)
- Sanitización de inputs

### Capa 2: Rate Limiting
- General: 100 req/15min
- Pagos: 10 req/15min
- Webhooks: 100 req/1min
- Login: 5 req/15min

### Capa 3: Auditoría
- Winston logger con rotación
- Logs separados por tipo
- Retención: 30 días (general), 90 días (pagos)

## 🔄 Flujo de Compra

1. Cliente agrega items al carrito
2. Sistema calcula impuestos automáticamente
3. Cliente crea orden de pago
4. Sistema genera link de pago
5. Cliente paga en pasarela
6. Webhook confirma pago
7. Sistema activa servicios
8. Cliente recibe email de confirmación

## 📁 Estructura

```
src/
├── features/
│   ├── cart/              # Carrito de compras
│   ├── taxes/             # Sistema de impuestos
│   ├── payments/          # Pagos y órdenes
│   │   ├── adapters/      # Pasarelas
│   │   └── models/        # BD
│   └── notifications/     # Emails
├── middlewares/
│   ├── auth.js           # JWT
│   └── security.middleware.js
├── utils/
│   ├── encryption.js     # AES-256-GCM
│   ├── validators.js     # Validaciones
│   └── helpers.js        # Utilidades
└── config/
    ├── payment.config.js
    └── logger.config.js
```

## 📝 Migraciones Nuevas

- 016: Configuración de impuestos
- 017: Servicios de búsqueda de talento
- 018: Consultores
- 019-020: Carrito de compras
- 021-022: Órdenes y transacciones
- 023-024: Webhooks y auditoría
- 025-027: Actualización tablas existentes
- 028: People Partner services

## 🚨 Troubleshooting

### Pasarela no configurada
Verifica variables de entorno de la pasarela.

### Webhook no procesa
1. Verifica `logs/payments-YYYY-MM-DD.log`
2. Revisa tabla `webhook_events`
3. Verifica firma del webhook

### Error de impuestos
Verifica que existe configuración para el país en `tax_config`.

## 📞 Soporte

- Ver logs: `logs/combined-YYYY-MM-DD.log`
- Logs de pagos: `logs/payments-YYYY-MM-DD.log`
- Logs de errores: `logs/error-YYYY-MM-DD.log`

## 📚 Documentación Completa

- `IMPLEMENTATION_SUMMARY.md` - Resumen de implementación
- Ver código para documentación detallada en comentarios

---

**Estado:** ✅ Sistema completo y listo para usar

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025
