# Backend Environment Variables Setup

## Crear archivo `.env.local` en la raíz del proyecto `/back`

Copia y pega el siguiente contenido en tu archivo `.env.local`:

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/uplin_db

# ============================================
# SERVER
# ============================================
SERVER_PORT=4000
DEV=true
FRONTEND_URL=http://localhost:3001

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=tu-secreto-jwt-super-seguro-minimo-32-caracteres-aleatorios

# ============================================
# AUTH0 (Opcional - para validar tokens)
# ============================================
AUTH0_DOMAIN=tu-tenant.auth0.com
AUTH0_AUDIENCE=https://api.gemit.tech

# ============================================
# PAYMENT GATEWAYS - MERCADOPAGO
# ============================================
MP_ACCESS_TOKEN=tu-mercadopago-access-token
MP_PUBLIC_KEY=tu-mercadopago-public-key

# ============================================
# PAYMENT GATEWAYS - PAYPAL
# ============================================
PAYPAL_CLIENT_ID=tu-paypal-client-id
PAYPAL_CLIENT_SECRET=tu-paypal-client-secret
PAYPAL_MODE=sandbox  # o 'live' en producción

# ============================================
# PAYMENT GATEWAYS - PAYONEER (Opcional)
# ============================================
PAYONEER_API_KEY=tu-payoneer-api-key
PAYONEER_PARTNER_ID=tu-payoneer-partner-id

# ============================================
# WEBHOOKS
# ============================================
# Para desarrollo local, usa localhost
# Para ngrok (webhooks de pagos), usa tu URL de ngrok
WEBHOOK_BASE_URL=http://localhost:4000
# O si usas ngrok para webhooks:
# WEBHOOK_BASE_URL=https://tu-subdominio.ngrok-free.dev

# ============================================
# BILLING & CRON JOBS
# ============================================
BILLING_CRON_ENABLED=true
BILLING_CRON_TIME=0 0 * * *  # Cada día a las 00:00
BILLING_RETRY_ATTEMPTS=3
BILLING_RETRY_DELAY_MS=5000

# ============================================
# IMAGE UPLOAD - CLOUDINARY
# ============================================
CLOUDINARY_CLOUD_NAME=tu-cloudinary-cloud-name
CLOUDINARY_API_KEY=tu-cloudinary-api-key
CLOUDINARY_API_SECRET=tu-cloudinary-api-secret

# ============================================
# EMAIL SERVICE - RESEND
# ============================================
RESEND_API_KEY=tu-resend-api-key
RESEND_FROM_EMAIL=noreply@uplin.tech

# ============================================
# ENCRYPTION (Seguridad)
# ============================================
ENCRYPTION_KEY=tu-clave-encriptacion-32-caracteres-aleatorios

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=debug  # debug, info, warn, error
LOG_FILE_PATH=./logs
```

## Pasos para configurar:

### 1. **Base de datos PostgreSQL**
```bash
# Crear la base de datos
createdb uplin_db

# Configurar en DATABASE_URL
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/uplin_db
```

### 2. **JWT Secret**
Genera una clave segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copia el resultado en `JWT_SECRET`

### 3. **MercadoPago**
1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Obtén `Access Token` y `Public Key` de tu aplicación
3. Configura en `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY`

### 4. **PayPal**
1. Ve a [PayPal Developer](https://developer.paypal.com)
2. Crea una aplicación
3. Obtén `Client ID` y `Client Secret`
4. Configura en `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`
5. Usa `PAYPAL_MODE=sandbox` para pruebas

### 5. **Auth0 (Opcional)**
1. Ve a tu dashboard de Auth0
2. Copia el `Domain` en `AUTH0_DOMAIN`
3. Ve a **APIs > Your API > Settings**
4. Copia el `Identifier` en `AUTH0_AUDIENCE` (debe ser `https://api.gemit.tech`)

### 6. **Cloudinary (Para subir imágenes)**
1. Ve a [Cloudinary](https://cloudinary.com)
2. Obtén `Cloud Name`, `API Key` y `API Secret`
3. Configura en `CLOUDINARY_*`

### 7. **Resend (Para enviar emails)**
1. Ve a [Resend](https://resend.com)
2. Obtén tu `API Key`
3. Configura en `RESEND_API_KEY` y `RESEND_FROM_EMAIL`

### 8. **Webhooks**
- **Desarrollo local**: `WEBHOOK_BASE_URL=http://localhost:4000`
- **Con ngrok**: `WEBHOOK_BASE_URL=https://tu-subdominio.ngrok-free.dev`

Para usar ngrok:
```bash
# En otra terminal
ngrok http 4000

# Copia la URL pública y úsala en WEBHOOK_BASE_URL
```

### 9. **Encryption Key**
Genera una clave segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copia el resultado en `ENCRYPTION_KEY`

## Verificación rápida

Después de configurar `.env.local`:

1. **Instala dependencias:**
   ```bash
   npm install
   ```

2. **Ejecuta migraciones de Prisma:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. **Ejecuta el seed (crear usuarios de prueba):**
   ```bash
   node src/database/seed.js
   ```

4. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

5. **Verifica que esté corriendo:**
   ```bash
   curl http://localhost:4000/api/health
   ```
   Debe devolver:
   ```json
   {
     "status": "OK",
     "message": "Servidor funcionando en puerto 4000",
     "timestamp": "2024-11-18T..."
   }
   ```

## Usuarios de prueba creados por seed

Después de ejecutar el seed, puedes usar:

- **Admin:**
  - Email: `admin@uplin.test`
  - Contraseña: `admin123`
  - Rol: ADMINISTRADOR

- **Cliente:**
  - Email: `cliente@uplin.test`
  - Contraseña: `client123`
  - Rol: CLIENTE

## Notas importantes

- **Nunca commits `.env.local`**: Está en `.gitignore` por seguridad
- **DEV=true**: Permite CORS más permisivo y logs detallados
- **JWT_SECRET y ENCRYPTION_KEY**: Deben ser diferentes y aleatorios
- **Webhooks**: Solo necesitas ngrok si vas a probar pagos reales
- **Auth0 es opcional**: El login local funciona sin Auth0

## Troubleshooting

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Verifica que `DATABASE_URL` sea correcto
- Intenta: `psql postgresql://usuario:contraseña@localhost:5432/uplin_db`

### Error: "Unexpected token 'const'" en memberships/service.js
- Ya fue corregido en versiones recientes
- Si persiste, ejecuta: `npm install`

### Error: "AUTH0_AUDIENCE is not defined"
- Auth0 es opcional. Si no lo usas, déjalo vacío
- El middleware fallará silenciosamente en dev

### Error: "CORS header missing"
- Verifica que `FRONTEND_URL=http://localhost:3001` sea correcto
- Reinicia el backend
- Verifica que el frontend esté en puerto 3001

## Próximos pasos

1. Configura todas las variables de entorno
2. Ejecuta migraciones y seed
3. Inicia el backend: `npm run dev`
4. Inicia el frontend: `npm run dev` (en otra terminal, carpeta `/front`)
5. Prueba login en `http://localhost:3001/login`
