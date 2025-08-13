import express from 'express'
import { 
  getUsuarioById,
  getUsuarios,
  deleteUsuarioById
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/', authRequired, getUsuarios);
router.get('/:id', authRequired, getUsuarioById)

// Rutas solo para admin
router.delete('/:id', authRequired, checkRole(['admin']), deleteUsuarioById)

export default router