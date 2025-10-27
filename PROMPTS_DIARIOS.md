# PROMPTS DIARIOS PARA IMPLEMENTACIÓN

---

## 🎯 PROMPT LUNES (DÍA 1) - ANÁLISIS Y CONFIGURACIÓN DE BASE DE DATOS

```
CONTEXTO: Inicio de migración completa del proyecto backend a PostgreSQL con Prisma ORM. He revisado el INFORME_SEGURIDAD_COMPLETO.md que identifica vulnerabilidades críticas.

OBJETIVO DEL DÍA: Configurar PostgreSQL y Prisma ORM con esquema seguro y escalable.

TAREAS PRIORITARIAS:

1. ANÁLISIS COMPLETO DEL PROYECTO:
   - Analiza la estructura en /home/omar/Pasantias/Uplin/Repositorios/back/back/
   - Identifica todos los modelos de datos actuales
   - Mapea rutas y endpoints existentes
   - Revisa middleware de autenticación actual
   - Documenta dependencias y versiones

2. CONFIGURACIÓN DE POSTGRESQL:
   - Instala PostgreSQL si no existe
   - Crea base de datos con nombre apropiado
   - Configura credenciales seguras
   - Habilita SSL para conexiones
   - Establece políticas de backup

3. CONFIGURACIÓN DE PRISMA ORM:
   - Instala Prisma CLI: npm install -D prisma @prisma/client
   - Inicializa Prisma: npx prisma init
   - Configura .env con DATABASE_URL seguro
   - Crea schema.prisma con modelos:
     * User (integración Auth0)
     * Plan/Subscription
     * Transaction/Payment
     * TaxConfig
     * Consultant
     * TalentSearchService
     * Otros identificados en análisis

4. MEJORAS DE SEGURIDAD EN ESQUEMA:
   - Agrega campos de auditoría (createdAt, updatedAt, deletedAt)
   - Define índices para optimización
   - Implementa constraints de integridad
   - Marca campos sensibles para encriptación
   - Agrega validaciones a nivel de esquema

5. PRIMERA MIGRACIÓN:
   - Genera migración: npx prisma migrate dev --name init
   - Verifica estructura en PostgreSQL
   - Genera Prisma Client: npx prisma generate
   - Prueba conexión básica

CONSIDERACIONES DE SEGURIDAD:
- NO exponer información sensible en logs
- Usar variables de entorno para credenciales
- Implementar soft deletes para auditoría
- Preparar campos para encriptación
- Configurar límites de consultas

ENTREGABLES:
- PostgreSQL funcionando
- schema.prisma completo y documentado
- Primera migración exitosa
- .env.example con documentación
- Documento de análisis de estructura

RESTRICCIONES:
- NO eliminar código existente (solo análisis)
- NO exponer credenciales
- Seguir convenciones de Prisma
- Documentar decisiones de diseño

Procede paso a paso, reportando cada avance.
```

---

## 🎯 PROMPT MARTES (DÍA 2) - MIGRACIÓN Y SEGURIDAD

