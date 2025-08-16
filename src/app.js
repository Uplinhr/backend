import express from 'express'
import morgan from 'morgan'
import config from './config.js'
import {usuariosRoutes} from './features/usuarios/index.js'
import cookieParser from 'cookie-parser';
import {authRoutes} from './features/auth/index.js'
import { planesRoutes } from './features/planes/index.js';
import { compra_planesRoutes } from './features/compra_planes/index.js';

const app = express();

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'))

// configuracion
app.set('port', config.app.port)

//RUTAS
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes)
app.use('api/compra_planes', compra_planesRoutes)

export default app