import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import helmet from 'helmet'; // Import para headers de seguridad
import logger from './config/logger.config.js'; // Import para logging con Winston
import { randomUUID } from 'crypto';

// Para ESM: obtener __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { usuariosRoutes } from './features/usuarios/index.js';
import cookieParser from 'cookie-parser';
import { authRoutes } from './features/auth/index.js';
import { planesRoutes } from './features/planes/index.js';
import { compra_planesRoutes } from './features/compra_planes/index.js';
import { creditosRoutes } from './features/creditos/index.js';
import { busquedasRoutes } from './features/busquedas/index.js';
import { compra_creditosRoutes } from './features/compra_creditos/index.js';
import { empresasRoutes } from './features/empresa/index.js';
import { consultoriasRoutes } from './features/consultorias/index.js';
import { consultasRoutes } from './features/consultas/index.js';
import { cartRoutes } from './features/cart/index.js';
import { taxesRoutes } from './features/taxes/index.js';
import { paymentsRoutes } from './features/payments/index.js';
import adminTalentSearchRoutes from './features/admin/talent-search.routes.js';
import membershipsRoutes from './features/memberships/routes.js';
import membershipsAdminRoutes from './features/memberships/admin.routes.js';
import membershipsWebhooksRoutes from './features/webhooks/memberships.routes.js';
import { securityHeaders, preventParameterPollution, sanitizeData, generalRateLimiter, auditLog } from './middlewares/security.middleware.js';

const app = express();

// Middlewares de seguridad (CAPA 1) - Integrando helmet con los existentes
app.use(helmet()); // Agregado para headers de seguridad HTTP
app.use(securityHeaders);
app.use(preventParameterPollution);
app.use(sanitizeData);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como las de Postman/curl)
    if (!origin) return callback(null, true);

    // Lista base de origins permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      (process.env.FRONTEND_URL || '').trim()
    ].filter(Boolean);

    const isDevBypass = process.env.DEV === 'true';
    const isNgrok = /\.ngrok-free\.(dev|app)$/i.test(new URL(origin).hostname);
    const isAllowed = allowedOrigins.includes(origin) || isNgrok || isDevBypass;

    if (isAllowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Permitir cookies y auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Responder preflight de forma explícita
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting general (CAPA 2) - Ya tienes generalRateLimiter, no duplico
app.use(generalRateLimiter);

// Auditoría de requests (CAPA 3) - Ya tienes auditLog, no duplico
app.use(auditLog);

// Configuración
app.set('port', process.env.SERVER_PORT || 4000);

// RUTAS
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/compra_planes', compra_planesRoutes);
app.use('/api/creditos', creditosRoutes);
app.use('/api/busquedas', busquedasRoutes);
app.use('/api/compra_creditos', compra_creditosRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/consultorias', consultoriasRoutes);
app.use('/api/consultas', consultasRoutes);

// Nuevas rutas del sistema de pagos
app.use('/api/cart', cartRoutes);
app.use('/api/taxes', taxesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/admin/memberships', membershipsAdminRoutes);
app.use('/api/webhooks/memberships', membershipsWebhooksRoutes);

// Rutas administrativas
app.use('/api/admin', adminTalentSearchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando en puerto 4000',
    timestamp: new Date().toISOString()
  });
});

// Middleware de errores actualizado (reemplaza el existente)
app.use((err, req, res, next) => {
  // Categorizar errores
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let logLevel = 'error';
  let errorId = randomUUID(); // ID único para tracking

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
    logLevel = 'warn';
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Error en la base de datos';
    logLevel = 'error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'No autorizado';
    logLevel = 'warn';
  }

  // Logging con contexto (sin datos sensibles)
  logger[logLevel](`Error ${errorId}: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Respuesta al cliente (sin stack traces en producción)
  res.status(statusCode).json({
    error: message,
    errorId: errorId, // Para debugging sin exponer detalles
    message: process.env.DEV ? err.message : 'Ocurrió un error',
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

export default app;