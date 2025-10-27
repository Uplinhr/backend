# 🧪 Guía Completa de Pruebas - Sistema de Pagos MercadoPago

## 📋 **Índice**
1. [Pruebas con Postman (Recomendado)](#pruebas-con-postman)
2. [Pruebas con Página Web](#pruebas-con-página-web)
3. [Pruebas con cURL](#pruebas-con-curl)
4. [Verificación de Errores](#verificación-de-errores)

---

## 🚀 **Pruebas con Postman** (Recomendado)

### **Paso 1: Health Check**

**Verificar que el servidor esté funcionando**

```
GET http://localhost:4000/api/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "message": "Servidor funcionando en puerto 4000",
  "timestamp": "2025-10-13T21:47:59.884Z"
}
```

---

### **Paso 2: Verificar Configuración de MercadoPago**

**Confirmar que MercadoPago está configurado correctamente**

```
GET http://localhost:4000/api/payments/config/mercadopago
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "configured": true,
    "webhookUrl": "http://your-domain.com/api/webhooks/mercadopago",
    "mode": "development"
  }
}
```

✅ **Verificación**: `data.configured` debe ser `true`

---

### **Paso 3: Crear Carrito de Prueba**

**Crear un carrito nuevo sin autenticación**

```
POST http://localhost:4000/api/cart/test
Content-Type: application/json

{
  "userId": 1,
  "currency": "ARS"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Carrito de prueba creado exitosamente",
  "data": {
    "cartId": "635988f7-3059-4de7-9753-4b698794955a",
    "cartUUID": "635988f7-3059-4de7-9753-4b698794955a"
  }
}
```

✅ **Acción**: **GUARDAR** el `cartId` para los siguientes pasos

---

### **Paso 4: Agregar Servicio al Carrito**

**Agregar un servicio de búsqueda de talento**

```
POST http://localhost:4000/api/cart/{CART_ID}/test/items
Content-Type: application/json

{
  "serviceType": "talent_search",
  "serviceId": 1,
  "quantity": 1
}
```

**Reemplazar `{CART_ID}` con el ID del paso anterior**

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Item de prueba agregado exitosamente",
  "data": {
    "cart_uuid": "635988f7-3059-4de7-9753-4b698794955a",
    "id_usuario": 1,
    "status": "active",
    "currency": "ARS",
    "subtotal": "720.00",
    "tax_amount": "151.20",
    "total_amount": "871.20",
    "items": [
      {
        "id": 123,
        "item_name": "Single Hire",
        "quantity": 1,
        "unit_price": "720.00",
        "subtotal": "720.00",
        "tax_amount": "151.20",
        "total": "871.20"
      }
    ],
    "item_count": 1
  }
}
```

✅ **Verificación**: El carrito debe tener 1 item con el servicio agregado

---

### **Paso 5: Calcular Total del Carrito**

**Ver el resumen con IVA calculado**

```
GET http://localhost:4000/api/cart/{CART_ID}/test/total
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "cart_uuid": "635988f7-3059-4de7-9753-4b698794955a",
    "subtotal": 720.00,
    "tax_amount": 151.20,
    "discount_amount": 0,
    "total": 871.20,
    "currency": "ARS",
    "country_code": "ARG",
    "item_count": 1
  }
}
```

✅ **Verificación**:
- Subtotal: $720.00
- IVA (21%): $151.20
- Total: $871.20

---

### **Paso 6: Crear Orden de Pago en MercadoPago**

**Generar orden de pago en MercadoPago**

```
POST http://localhost:4000/api/payments/mercadopago/create-order
Content-Type: application/json

{
  "cartId": "{CART_ID}",
  "currency": "ARS",
  "returnUrl": "http://localhost:4000/payment/success",
  "cancelUrl": "http://localhost:4000/payment/cancel"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Orden MercadoPago creada exitosamente",
  "data": {
    "mpOrderId": "MP-TEST-1760391864225",
    "initPoint": "https://www.mercadopago.com/checkout/v1/redirect?pref_id=MP-TEST-1760391864225",
    "sandboxInitPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=MP-TEST-1760391864225",
    "totalAmount": "871.20",
    "currency": "ARS"
  }
}
```

✅ **Acción**: Copia la `sandboxInitPoint` y ábrela en tu navegador para simular el pago

---

### **Paso 7: Simular Webhook de MercadoPago**

**Simular notificación de pago completado**

```
POST http://localhost:4000/api/payments/webhook/test/mercadopago
Content-Type: application/json

{
  "eventType": "payment.updated",
  "paymentId": "MP-TEST-1760391864225",
  "orderId": "TEST-1760391864225"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Webhook de MercadoPago simulado exitosamente",
  "data": {
    "webhookId": "WH-MP-1760391900000",
    "eventType": "payment.updated",
    "paymentId": "MP-TEST-1760391864225",
    "orderId": "TEST-1760391864225",
    "processed": true
  }
}
```

---

### **Paso 8: Ver Estado de Webhooks**

**Verificar webhooks procesados**

```
GET http://localhost:4000/api/payments/webhooks/status
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "pending": 0,
    "processed": 1,
    "failed": 0,
    "total": 1
  }
}
```

---

### **Paso 9: Ver Estadísticas de Pagos**

**Obtener métricas del sistema**

```
GET http://localhost:4000/api/payments/stats
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "totalPayments": 1,
    "totalAmount": 871.20,
    "successRate": "100"
  }
}
```

---

### **Paso 10: Verificar Seguridad**

**Confirmar que las capas de seguridad están activas**

```
GET http://localhost:4000/api/payments/security/test
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "encryption": "AES-256-GCM",
    "rateLimiting": "enabled",
    "audit": "enabled",
    "helmet": "enabled",
    "cors": "configured",
    "inputValidation": "enabled"
  }
}
```

---

## 🌐 **Pruebas con Página Web**

### **Acceso:**
```
http://localhost:4000/test-mercadopago.html
```

### **Flujo de Prueba:**

1. **✅ Verificación Automática**
   - La página carga automáticamente el estado del sistema
   - Verifica la configuración de MercadoPago

2. **🛒 Crear Carrito**
   - Clic en "Crear Carrito de Prueba"
   - Verás el ID del carrito creado

3. **➕ Agregar Servicio**
   - Clic en "Agregar Item de Prueba"
   - Se agrega un servicio de búsqueda de talento

4. **💰 Calcular Total**
   - Clic en "Calcular Total"
   - Verás: Subtotal + IVA = Total

5. **💳 Procesar Pago**
   - Clic en "Procesar Pago MercadoPago"
   - Se muestra la URL de MercadoPago
   - Clic en el enlace para abrir MercadoPago

6. **🔍 Probar Webhooks**
   - Clic en "Simular Webhook MercadoPago"
   - Verifica el estado con "Ver Estado Webhooks"

---

## 🖥️ **Pruebas con cURL**

### **Flujo Completo:**

```bash
# 1. Health Check
curl -s http://localhost:4000/api/health | jq .

