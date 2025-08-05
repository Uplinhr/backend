import express from 'express'
import config from './config.js'

const app = express();
app.set('port', config.app.port)

export default app