```
CONTEXTO: PostgreSQL y Prisma configurados con esquema completo. Hoy migraremos datos y fortaleceremos seguridad.

ESTADO ACTUAL:
- PostgreSQL configurado
- schema.prisma con todos los modelos
- Primera migración ejecutada
- Base de datos lista para datos

OBJETIVO DEL DÍA: Migrar datos existentes e implementar validaciones y logging profesional.

TAREAS PRIORITARIAS:

1. MIGRACIÓN DE DATOS:
   - Analiza seeders en src/database/seeders/
   - Revisa archivos SQL (03-tax-config.sql, 04-talent-search-services.sql, 05-consultants.sql, 06-update-planes.sql)
   - Convierte seeders SQL a formato Prisma
   - Implementa validaciones durante migración
   - Agrega manejo de errores con rollback
   - Ejecuta migración verificando integridad
   - Crea seeds de prueba para desarrollo

2. IMPLEMENTACIÓN DE VALIDACIONES:
   - Instala: npm install express-validator helmet express-rate-limit
   - Crea src/middleware/validation.js:
     * Validación de tipos
     * Sanitización contra inyecciones
     * Validación de formatos (email, teléfono)
     * Límites de tamaño de requests
   - Implementa rate limiting
   - Agrega helmet para headers de seguridad

3. SISTEMA DE LOGGING CON WINSTON:
   - Instala: npm install winston winston-daily-rotate-file
   - Crea src/config/logger.js:
     * Niveles: error, warn, info, http, debug
     * Formato con timestamps
     * Rotación diaria de archivos
     * Logs separados (errors.log, combined.log)
   - Implementa filtrado de datos sensibles
   - Configura logging de auditoría
   - Integra con middleware de errores

4. MEJORA DEL MIDDLEWARE DE ERRORES:
   - Actualiza src/app.js (líneas 96-115):
     * Reemplaza console.error con Winston
     * Categoriza errores (PrismaError, AuthError, ValidationError)
     * Implementa respuestas sin exponer stack traces
     * Agrega IDs únicos de error
     * Incluye logging con contexto
   - Agrega middleware para errores de Prisma
   - Implementa headers de seguridad

5. ENCRIPTACIÓN DE DATOS SENSIBLES:
   - Instala: npm install bcrypt
   - Crea src/utils/encryption.js
   - Implementa encriptación para campos sensibles
   - Documenta estrategia de manejo de claves
   - Prepara infraestructura para tokens de pago

CONSIDERACIONES DE SEGURIDAD:
- Validar TODOS los inputs antes de DB
- NO loggear datos sensibles
- Usar transacciones para migraciones
- Implementar soft deletes
- Configurar límites de rate limiting

ENTREGABLES:
- Scripts de migración ejecutados
- Middleware de validación funcionando
- Winston con logs rotando
- Middleware de errores mejorado
- Documentación de encriptación

PRUEBAS:
- Verificar integridad de datos migrados
- Probar validaciones con inputs maliciosos
- Confirmar logs sin datos sensibles
- Validar errores sin información interna

Procede con migración y seguridad, reportando avances.
```

---

## 🎯 PROMPT MIÉRCOLES (DÍA 3) - AUTH0 Y RESEND

```
CONTEXTO: PostgreSQL con datos migrados y validaciones implementadas. Hoy integramos Auth0 y Resend.

ESTADO ACTUAL:
- Base de datos con datos migrados
- Validaciones y logging funcionando
- Middleware de errores mejorado
- Sistema listo para autenticación

OBJETIVO DEL DÍA: Implementar autenticación con Auth0 y notificaciones con Resend.

TAREAS PRIORITARIAS:

1. CONFIGURACIÓN DE AUTH0:
   - Crea cuenta en https://auth0.com
   - Configura nueva aplicación:
     * Tipo: Regular Web Application o API
     * Configura Allowed Callback URLs
     * Configura Allowed Logout URLs
     * Habilita CORS si necesario
   - Define roles:
     * Administrador (permisos completos)
     * Cliente (permisos limitados)
   - Configura Actions/Rules para roles en JWT
   - Documenta credenciales en .env.example

2. INTEGRACIÓN DE AUTH0 EN BACKEND:
   - Instala: npm install express-oauth2-jwt-bearer jwks-rsa
   - Crea src/middleware/auth.js:
     * Verificación de JWT tokens
     * Validación de firma con JWKS
     * Extracción de claims (userId, roles)
     * Manejo de errores de autenticación
   - Crea src/middleware/authorize.js:
     * Verificación de roles requeridos
     * Verificación de permisos
     * Logging de accesos no autorizados
   - Integra con Prisma:
     * Crea/actualiza User en DB al autenticar
     * Asocia auth0_id con registros locales

3. PROTECCIÓN DE ENDPOINTS:
   - Revisa endpoints en src/routes/
   - Aplica middleware de autenticación:
     * Rutas admin: requieren rol Admin
     * Rutas perfil: requieren autenticación
     * Rutas pagos: requieren auth + validación
   - Actualiza documentación de endpoints
   - Implementa /api/auth/me para usuario actual

4. INTEGRACIÓN DE RESEND:
   - Crea cuenta en https://resend.com
   - Obtén API key y configura dominio
   - Instala: npm install resend
   - Crea src/services/email.service.js:
     * Configuración de cliente Resend
     * Funciones para cada tipo de email
     * Manejo de errores de envío
     * Logging de emails enviados
   - Crea templates en src/templates/emails/:
     * welcome.html - Bienvenida
     * transaction-confirmation.html - Confirmación pago
     * plan-change.html - Cambio de plan
     * security-alert.html - Alertas
     * password-reset.html - Recuperación

5. IMPLEMENTACIÓN DE NOTIFICACIONES:
   - Integra envío en flujos clave:
     * Registro → Email bienvenida
     * Transacción exitosa → Confirmación
     * Cambio de plan → Notificación
     * Login nuevo dispositivo → Alerta
   - Implementa cola de emails (opcional):
     * Instala Bull y Redis si posible
     * Crea worker para background
     * Implementa reintentos
   - Agrega logging de notificaciones

6. TESTING Y VALIDACIÓN:
   - Prueba flujo de autenticación:
     * Login con Auth0
     * Obtención de token JWT
     * Acceso a endpoints protegidos
     * Validación de roles
   - Prueba envío de emails:
     * Verifica recepción
     * Valida formato y contenido
     * Confirma logging
   - Documenta flujos para Swagger

CONSIDERACIONES DE SEGURIDAD:
- Validar SIEMPRE firma del JWT
- NO confiar en claims sin verificación
- Rate limiting en endpoints de auth
- Loggear accesos no autorizados
- NO exponer info de usuarios en errores
- Validar emails sin datos sensibles sin encriptar

ENTREGABLES:
- Auth0 con roles definidos
- Middleware auth/autorización funcionando
- Endpoints protegidos
- Resend con templates
- Sistema de notificaciones operativo
- Documentación de flujos

PRUEBAS:
- Login genera token válido
- Token inválido es rechazado
- Roles se aplican correctamente
- Emails se envían sin errores
- Logging de eventos funciona

Procede con Auth0 y Resend, reportando avances.
```