# 2. Verificar MercadoPago
curl -s http://localhost:4000/api/payments/config/mercadopago | jq .

# 3. Crear Carrito
CART_RESPONSE=$(curl -s -X POST http://localhost:4000/api/cart/test \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "currency": "ARS"}')

# Extraer cartId
CART_ID=$(echo $CART_RESPONSE | jq -r '.data.cartId')
echo "Cart ID: $CART_ID"

# 4. Agregar Item
curl -s -X POST http://localhost:4000/api/cart/$CART_ID/test/items \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "talent_search", "serviceId": 1, "quantity": 1}' | jq .

# 5. Calcular Total
curl -s http://localhost:4000/api/cart/$CART_ID/test/total | jq .

# 6. Crear Orden MercadoPago
curl -s -X POST http://localhost:4000/api/payments/mercadopago/create-order \
  -H "Content-Type: application/json" \
  -d "{
    \"cartId\": \"$CART_ID\",
    \"currency\": \"ARS\",
    \"returnUrl\": \"http://localhost:4000/payment/success\",
    \"cancelUrl\": \"http://localhost:4000/payment/cancel\"
  }" | jq .

# 7. Simular Webhook
curl -s -X POST http://localhost:4000/api/payments/webhook/test/mercadopago \
  -H "Content-Type: application/json" \
  -d "{
    \"eventType\": \"payment.updated\",
    \"paymentId\": \"MP-TEST-$(date +%s)\",
    \"orderId\": \"TEST-$(date +%s)\"
  }" | jq .
