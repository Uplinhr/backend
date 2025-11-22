# Informe Técnico del Backend

## 1. Tecnologías Empleadas

El backend está construido sobre un stack moderno basado en **Node.js**, priorizando la escalabilidad, seguridad y modularidad.

### Core & Framework
- **Node.js**: Entorno de ejecución.
- **Express**: Framework web para el manejo de rutas y middleware.
- **ES Modules**: Uso de `import`/`export` nativo (configurado en `package.json` como `"type": "module"`).

### Base de Datos & ORM
- **PostgreSQL**: Sistema de gestión de base de datos relacional (inferido por la URL de conexión).
- **Prisma ORM**: Herramienta para el modelado de datos, migraciones y consultas (`@prisma/client`, `prisma`).

### Seguridad
- **Helmet**: Middleware para configurar cabeceras HTTP seguras.
- **Cors**: Manejo de Cross-Origin Resource Sharing.
- **Bcrypt**: Hashing de contraseñas.
- **Auth0**: Gestión de identidad y autenticación (`auth0`, `express-oauth2-jwt-bearer`, `jwks-rsa`).
- **JWT**: JSON Web Tokens para manejo de sesiones (`jsonwebtoken`).
- **Express Validator & Joi**: Validación de datos de entrada.
- **Express Rate Limit**: Limitación de tasa de peticiones para prevenir abusos.
- **Express Mongo Sanitize & HPP**: Prevención de inyección NoSQL (aunque se usa Postgres, es buena práctica) y contaminación de parámetros HTTP.

### Pagos
- **MercadoPago**: Integración con la pasarela de pagos de MercadoPago (`mercadopago`).
- **PayPal**: SDK para integración con PayPal (`@paypal/checkout-server-sdk`).

### Utilidades & Servicios Externos
- **Resend**: Servicio de envío de correos electrónicos (`resend`).
- **Cloudinary**: Gestión y almacenamiento de imágenes en la nube (`cloudinary`, `multer` para subida de archivos).
- **Winston**: Logger versátil para registro de eventos y errores (`winston`, `winston-daily-rotate-file`).
- **Node Cron**: Programación de tareas recurrentes (`node-cron`), utilizado para facturación y membresías.
- **Dotenv**: Manejo de variables de entorno.

---

## 2. Arquitectura y Funcionamiento de Servicios

El proyecto sigue una **Arquitectura Modular basada en Features** (características). En lugar de agrupar archivos por tipo (todos los controladores juntos, todos los modelos juntos), se agrupan por dominio de negocio dentro de la carpeta `src/features`.

### Estructura General
- **`src/app.js`**: Punto de entrada de la aplicación Express. Configura middlewares globales (CORS, seguridad, logging) y monta las rutas de cada feature.
- **`src/index.js`**: Punto de arranque del servidor. Inicia la escucha en el puerto configurado y arranca cron jobs.
- **`src/features/`**: Contiene la lógica de negocio dividida en módulos. Cada módulo suele tener:
    - `routes.js`: Definición de endpoints.
    - `controller.js`: Manejo de peticiones HTTP.
    - `service.js`: Lógica de negocio pura.
    - `index.js`: Archivo de barril para exportar lo necesario.

### Servicios (Features) Identificados