---

## 🎯 PROMPT JUEVES (DÍA 4) - PASARELAS DE PAGO Y SWAGGER

```
CONTEXTO: Auth0 y Resend funcionando. Hoy integramos pasarelas de pago y documentamos con Swagger.

ESTADO ACTUAL:
- Auth0 con roles funcionando
- Resend enviando notificaciones
- Endpoints protegidos
- Base de datos lista para transacciones

OBJETIVO DEL DÍA: Integrar Mercado Pago, PayPal y Payoneer, y documentar API con Swagger.

TAREAS PRIORITARIAS:

1. INTEGRACIÓN DE MERCADO PAGO:
   - Crea cuenta: https://www.mercadopago.com/developers
   - Obtén credenciales de prueba
   - Instala: npm install mercadopago
   - Crea src/services/mercadopago.service.js:
     * Configuración con credenciales
     * Crear preferencia de pago
     * Verificar estado de pago
     * Manejo de errores MP
   - Crea endpoints en src/routes/payments.js:
     * POST /api/payments/mercadopago/create
     * POST /api/payments/mercadopago/webhook
     * GET /api/payments/mercadopago/:id
   - Implementa validación de webhooks:
     * Verifica firma de Mercado Pago
     * Valida orden existente
     * Actualiza estado en DB
     * Envía email confirmación

2. INTEGRACIÓN DE PAYPAL:
   - Crea cuenta: https://developer.paypal.com
   - Obtén credenciales sandbox
   - Instala: npm install @paypal/checkout-server-sdk
   - Crea src/services/paypal.service.js:
     * Configuración cliente PayPal
     * Crear orden
     * Capturar pago
     * Reembolsar (si aplica)
   - Crea endpoints:
     * POST /api/payments/paypal/create-order
     * POST /api/payments/paypal/capture
     * POST /api/payments/paypal/webhook
     * GET /api/payments/paypal/:id
   - Valida webhooks:
     * Verifica firma PayPal
     * Procesa eventos (PAYMENT.CAPTURE.COMPLETED)
     * Actualiza transacciones

3. INTEGRACIÓN DE PAYONEER:
   - Configura cuenta Payoneer
   - Obtén credenciales API
   - Instala axios si no está
   - Crea src/services/payoneer.service.js:
     * Configuración autenticación
     * Iniciar pago
     * Verificar estado
     * Manejo de respuestas
   - Crea endpoints:
     * POST /api/payments/payoneer/create
     * POST /api/payments/payoneer/webhook
     * GET /api/payments/payoneer/:id

4. SEGURIDAD Y AUDITORÍA DE PAGOS:
   - Actualiza modelo Transaction en Prisma:
     * id, userId, amount, currency, status
     * gateway, gatewayTransactionId
     * createdAt, updatedAt
     * Metadata encriptada
   - Implementa middleware de seguridad:
     * Validación de montos
     * Verificación de idempotencia
     * Rate limiting estricto
     * Logging detallado
   - Encripta datos sensibles
   - Sistema de alertas para transacciones sospechosas

5. CONFIGURACIÓN DE SWAGGER:
   - Instala: npm install swagger-ui-express swagger-jsdoc
   - Crea src/config/swagger.js:
     * Definición OpenAPI 3.0
     * Información del proyecto
     * Servidores (dev, prod)
     * Esquemas de seguridad (Auth0 JWT)
   - Documenta endpoints con JSDoc:
     * @swagger tags
     * Parámetros con tipos
     * Respuestas con ejemplos
     * Códigos de error
     * Requisitos de autenticación
   - Monta Swagger UI en src/app.js:
     * Ruta: /api-docs
   - Documenta esquemas de datos

6. TESTING DE PAGOS:
   - Crea tests en tests/payments/:
     * Creación de pago en cada pasarela
     * Webhooks con datos simulados
     * Validación de firmas
     * Manejo de errores
     * Idempotencia
   - Prueba flujos completos:
     * Usuario crea pago
     * Webhook confirma
     * Transacción en DB
     * Email confirmación
     * Estado actualizado
   - Valida en Swagger:
     * Endpoints documentados
     * Ejemplos funcionando
     * Autenticación requerida

CONSIDERACIONES DE SEGURIDAD:
- NUNCA almacenar números de tarjeta
- Validar firmas de TODOS los webhooks
- Implementar idempotencia (prevenir duplicados)
- Encriptar datos de transacciones
- Rate limiting estricto en pagos
- Loggear TODAS las transacciones
- Validar montos contra manipulación

ENTREGABLES:
- Tres pasarelas integradas
- Webhooks validados y funcionando
- Swagger UI completo
- Sistema de auditoría de transacciones
- Tests de integración pasando

PRUEBAS:
- Pagos procesándose correctamente
- Webhooks recibiendo notificaciones
- Swagger mostrando toda la API
- Transacciones con auditoría completa

Procede con pasarelas y Swagger, reportando avances.
```