```

---

## ⚠️ **Verificación de Errores**

### **Error 1: Carrito no se crea**

**Síntoma:**
```json
{
  "success": false,
  "error": {
    "code": "CREATE_TEST_CART_ERROR",
    "message": "Error creando carrito de prueba",
    "details": "..."
  }
}
```

**Solución:**
```bash
# Verificar que la base de datos existe
mysql -u root -padmin -e "SHOW DATABASES LIKE 'uplindb';"

# Verificar que la tabla existe
mysql -u root -padmin -e "USE uplindb; SHOW TABLES LIKE 'shopping_cart';"

# Si no existe, ejecutar migraciones
npm run migrate
```

---

### **Error 2: No se puede agregar item**

**Síntoma:**
```json
{
  "success": false,
  "error": {
    "code": "ADD_TEST_ITEM_ERROR",
    "message": "Error agregando item de prueba",
    "details": "..."
  }
}
```

**Solución:**
```bash
# Verificar que el servicio existe
mysql -u root -padmin -e "USE uplindb; SELECT * FROM talent_search_services WHERE id = 1;"

# Si no existe, crear servicio de prueba
mysql -u root -padmin -e "USE uplindb; INSERT INTO talent_search_services (id, service_name, base_price, discount_percentage, active) VALUES (1, 'Single Hire', 720.00, 0, 1);"
```

---

### **Error 3: MercadoPago no configurado**

**Síntoma:**
```json
{
  "data": {
    "configured": false
  }
}
```

**Solución:**
```bash
# Verificar variables de entorno
cat .env.local | grep MERCADOPAGO

# Deben existir:
# MERCADOPAGO_ACCESS_TOKEN=...
# MERCADOPAGO_PUBLIC_KEY=...

