import express from 'express'
import morgan from 'morgan'
import config from './config.js'
import {usuariosRoutes} from './features/usuarios/index.js'
import cookieParser from 'cookie-parser';
import {authRoutes} from './features/auth/index.js'

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

export default app