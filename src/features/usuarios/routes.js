import express from 'express'
import { 
  getUsuarioById,
  getUsuarios,
  deleteUsuarioById,
  editFullName,
  editUsuarioById,
  getOwnUsuario
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/self', authRequired, getOwnUsuario)
router.put('/fullName/:id', authRequired, editFullName)

// Rutas solo para admin
router.get('/', authRequired, checkRole(['admin']), getUsuarios);
router.get('/:id', authRequired, checkRole(['admin']), getUsuarioById)
router.delete('/:id', authRequired, checkRole(['admin']), deleteUsuarioById)
router.put('/:id', authRequired, checkRole(['admin']), editUsuarioById)

export default router