# Reiniciar servidor
npm run dev
```

---

## 📊 **Datos de Prueba Disponibles**

### **Usuarios:**
```sql
SELECT id, email, nombre FROM usuarios LIMIT 5;
-- ID 1: admin@gmail.com
-- ID 2: admin2@gmail.com
-- ID 3: admin3@gmail.com
```

### **Servicios de Búsqueda:**
```sql
SELECT id, service_name, base_price FROM talent_search_services;
-- ID 1: Single Hire - $720.00
-- ID 2: Pro - $3960.00 (5% descuento)
-- ID 3: Premium - $5940.00 (10% descuento)
-- ID 4: Platinum - $7920.00 (15% descuento)
```

### **Tarjeta de Prueba MercadoPago:**
```
Número: 4074 0950 0000 0001
Fecha: 12/2027 (cualquier fecha futura)
CVV: 123
Nombre: Test User
DNI: 12345678
```

---

## 🎯 **Colección de Postman para MercadoPago**

### **Importar esta colección en Postman:**

```json
{
  "info": {
    "name": "Sistema de Pagos MercadoPago - Uplin",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:4000/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "2. Config MercadoPago",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:4000/api/payments/config/mercadopago",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "payments", "config", "mercadopago"]
        }
      }
    },
    {
      "name": "3. Crear Carrito",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": 1,\n  \"currency\": \"ARS\"\n}"
        },
        "url": {
          "raw": "http://localhost:4000/api/cart/test",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "cart", "test"]
        }
      }
    },
    {
      "name": "4. Agregar Item",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"serviceType\": \"talent_search\",\n  \"serviceId\": 1,\n  \"quantity\": 1\n}"
        },
        "url": {
          "raw": "http://localhost:4000/api/cart/{{cartId}}/test/items",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "cart", "{{cartId}}", "test", "items"]
        }
      }
    },
    {
      "name": "5. Calcular Total",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:4000/api/cart/{{cartId}}/test/total",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "cart", "{{cartId}}", "test", "total"]
        }
      }
    },
    {
      "name": "6. Crear Orden MercadoPago",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"cartId\": \"{{cartId}}\",\n  \"currency\": \"ARS\",\n  \"returnUrl\": \"http://localhost:4000/payment/success\",\n  \"cancelUrl\": \"http://localhost:4000/payment/cancel\"\n}"
        },
        "url": {
          "raw": "http://localhost:4000/api/payments/mercadopago/create-order",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "payments", "mercadopago", "create-order"]
        }
      }
    },
    {
      "name": "7. Simular Webhook",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"eventType\": \"payment.updated\",\n  \"paymentId\": \"MP-TEST-{{timestamp}}\",\n  \"orderId\": \"TEST-{{timestamp}}\"\n}"
        },
        "url": {
          "raw": "http://localhost:4000/api/payments/webhook/test/mercadopago",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "payments", "webhook", "test", "mercadopago"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "cartId",
      "value": "",
      "type": "string"
    },
    {
      "key": "timestamp",
      "value": "{{$timestamp}}",
      "type": "string"
    }
  ]
}
```

---

## ✅ **Checklist de Verificación**

Antes de probar, asegúrate de que:

- [ ] El servidor está corriendo en `http://localhost:4000`
- [ ] La base de datos `uplindb` existe y tiene las tablas
- [ ] Las variables de entorno de MercadoPago están configuradas en `.env.local`
- [ ] Existe al menos un usuario con ID 1 en la tabla `usuarios`
- [ ] Existe al menos un servicio con ID 1 en `talent_search_services`

**Verificación rápida:**
```bash
# Verificar servidor
curl -s http://localhost:4000/api/health | jq '.status'
# Debe devolver: "OK"

# Verificar MercadoPago
curl -s http://localhost:4000/api/payments/config/mercadopago | jq '.data.configured'
# Debe devolver: true
```

---

## 🎉 **¡Listo para Probar!**

**Página Web:** http://localhost:4000/test-mercadopago.html

**Postman:** Importa la colección JSON de arriba

**cURL:** Copia y pega los comandos del flujo completo

¡Todo está configurado y funcionando! 🚀

---

## 🚀 **Pruebas con Postman** (Recomendado)

### **Paso 1: Health Check**

**Verificar que el servidor esté funcionando**

```
GET http://localhost:4000/api/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "message": "Servidor funcionando en puerto 4000",
  "timestamp": "2025-10-13T21:47:59.884Z"
}
```

---

### **Paso 2: Verificar Configuración de PayPal**

**Confirmar que PayPal está configurado correctamente**

```
GET http://localhost:4000/api/payments/config/paypal
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "mode": "sandbox",
    "clientId": "Aa5Ov6t7jZTmTj_hDiSjz89zyTfoeimkivEqJY_9YVJcYT8NHfeI6GsrZoage65UNVYQQ1mLLaByNGh6",
    "isConfigured": true
  }
}
```

✅ **Verificación**: `data.isConfigured` debe ser `true`

---

### **Paso 3: Crear Carrito de Prueba**

**Crear un carrito nuevo sin autenticación**

