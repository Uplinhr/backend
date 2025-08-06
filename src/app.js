import express from 'express'
import morgan from 'morgan'
import config from './config.js'
import usuariosRoutes from './features/usuarios/routes.js'

const app = express();

//middleware
app.use(express.json());
app.use(morgan('dev'))

// configuracion
app.set('port', config.app.port)

//RUTAS
app.use('/api/usuarios', usuariosRoutes)

export default app