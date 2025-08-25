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
import { consultasRoutes } from './features/consulta/index.js';

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
//app.use(express.urlencoded({ extended: true }));

// configuracion
app.set('port', config.app.port)

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

export default app