```
POST http://localhost:4000/api/cart/test
Content-Type: application/json

{
  "userId": 1,
  "currency": "USD"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Carrito de prueba creado exitosamente",
  "data": {
    "cartId": "635988f7-3059-4de7-9753-4b698794955a",
    "cartUUID": "635988f7-3059-4de7-9753-4b698794955a"
  }
}
```

✅ **Acción**: **GUARDAR** el `cartId` para los siguientes pasos

---

### **Paso 4: Agregar Servicio al Carrito**

**Agregar un servicio de búsqueda de talento**

```
POST http://localhost:4000/api/cart/{CART_ID}/test/items
Content-Type: application/json

{
  "serviceType": "talent_search",
  "serviceId": 1,
  "quantity": 1
}
```

**Reemplazar `{CART_ID}` con el ID del paso anterior**

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Item de prueba agregado exitosamente",
  "data": {
    "cart_uuid": "635988f7-3059-4de7-9753-4b698794955a",
    "id_usuario": 1,
    "status": "active",
    "currency": "USD",
    "subtotal": "720.00",
    "tax_amount": "151.20",
    "total_amount": "871.20",
    "items": [
      {
        "id": 123,
        "item_name": "Single Hire",
        "quantity": 1,
        "unit_price": "720.00",
        "subtotal": "720.00",
        "tax_amount": "151.20",
        "total": "871.20"
      }
    ],
    "item_count": 1
  }
}
```

✅ **Verificación**: El carrito debe tener 1 item con el servicio agregado

---

### **Paso 5: Calcular Total del Carrito**

**Ver el resumen con IVA calculado**

```
GET http://localhost:4000/api/cart/{CART_ID}/test/total
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "cart_uuid": "635988f7-3059-4de7-9753-4b698794955a",
    "subtotal": 720.00,
    "tax_amount": 151.20,
    "discount_amount": 0,
    "total": 871.20,
    "currency": "USD",
    "country_code": "ARG",
    "item_count": 1
  }
}
```

✅ **Verificación**: 
- Subtotal: $720.00
- IVA (21%): $151.20
- Total: $871.20

---

### **Paso 6: Crear Orden de Pago en PayPal**

**Generar orden de pago en PayPal Sandbox**

```
POST http://localhost:4000/api/payments/paypal/create-order
Content-Type: application/json

{
  "cartId": "{CART_ID}",
  "currency": "USD",
  "returnUrl": "http://localhost:4000/payment/success",
  "cancelUrl": "http://localhost:4000/payment/cancel"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Orden PayPal creada exitosamente",
  "data": {
    "paypalOrderId": "TEST-1760391864225",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=TEST-1760391864225",
    "totalAmount": "871.20",
    "currency": "USD"
  }
}
```

✅ **Acción**: Copia la `approvalUrl` y ábrela en tu navegador para simular el pago

---

### **Paso 7: Simular Webhook de PayPal**

**Simular notificación de pago completado**

```
POST http://localhost:4000/api/payments/webhook/test/paypal
Content-Type: application/json

