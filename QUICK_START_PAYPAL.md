# 🚀 Inicio Rápido - Pruebas PayPal

## ✅ Estado del Sistema

**Backend funcionando correctamente** ✓

- ✅ Puerto: `http://localhost:4000`
- ✅ PayPal: Configurado y funcionando
- ✅ Payoneer: Deshabilitado (sin SDK)
- ⚠️ MercadoPago: No configurado (agregar credenciales para habilitar)

---

## 🎯 Acceso Rápido a Página de Pruebas

Abre en tu navegador:

```
http://localhost:4000/test-paypal.html
```

Esta página interactiva te permite probar todas las funcionalidades de PayPal sin necesidad de código.

---

## 📋 Endpoints Disponibles

### **Health Check**
```bash
curl http://localhost:4000/api/health
```

### **Configuración de PayPal**
```bash
curl http://localhost:4000/api/payments/config/paypal
```

### **Pasarelas Disponibles**
```bash
curl http://localhost:4000/api/payments/gateways
```

### **Crear Orden PayPal**
```bash
curl -X POST http://localhost:4000/api/payments/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "test-cart-123",
    "currency": "USD",
    "returnUrl": "http://localhost:4000/payment/success",
    "cancelUrl": "http://localhost:4000/payment/cancel"
  }'
```

### **Simular Webhook**
```bash
curl -X POST http://localhost:4000/api/payments/webhook/test/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "PAYMENT.CAPTURE.COMPLETED",
    "orderId": "test-order-123"
  }'
```

### **Estado de Webhooks**
```bash
curl http://localhost:4000/api/payments/webhooks/status
```

### **Verificación de Seguridad**
```bash
curl http://localhost:4000/api/payments/security/test
```

---

## 🧪 Flujo de Prueba Completo

### **Opción 1: Página Web Interactiva** (Recomendado)

1. Abre `http://localhost:4000/test-paypal.html`
2. Verifica el estado del sistema (verde = OK)
3. Crea un carrito de prueba
4. Agrega items al carrito
5. Crea orden de PayPal
6. Procesa el pago en la ventana de PayPal Sandbox

### **Opción 2: Con cURL (Manual)**

#### **Paso 1: Crear Carrito**
```bash
curl -X POST http://localhost:4000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123", "currency": "USD"}'
```
**Respuesta:** Guarda el `cartId` devuelto.

#### **Paso 2: Agregar Item al Carrito**
```bash
curl -X POST http://localhost:4000/api/cart/{CART_ID}/items \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "talent_search",
    "serviceId": "single-hire",
    "quantity": 1,
    "price": 99.99
  }'
```

#### **Paso 3: Calcular Total**
```bash
curl http://localhost:4000/api/cart/{CART_ID}/total
```

#### **Paso 4: Crear Orden PayPal**
```bash
curl -X POST http://localhost:4000/api/payments/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "{CART_ID}",
    "currency": "USD",
    "returnUrl": "http://localhost:4000/payment/success",
    "cancelUrl": "http://localhost:4000/payment/cancel"
  }'
```
**Respuesta:** Guarda el `paypalOrderId` y abre la URL de aprobación en el navegador.

---

## 🔑 Configuración de PayPal Sandbox

### **Credenciales Actuales**

Tu archivo `.env.local` ya tiene configuradas las credenciales de PayPal:

```bash
PAYPAL_CLIENT_ID=Aa5Ov6t7jZTmTj_hDiSjz89zyTfoeimkivEqJY_9YVJcYT8NHfeI6GsrZoage65UNVYQQ1mLLaByNGh6
PAYPAL_CLIENT_SECRET=Aa5Ov6t7jZTmTj_hDiSjz89zyTfoeimkivEqJY_9YVJcYT8NHfeI6GsrZoage65UNVYQQ1mLLaByNGh6
PAYPAL_MODE=sandbox
```

### **Cuentas de Prueba PayPal Sandbox**