1.  **Usuarios (`/api/usuarios`)**: Gestión de perfiles de usuario, información personal y preferencias.
2.  **Auth (`/api/auth`)**: Rutas de autenticación, probablemente integración con Auth0 y gestión de sesiones locales si aplica.
3.  **Planes (`/api/planes`)**: Definición y consulta de planes de suscripción disponibles.
4.  **Compra Planes (`/api/compra_planes`)**: Lógica para la adquisición de planes.
5.  **Créditos (`/api/creditos`)**: Gestión de créditos dentro de la plataforma (moneda virtual o sistema de puntos).
6.  **Compra Créditos (`/api/compra_creditos`)**: Adquisición de paquetes de créditos.
7.  **Búsquedas (`/api/busquedas`)**: Motor de búsqueda, posiblemente para encontrar talentos o empresas.
8.  **Empresas (`/api/empresas`)**: Gestión de perfiles corporativos.
9.  **Consultorías (`/api/consultorias`)**: Servicios de consultoría ofrecidos o gestionados en la plataforma.
10. **Consultas (`/api/consultas`)**: Sistema de mensajería o tickets de consulta.
11. **Cart (`/api/cart`)**: Carrito de compras para agrupar productos/servicios antes del pago.
12. **Taxes (`/api/taxes`)**: Cálculo y gestión de impuestos.
13. **Payments (`/api/payments`)**: Orquestador de pagos, integración con pasarelas (MercadoPago, PayPal, Payoneer).
14. **Memberships (`/api/memberships`)**: Gestión del ciclo de vida de las suscripciones (renovaciones, cancelaciones).
15. **Admin (`/api/admin`)**: Funcionalidades administrativas, como búsqueda de talento avanzada.
16. **Webhooks (`/api/webhooks`)**: Endpoints para recibir notificaciones asíncronas de pasarelas de pago u otros servicios externos.

### Tareas Programadas (Cron Jobs)
- **Billing Cron**: Se ejecuta diariamente (por defecto a las 03:00 AM) para procesar renovaciones de membresías y facturación automática.

---

## 3. Requerimientos de Funcionamiento

Para desplegar y ejecutar el backend, es necesario configurar las siguientes variables de entorno. Se recomienda usar el archivo `.env.example` como plantilla.

### Base de Datos
- `DATABASE_URL`: Cadena de conexión a PostgreSQL. Ejemplo: `postgresql://USER:PASSWORD@localhost:5432/uplin_db?schema=public`

### Servidor
- `SERVER_PORT`: Puerto de escucha (default: 4000).
- `DEV`: Booleano (`true`/`false`) para activar modo desarrollo.
- `ALLOWED_ORIGINS`: Orígenes permitidos para CORS.
- `FRONTEND_URL`: URL del frontend para redirecciones y CORS.

### Autenticación (Auth0 & JWT)
- `JWT_SECRET`: Secreto para firmar tokens propios.
- `AUTH0_DOMAIN`: Dominio de Auth0.
- `AUTH0_AUDIENCE`: Identificador de la API en Auth0.
- `AUTH0_CLIENT_ID`: ID de cliente de Auth0.
- `AUTH0_CLIENT_SECRET`: Secreto de cliente de Auth0.
- `AUTH0_REDIRECT_URI`: URL de callback.
- `AUTH0_LOGOUT_REDIRECT_URI`: URL de retorno tras logout.

### Pagos (Pasarelas)
- **MercadoPago**:
    - `MERCADOPAGO_ACCESS_TOKEN`
    - `MERCADOPAGO_PUBLIC_KEY`
    - `MP_ACCESS_TOKEN` (para membresías)
    - `MP_WEBHOOK_SECRET`
- **PayPal**:
    - `PAYPAL_CLIENT_ID`
    - `PAYPAL_CLIENT_SECRET`
    - `PAYPAL_MODE` (`sandbox` o `live`)
- **Payoneer**:
    - `PAYONEER_CLIENT_ID`
    - `PAYONEER_CLIENT_SECRET`
    - `PAYONEER_API_URL`

### Servicios Externos
- **Email (Resend)**:
    - `MAIL_API_KEY`
    - `EMAIL_FROM`
- **Cloudinary (Imágenes)**:
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`

### Seguridad
- `ENCRYPTION_KEY`: Clave de 32 caracteres para encriptación de datos sensibles.
- `WEBHOOK_SECRET`: Secreto para validar firmas de webhooks propios.

### Configuración de Facturación
- `BILLING_CRON`: Expresión cron para la tarea de facturación.
- `BILLING_TIMEZONE`: Zona horaria para el cron.
- `BILLING_MAX_RETRIES`: Intentos máximos de cobro.
- `BILLING_RETRY_INTERVAL_HRS`: Intervalo entre reintentos.
- `BILLING_GRACE_DAYS`: Días de gracia antes de cancelar servicio.