{
  "eventType": "PAYMENT.CAPTURE.COMPLETED",
  "orderId": "TEST-1760391864225"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "webhookId": "WH-1760391900000",
    "eventType": "PAYMENT.CAPTURE.COMPLETED",
    "orderId": "TEST-1760391864225",
    "processed": true
  }
}
```

---

### **Paso 8: Ver Estado de Webhooks**

**Verificar webhooks procesados**

```
GET http://localhost:4000/api/payments/webhooks/status
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "pending": 0,
    "processed": 1,
    "failed": 0,
    "total": 1
  }
}
```

---

### **Paso 9: Ver Estadísticas de Pagos**

**Obtener métricas del sistema**

```
GET http://localhost:4000/api/payments/stats
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "totalPayments": 0,
    "totalAmount": 0,
    "successRate": "0"
  }
}
```

---

### **Paso 10: Verificar Seguridad**

**Confirmar que las capas de seguridad están activas**

```
GET http://localhost:4000/api/payments/security/test
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "encryption": "AES-256-GCM",
    "rateLimiting": "enabled",
    "audit": "enabled",
    "helmet": "enabled",
    "cors": "configured",
    "inputValidation": "enabled"
  }
}
```

---

## 🌐 **Pruebas con Página Web**

### **Acceso:**
```
http://localhost:4000/test-paypal.html
```

### **Flujo de Prueba:**

1. **✅ Verificación Automática**
   - La página carga automáticamente el estado del sistema
   - Verifica la configuración de PayPal

2. **🛒 Crear Carrito**
   - Clic en "Crear Carrito de Prueba"
   - Verás el ID del carrito creado

3. **➕ Agregar Servicio**
   - Clic en "Agregar Item de Prueba"
   - Se agrega un servicio de búsqueda de talento

4. **💰 Calcular Total**
   - Clic en "Calcular Total"
   - Verás: Subtotal + IVA = Total

5. **💳 Procesar Pago**
   - Clic en "Procesar Pago PayPal"
   - Se muestra la URL de PayPal Sandbox
   - Clic en el enlace para abrir PayPal

6. **🔍 Probar Webhooks**
   - Clic en "Simular Webhook PayPal"
   - Verifica el estado con "Ver Estado Webhooks"

---

## 🖥️ **Pruebas con cURL**

### **Flujo Completo:**

```bash
# 1. Health Check
curl -s http://localhost:4000/api/health | jq .

# 2. Verificar PayPal
curl -s http://localhost:4000/api/payments/config/paypal | jq .

# 3. Crear Carrito
CART_RESPONSE=$(curl -s -X POST http://localhost:4000/api/cart/test \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "currency": "USD"}')

# Extraer cartId
CART_ID=$(echo $CART_RESPONSE | jq -r '.data.cartId')
echo "Cart ID: $CART_ID"

# 4. Agregar Item
curl -s -X POST http://localhost:4000/api/cart/$CART_ID/test/items \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "talent_search", "serviceId": 1, "quantity": 1}' | jq .

# 5. Calcular Total
curl -s http://localhost:4000/api/cart/$CART_ID/test/total | jq .

# 6. Crear Orden PayPal
curl -s -X POST http://localhost:4000/api/payments/paypal/create-order \
  -H "Content-Type: application/json" \
  -d "{
    \"cartId\": \"$CART_ID\",
    \"currency\": \"USD\",
    \"returnUrl\": \"http://localhost:4000/payment/success\",
    \"cancelUrl\": \"http://localhost:4000/payment/cancel\"
  }" | jq .
```

---

## ⚠️ **Verificación de Errores**

### **Error 1: Carrito no se crea**

**Síntoma:**
```json
{
  "success": false,
  "error": {
    "code": "CREATE_TEST_CART_ERROR",
    "message": "Error creando carrito de prueba",
    "details": "..."
  }
}
```

**Solución:**
```bash
# Verificar que la base de datos existe
mysql -u root -padmin -e "SHOW DATABASES LIKE 'uplindb';"

# Verificar que la tabla existe
mysql -u root -padmin -e "USE uplindb; SHOW TABLES LIKE 'shopping_cart';"

# Si no existe, ejecutar migraciones
npm run migrate
```

---

### **Error 2: No se puede agregar item**

**Síntoma:**
```json
{
  "success": false,
  "error": {
    "code": "ADD_TEST_ITEM_ERROR",
    "message": "Error agregando item de prueba",
    "details": "..."
  }
}
```

**Solución:**
```bash
# Verificar que el servicio existe
mysql -u root -padmin -e "USE uplindb; SELECT * FROM talent_search_services WHERE id = 1;"

# Si no existe, crear servicio de prueba
mysql -u root -padmin -e "USE uplindb; INSERT INTO talent_search_services (id, service_name, base_price, discount_percentage, active) VALUES (1, 'Single Hire', 720.00, 0, 1);"
```

---

### **Error 3: PayPal no configurado**

**Síntoma:**
```json
{
  "data": {
    "isConfigured": false
  }
}
```

**Solución:**
```bash
# Verificar variables de entorno
cat .env.local | grep PAYPAL