---

## 🎯 PROMPT VIERNES (DÍA 5) - DASHBOARDS Y TESTING FINAL

```
CONTEXTO: Pasarelas de pago y Swagger funcionando. Hoy actualizamos dashboards y completamos testing.

ESTADO ACTUAL:
- Mercado Pago, PayPal y Payoneer integrados
- Swagger documentando toda la API
- Backend completamente funcional
- Listo para integración frontend

OBJETIVO DEL DÍA: Actualizar dashboards, testing completo y documentación final.

TAREAS PRIORITARIAS:

1. REVISIÓN Y ANÁLISIS DEL FRONTEND:
   - Explora estructura en /home/omar/Pasantias/Uplin/Repositorios/front/
   - Identifica componentes de dashboard:
     * Dashboard administrador
     * Dashboard cliente
     * Componentes de autenticación
     * Vistas de transacciones
   - Mapea conexiones actuales con backend
   - Identifica dependencias y versiones

2. INTEGRACIÓN DE AUTH0 EN FRONTEND:
   - Instala SDK de Auth0 para frontend:
     * React: @auth0/auth0-react
     * Vue: @auth0/auth0-vue
     * Angular: @auth0/auth0-angular
   - Configura Auth0Provider:
     * Domain y Client ID
     * Redirect URIs
     * Audience para API
   - Implementa protección de rutas:
     * Rutas privadas requieren autenticación
     * Rutas admin requieren rol específico
   - Crea componentes:
     * LoginButton
     * LogoutButton
     * UserProfile
     * ProtectedRoute

3. ACTUALIZACIÓN DE DASHBOARD ADMINISTRADOR:
   - Conecta con endpoints del backend:
     * GET /api/users - Lista de usuarios
     * GET /api/transactions - Todas las transacciones
     * GET /api/plans - Gestión de planes
     * GET /api/consultants - Gestión de consultores
   - Implementa vistas:
     * Panel de control con métricas
     * Gestión de usuarios (CRUD)
     * Historial de transacciones
     * Configuración de planes
     * Reportes y estadísticas
   - Agrega autenticación en requests:
     * Incluir token JWT en headers
     * Manejo de errores 401/403
     * Refresh de tokens

4. ACTUALIZACIÓN DE DASHBOARD CLIENTE:
   - Conecta con endpoints:
     * GET /api/auth/me - Perfil del usuario
     * GET /api/transactions/my - Mis transacciones
     * GET /api/plans/available - Planes disponibles
     * POST /api/payments/{gateway}/create - Crear pago
   - Implementa vistas:
     * Perfil de usuario
     * Historial de pagos
     * Planes y suscripciones
     * Proceso de pago (integración con pasarelas)
   - Agrega manejo de estados:
     * Loading
     * Success
     * Error
     * Confirmación de pagos

5. INTEGRACIÓN DE PASARELAS EN FRONTEND:
   - Mercado Pago:
     * Instala SDK: @mercadopago/sdk-react
     * Implementa botón de pago
     * Maneja respuesta y redirección
   - PayPal:
     * Instala SDK: @paypal/react-paypal-js
     * Implementa PayPalButtons
     * Maneja eventos de pago
   - Payoneer:
     * Implementa flujo de redirección
     * Maneja callbacks
   - Agrega feedback visual:
     * Indicadores de carga
     * Mensajes de éxito/error
     * Confirmaciones

6. TESTING COMPLETO:
   - Backend:
     * Tests unitarios (Jest)
     * Tests de integración
     * Tests de endpoints (Supertest)
     * Cobertura > 80%
   - Frontend:
     * Tests de componentes
     * Tests de integración
     * Tests E2E (Cypress/Playwright)
   - Seguridad:
     * Validar contra INFORME_SEGURIDAD_COMPLETO.md
     * Verificar mitigación de vulnerabilidades
     * Pruebas de penetración básicas
   - Performance:
     * Tiempos de respuesta
     * Optimización de consultas
     * Carga de frontend

7. DOCUMENTACIÓN FINAL:
   - README.md completo:
     * Descripción del proyecto
     * Requisitos e instalación
     * Configuración de variables
     * Comandos disponibles
   - Documentación técnica:
     * Arquitectura del sistema
     * Diagramas de flujo
     * Modelos de datos
     * Guía de API (Swagger)
   - Guías de despliegue:
     * Variables de entorno
     * Configuración de producción
     * Backups y recuperación
   - Documentación de seguridad:
     * Medidas implementadas
     * Mejores prácticas
     * Checklist de seguridad

8. PREPARACIÓN PARA PRODUCCIÓN:
   - Configuración de entornos:
     * .env.development
     * .env.production
     * .env.example actualizado
   - Optimizaciones:
     * Minificación de código
     * Compresión de assets
     * Caching strategies
   - Monitoreo:
     * Health check endpoint
     * Logging en producción
     * Alertas de errores
   - Backups:
     * Estrategia de backup de DB
     * Procedimientos de recuperación

CONSIDERACIONES FINALES:
- Verificar TODAS las vulnerabilidades del informe mitigadas
- Confirmar cobertura de tests adecuada
- Validar experiencia de usuario en dashboards
- Asegurar documentación completa y clara
- Preparar checklist de despliegue

ENTREGABLES:
- Dashboard administrador completamente funcional
- Dashboard cliente completamente funcional
- Auth0 integrado en frontend
- Pasarelas de pago funcionando desde frontend
- Suite completa de tests pasando
- Documentación técnica completa
- Sistema listo para producción

PRUEBAS FINALES:
- Flujo completo: registro → login → pago → confirmación
- Roles funcionando correctamente
- Todas las pasarelas procesando pagos
- Dashboards mostrando datos en tiempo real
- Sin vulnerabilidades del informe pendientes

CHECKLIST DE VALIDACIÓN:
□ Auth0 funcionando en frontend y backend
□ Tres pasarelas de pago operativas
□ Dashboards admin y cliente funcionales
□ Tests con cobertura > 80%
□ Swagger documentando 100% de endpoints
□ Todas las vulnerabilidades mitigadas
□ Logging y monitoreo configurados
□ Documentación completa
□ Variables de entorno documentadas
□ Sistema listo para despliegue

Procede con dashboards y testing final, reportando avances y completando el checklist.
```

---

## NOTAS ADICIONALES

### Flexibilidad del Plan
- Si una tarea se completa antes, avanzar a la siguiente
- Si surge un bloqueador, documentar y buscar alternativas
- Priorizar siempre la seguridad sobre la velocidad

### Comunicación
- Reportar avances al final de cada sesión
- Documentar problemas encontrados
- Solicitar clarificaciones cuando sea necesario

### Recursos de Apoyo
- INFORME_SEGURIDAD_COMPLETO.md (referencia constante)
- Documentación oficial de cada tecnología
- Swagger para testing de endpoints
- Logs de Winston para debugging

