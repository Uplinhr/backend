# ⚡ Quick Start - Sistema de Pagos UplinHR

## 🚀 Instalación Rápida (5 minutos)

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Generar Claves de Seguridad
```bash
npm run generate:keys
```
Copia las claves generadas a tu `.env.local`

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega:
```env
# Claves generadas
ENCRYPTION_KEY=pega_clave_generada_aqui
WEBHOOK_SECRET=pega_clave_generada_aqui

# MercadoPago (obtener en https://www.mercadopago.com.ar/developers)
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_token_aqui
MERCADOPAGO_PUBLIC_KEY=TEST-tu_public_key_aqui

# PayPal (obtener en https://developer.paypal.com/)
PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_secret
PAYPAL_MODE=sandbox

# Email ya está configurado
MAIL_API_KEY=re_aDh93bUh_DbsA2Lc4wwYk3VKVBwonAHcY
```

### 4. Ejecutar Migraciones
```bash
npm run migrate
```

### 5. Cargar Datos Iniciales
```bash
npm run seeders
```

### 6. Iniciar Servidor
```bash
npm run dev
```

✅ **¡Listo!** El servidor está corriendo en `http://localhost:4000`

---

## 🧪 Probar el Sistema

### Test 1: Health Check
```bash
curl http://localhost:4000/api/health
```

### Test 2: Ver Pasarelas Disponibles
```bash
curl http://localhost:4000/api/payments/gateways
```

### Test 3: Calcular Impuestos
```bash
curl -X POST http://localhost:4000/api/taxes/calculate \
  -H "Content-Type: application/json" \
  -d '{"subtotal": 100, "country_code": "ARG"}'
```

### Test 4: Ejecutar Tests
```bash
npm test
```

---

## 📊 Scripts Útiles

```bash
# Generar claves de seguridad
npm run generate:keys

# Ver webhooks pendientes
npm run check:webhooks

# Ver estadísticas de pagos
npm run stats:payments

# Ejecutar tests con coverage
npm run test:coverage
```

---

## 🔑 Obtener Credenciales de Pasarelas

### MercadoPago (Sandbox)
1. Ir a: https://www.mercadopago.com.ar/developers
2. Crear cuenta de desarrollador
3. Crear aplicación
4. Copiar **Access Token** y **Public Key** de **Credenciales de prueba**

### PayPal (Sandbox)
1. Ir a: https://developer.paypal.com/
2. Crear cuenta de desarrollador
3. Dashboard → Apps → Create App
4. Copiar **Client ID** y **Secret** de Sandbox

### Payoneer
Payoneer requiere contacto directo:
1. Contactar: https://www.payoneer.com/solutions/developers/
2. Solicitar integración API
3. Completar proceso de onboarding

---

## 📁 Estructura de Archivos Importantes

```
back/
├── .env.local                    # TU configuración (no subir a git)
├── .env.example                  # Template de configuración
├── package.json                  # Dependencias y scripts
├── README_PAGOS.md              # Documentación completa
├── IMPLEMENTATION_SUMMARY.md     # Resumen de implementación
├── QUICKSTART.md                # Esta guía
│
├── src/
│   ├── app.js                   # Aplicación Express
│   ├── features/
│   │   ├── cart/                # Carrito de compras
│   │   ├── taxes/               # Impuestos
│   │   ├── payments/            # Pagos y pasarelas
│   │   └── notifications/       # Emails
│   ├── middlewares/
│   │   ├── auth.js             # Autenticación
│   │   └── security.middleware.js  # Seguridad
│   └── utils/                   # Utilidades
│
├── src/database/
│   ├── migrations/              # Migraciones (016-028 son nuevas)
│   └── seeders/                 # Datos iniciales (03-06 son nuevos)
│
├── scripts/                     # Scripts útiles
│   ├── generate-keys.js
│   ├── check-webhooks.js
│   └── payment-stats.js
│
└── tests/                       # Tests con Jest
    ├── payments.test.js
    ├── security.test.js
    └── helpers.test.js
```

---

## 🎯 Flujo de Compra Simplificado

```
1. Cliente → Agregar al carrito
   POST /api/cart/items

2. Sistema → Calcular impuestos automáticamente
   (21% IVA para Argentina)

3. Cliente → Crear orden de pago
   POST /api/payments/create-order

4. Sistema → Generar link de pago
   Retorna URL de MercadoPago/PayPal

5. Cliente → Pagar en pasarela
   (redirigido a la pasarela)

6. Pasarela → Enviar webhook
   POST /api/payments/webhooks/{gateway}

7. Sistema → Activar servicios + Enviar email
   Servicios disponibles inmediatamente
```

---

## 🛠️ Troubleshooting Rápido

### Error: "Cannot find module"
```bash
npm install
```

### Error: "Database connection failed"
Verifica en `.env.local`:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME

### Error: "Pasarela no configurada"
Agrega las credenciales de la pasarela en `.env.local`

### Error: "Token inválido"
El usuario debe hacer login primero:
```bash
POST /api/auth/login
```

### Ver Logs
```bash
# Logs generales
tail -f logs/combined-$(date +%Y-%m-%d).log

# Logs de pagos
tail -f logs/payments-$(date +%Y-%m-%d).log

# Logs de errores
tail -f logs/error-$(date +%Y-%m-%d).log
```

---

## 📚 Documentación Adicional

- **README_PAGOS.md** - Guía completa del sistema
- **IMPLEMENTATION_SUMMARY.md** - Resumen técnico
- Ver comentarios en el código para más detalles

---

## ✅ Checklist de Verificación

- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Claves de seguridad generadas
- [ ] Migraciones ejecutadas
- [ ] Seeders cargados
- [ ] Servidor iniciado
- [ ] Tests pasando (`npm test`)
- [ ] Credenciales de pasarelas (al menos una)
- [ ] Email configurado (Resend)

---

## 🎉 ¡Todo Listo!

El sistema de pagos está completamente funcional. Puedes:
- ✅ Crear carritos de compra
- ✅ Calcular impuestos
- ✅ Procesar pagos con MercadoPago/PayPal
- ✅ Recibir webhooks
- ✅ Enviar emails automáticos
- ✅ Ver estadísticas

**Próximos pasos:**
1. Integrar con el frontend
2. Configurar webhooks en producción
3. Obtener credenciales reales de pasarelas
4. Configurar dominio y SSL

**¿Necesitas ayuda?**
- Revisa los logs en `logs/`
- Consulta `README_PAGOS.md`
- Revisa los comentarios en el código