# Deben existir:
# PAYPAL_CLIENT_ID=...
# PAYPAL_CLIENT_SECRET=...
# PAYPAL_MODE=sandbox

# Reiniciar servidor
npm run dev
```

---

## 📊 **Datos de Prueba Disponibles**

### **Usuarios:**
```sql
SELECT id, email, nombre FROM usuarios LIMIT 5;
-- ID 1: admin@gmail.com
-- ID 2: admin2@gmail.com
-- ID 3: admin3@gmail.com
```

### **Servicios de Búsqueda:**
```sql
SELECT id, service_name, base_price FROM talent_search_services;
-- ID 1: Single Hire - $720.00
-- ID 2: Pro - $3960.00 (5% descuento)
-- ID 3: Premium - $5940.00 (10% descuento)
-- ID 4: Platinum - $7920.00 (15% descuento)
```

### **Tarjeta de Prueba PayPal:**
```
Número: 4032 0393 0087 3436
Fecha: 12/2027 (cualquier fecha futura)
CVV: 123
Nombre: Test User
```

---

## 🎯 **Colección de Postman**

### **Importar esta colección en Postman:**

```json
{
  "info": {
    "name": "Sistema de Pagos PayPal - Uplin",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:4000/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "2. Config PayPal",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:4000/api/payments/config/paypal",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "payments", "config", "paypal"]
        }
      }
    },
    {
      "name": "3. Crear Carrito",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": 1,\n  \"currency\": \"USD\"\n}"
        },
        "url": {
          "raw": "http://localhost:4000/api/cart/test",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "cart", "test"]
        }
      }
    },
    {
      "name": "4. Agregar Item",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"serviceType\": \"talent_search\",\n  \"serviceId\": 1,\n  \"quantity\": 1\n}"
        },
        "url": {
          "raw": "http://localhost:4000/api/cart/{{cartId}}/test/items",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "cart", "{{cartId}}", "test", "items"]
        }
      }
    },
    {
      "name": "5. Calcular Total",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:4000/api/cart/{{cartId}}/test/total",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "cart", "{{cartId}}", "test", "total"]
        }
      }
    },
    {
      "name": "6. Crear Orden PayPal",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"cartId\": \"{{cartId}}\",\n  \"currency\": \"USD\",\n  \"returnUrl\": \"http://localhost:4000/payment/success\",\n  \"cancelUrl\": \"http://localhost:4000/payment/cancel\"\n}"
        },
        "url": {
          "raw": "http://localhost:4000/api/payments/paypal/create-order",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "payments", "paypal", "create-order"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "cartId",
      "value": "",
      "type": "string"
    }
  ]
}
```

---

## ✅ **Checklist de Verificación**

Antes de probar, asegúrate de que:

- [ ] El servidor está corriendo en `http://localhost:4000`
- [ ] La base de datos `uplindb` existe y tiene las tablas
- [ ] Las variables de entorno de PayPal están configuradas en `.env.local`
- [ ] Existe al menos un usuario con ID 1 en la tabla `usuarios`
- [ ] Existe al menos un servicio con ID 1 en `talent_search_services`

**Verificación rápida:**
```bash
# Verificar servidor
curl -s http://localhost:4000/api/health | jq '.status'
# Debe devolver: "OK"

# Verificar PayPal
curl -s http://localhost:4000/api/payments/config/paypal | jq '.data.isConfigured'
# Debe devolver: true
```

---

## 🎉 **¡Listo para Probar!**

**Página Web:** http://localhost:4000/test-paypal.html

**Postman:** Importa la colección JSON de arriba

**cURL:** Copia y pega los comandos del flujo completo

¡Todo está configurado y funcionando! 🚀