Para probar pagos, necesitas cuentas de prueba. Créalas en:
[https://developer.paypal.com/dashboard/accounts](https://developer.paypal.com/dashboard/accounts)

1. **Cuenta Personal** (comprador): Para hacer compras de prueba
2. **Cuenta Business** (vendedor): Para recibir pagos (ya está configurada con tus credenciales)

---

## 💳 Realizar Pago de Prueba

### **Usando Página Web**
1. Crea orden desde `test-paypal.html`
2. Se abrirá ventana de PayPal Sandbox
3. Inicia sesión con tu cuenta **Personal** de prueba
4. Completa el pago
5. Serás redirigido a la página de éxito

### **Datos de Tarjeta de Prueba (PayPal Sandbox)**

Si prefieres pagar con tarjeta en lugar de cuenta PayPal:

```
Número: 4032 0393 0087 3436
Fecha: Cualquier fecha futura
CVV: 123
```

---

## 🛠️ Comandos Útiles

### **Iniciar Backend**
```bash
npm run dev
```

### **Ver Logs de Pagos**
```bash
tail -f logs/payments.log
```

### **Verificar Webhooks**
```bash
node scripts/check-webhooks.js
```

### **Generar Nuevas Claves de Seguridad**
```bash
npm run generate:keys
```

### **Ejecutar Tests**
```bash
npm test
```

---

## 🔍 Troubleshooting

### **❌ "Puerto 4000 ocupado"**
```bash
pkill -f nodemon
npm run dev
```

### **❌ "PayPal not configured"**
Verifica que `.env.local` tenga las credenciales correctas:
```bash
cat .env.local | grep PAYPAL
```

### **❌ "Database connection error"**
```bash
npm run migrate
npm run seeders
```

### **❌ "Webhook no procesado"**
```bash
node scripts/check-webhooks.js
tail -f logs/payments.log
```

---

## 📊 Verificar Funcionalidades

### **✅ Sistema funcionando**
```bash
curl http://localhost:4000/api/health
# Debe devolver: "status": "OK"
```

### **✅ PayPal configurado**
```bash
curl http://localhost:4000/api/payments/config/paypal
# Debe devolver: "isConfigured": true
```

### **✅ Pasarelas disponibles**
```bash
curl http://localhost:4000/api/payments/gateways
# Debe incluir PayPal en la lista
```

---

## 🎯 Próximos Pasos

Una vez que PayPal funcione correctamente:

### **1. Habilitar MercadoPago**
```bash
# Agregar a .env.local
MERCADOPAGO_ACCESS_TOKEN=tu_token_aqui
MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
```

### **2. Configurar Webhooks Reales**
- Exponer tu servidor con ngrok o similar
- Configurar URLs de webhook en PayPal Developer Dashboard
- Actualizar `WEBHOOK_BASE_URL` en `.env.local`

### **3. Pruebas de Carga**
```bash
# Simular múltiples pagos simultáneos
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/payments/paypal/create-order &
done
```

### **4. Monitoreo de Producción**
- Configurar alertas para pagos fallidos
- Revisar logs de auditoría periódicamente
- Configurar respaldos de base de datos

---

## 📝 Documentación Adicional

- **Guía Completa:** `PAYPAL_TESTING_GUIDE.md`
- **Implementación Técnica:** `IMPLEMENTATION_SUMMARY.md`
- **PayPal Developer Docs:** [https://developer.paypal.com/](https://developer.paypal.com/)

---

## 🚨 Notas Importantes

1. **Sandbox vs Production**: Las credenciales actuales son de SANDBOX. NUNCA uses credenciales de producción en desarrollo.

2. **Seguridad**: Las claves de encriptación deben ser únicas para cada entorno. No compartas las claves de producción.

3. **Webhooks**: En producción, SIEMPRE valida las firmas de los webhooks para evitar fraudes.

4. **Base de Datos**: Realiza backups periódicos de las transacciones de pago.

5. **Logs**: Los logs de pago son críticos para auditorías. No los elimines sin política de retención.

---

**¿Listo para probar?** 🚀

Abre: `http://localhost:4000/test-paypal.html`

¡Todo está configurado y funcionando! 🎉
