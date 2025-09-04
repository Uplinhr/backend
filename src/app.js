import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import config from './config.js'
import {usuariosRoutes} from './features/usuarios/index.js'
import cookieParser from 'cookie-parser';
import {authRoutes} from './features/auth/index.js'
import { planesRoutes } from './features/planes/index.js';
import { compra_planesRoutes } from './features/compra_planes/index.js';
import { creditosRoutes } from './features/creditos/index.js';
import { busquedasRoutes } from './features/busquedas/index.js';
import { compra_creditosRoutes } from './features/compra_creditos/index.js';
import { empresasRoutes } from './features/empresa/index.js';
import { consultoriasRoutes } from './features/consultorias/index.js';
import { consultasRoutes } from './features/consultas/index.js';

const app = express();

//middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL de tu frontend
  credentials: true, // Permitir cookies y auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'))

// configuracion
app.set('port', process.env.SERVER_PORT || 4000)

//RUTAS

app.use('/api/usuarios', usuariosRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes)
app.use('/api/compra_planes', compra_planesRoutes)
app.use('/api/creditos', creditosRoutes)
app.use('/api/busquedas', busquedasRoutes)
app.use('/api/compra_creditos', compra_creditosRoutes)
app.use('/api/empresas', empresasRoutes)
app.use('/api/consultorias', consultoriasRoutes)
app.use('/api/consultas', consultasRoutes)


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando en puerto 4000',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.DEV ? err.message : 'Ocurrió un error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

export default app