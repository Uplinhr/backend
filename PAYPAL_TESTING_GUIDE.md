# 🚀 Guía Completa de Testing - Sistema de Pagos PayPal

## 📋 Tabla de Contenidos
- [Configuración Inicial](#configuración-inicial)
- [Variables de Entorno](#variables-de-entorno)
- [Obtener Credenciales de PayPal](#obtener-credenciales-de-paypal)
- [Página de Pruebas](#página-de-pruebas)
- [Ejecución de Tests](#ejecución-de-tests)
- [Casos de Prueba](#casos-de-prueba)
- [Troubleshooting](#troubleshooting)

## ⚙️ Configuración Inicial

### 1. Variables de Entorno Requeridas

Asegúrate de tener configuradas las siguientes variables en tu archivo `.env.local`:

```bash
# PayPal
PAYPAL_CLIENT_ID=tu_client_id_aqui
PAYPAL_CLIENT_SECRET=tu_client_secret_aqui
PAYPAL_MODE=sandbox

# Base URL para webhooks
WEBHOOK_BASE_URL=http://localhost:4000/api/webhooks

# Seguridad
ENCRYPTION_KEY=una_clave_segura_de_32_caracteres
WEBHOOK_SECRET=un_secret_para_validar_webhooks
```

### 2. Instalación y Configuración de Base de Datos

```bash
# Ejecutar migraciones
npm run migrate

# Ejecutar seeders (datos iniciales)
npm run seeders
```

## 🔑 Obtener Credenciales de PayPal

### Paso 1: Crear Cuenta de Desarrollador PayPal

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una cuenta o inicia sesión
3. Ve a **Applications** > **Create App**

### Paso 2: Configurar Aplicación Sandbox

1. Selecciona **Create App**
2. Elige **Sandbox** como ambiente
3. Nombra tu aplicación (ej: "Uplin Payment System")
4. Selecciona **Merchant** como tipo de cuenta

### Paso 3: Obtener Credenciales

Una vez creada la aplicación, encontrarás:

- **Client ID**: En la sección "Sandbox"
- **Client Secret**: Haz clic en "Show" debajo del Client ID

⚠️ **Importante**: Usa siempre las credenciales de **Sandbox** para pruebas, nunca las de producción.

## 🧪 Página de Pruebas

Hemos creado una página completa de pruebas en `/public/test-paypal.html`. Accede desde tu navegador:

```
http://localhost:4000/test-paypal.html
```

### Funcionalidades de la Página de Pruebas

#### 📊 Estado del Sistema
- Verifica conexión a base de datos
- Muestra tiempo de actividad del servidor

#### ✅ Configuración PayPal
- Verifica si las credenciales están configuradas
- Muestra el modo actual (sandbox/production)

#### 🛒 Pruebas de Carrito
- Crear carrito de compras de prueba
- Agregar items de prueba
- Calcular totales con impuestos

#### 💰 Pruebas de Pago
- Crear orden de pago PayPal
- Abrir ventana de pago de PayPal
- Procesar pago completo

#### 🔍 Pruebas de Webhooks
- Simular recepción de webhooks
- Ver estado de procesamiento
- Revisar logs de errores

#### 📈 Estadísticas
- Ver métricas de pagos procesados
- Estadísticas de éxito/fallo

## 🏃‍♂️ Ejecución de Tests

### Tests Unitarios

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

### Tests de Integración

Los tests de integración prueban el flujo completo:

```bash
# Crear carrito de prueba
curl -X POST http://localhost:4000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123", "currency": "USD"}'

# Agregar item al carrito
curl -X POST http://localhost:4000/api/cart/{cartId}/items \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "talent_search",
    "serviceId": "single-hire",
    "quantity": 1,
    "price": 99.99
  }'

# Crear orden PayPal
curl -X POST http://localhost:4000/api/payments/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "your-cart-id",
    "currency": "USD",
    "returnUrl": "http://localhost:4000/payment/success",
    "cancelUrl": "http://localhost:4000/payment/cancel"
  }'
```

## 🧪 Casos de Prueba

### Caso 1: Pago Exitoso Completo

1. **Crear carrito** con productos de prueba
2. **Agregar items** al carrito (servicios de búsqueda de talento)
3. **Calcular total** (debe incluir IVA 21%)
4. **Crear orden PayPal** con URLs de retorno
5. **Procesar pago** en ventana de PayPal
6. **Verificar webhook** de confirmación
7. **Confirmar actualización** de base de datos

### Caso 2: Cancelación de Pago

1. Crear carrito y orden PayPal
2. **Cancelar pago** en ventana de PayPal
3. **Verificar webhook** de cancelación
4. **Confirmar** que el pago no se procesó

### Caso 3: Reembolso

1. Procesar pago exitosamente
2. **Solicitar reembolso** vía admin
3. **Verificar webhook** de reembolso
4. **Confirmar** actualización de estado

### Caso 4: Pruebas de Seguridad

1. **Rate limiting**: Intentar múltiples requests
2. **Validación de datos**: Enviar datos inválidos
3. **Autenticación**: Probar sin token JWT
4. **Encriptación**: Verificar datos sensibles

## 🔧 Troubleshooting

### Problemas Comunes

#### ❌ "PayPal credentials not configured"
**Solución**: Verifica que `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` estén configuradas en `.env.local`

#### ❌ "Invalid cart ID"
**Solución**: Asegúrate de crear el carrito primero y usar el ID correcto

#### ❌ "Payment not completed"
**Solución**: Revisa los logs de PayPal y verifica que el webhook esté funcionando

#### ❌ "Database connection error"
**Solución**: Ejecuta `npm run migrate` y verifica la configuración de base de datos

### Logs y Debugging

```bash
# Ver logs en tiempo real
npm run dev

# Ver logs de pagos específicos
tail -f logs/payments.log

# Ver logs de errores
tail -f logs/error.log

# Ejecutar script de diagnóstico
npm run check:webhooks
```

### Verificación de Webhooks

```bash
# Ejecutar diagnóstico de webhooks
node scripts/check-webhooks.js
```

Esto mostrará:
- Webhooks pendientes de procesar
- Webhooks con errores en las últimas 24h
- Últimos webhooks procesados exitosamente

## 📊 Métricas de Éxito

### Indicadores de Funcionamiento Correcto

✅ **Configuración**:
- Variables de entorno configuradas correctamente
- Credenciales de PayPal válidas
- Base de datos conectada

✅ **Funcionalidad**:
- Creación de carritos exitosa
- Cálculo de impuestos correcto (21% IVA)
- Creación de órdenes PayPal
- Procesamiento de webhooks

✅ **Seguridad**:
- Rate limiting funcionando
- Validación de datos activa
- Logs de auditoría generándose

✅ **Tests**:
- Tests unitarios pasando
- Tests de integración exitosos
- Cobertura de código > 80%

## 🚨 Notas Importantes

1. **Sandbox vs Production**: Siempre usa Sandbox para pruebas
2. **URLs de Webhook**: Asegúrate de que sean accesibles públicamente
3. **SSL**: Para producción, necesitas certificado SSL válido
4. **Monedas**: Actualmente soporta USD, EUR, ARS
5. **Impuestos**: IVA 21% configurado para Argentina

## 🎯 Próximos Pasos

Una vez que las pruebas básicas funcionen:

1. **Pruebas de carga**: Simular múltiples pagos simultáneos
2. **Pruebas de stress**: Webhooks de alta frecuencia
3. **Pruebas de seguridad avanzadas**: Penetration testing
4. **Monitoreo**: Configurar alertas para pagos fallidos
5. **Documentación API**: Swagger/OpenAPI completa

---
**¿Necesitas ayuda adicional?** Consulta los logs detallados o revisa la documentación técnica en `IMPLEMENTATION_SUMMARY.md`
