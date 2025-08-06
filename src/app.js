import express from 'express'
import config from './config.js'
import usuariosRoutes from './features/usuarios/routes.js'

const app = express();

app.use(express.json());

// configuracion inicial
app.set('port', config.app.port)

//RUTAS
app.use('/api/usuarios', usuariosRoutes)

export default app