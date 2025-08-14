import express from 'express'
import { 
  getUsuarioById,
  getUsuarios,
  deleteUsuarioById,
  editFullName,
  editUser
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/', authRequired, getUsuarios);
router.get('/:id', authRequired, getUsuarioById)
router.put('/fullName/:id', authRequired, editFullName)

// Rutas solo para admin
router.delete('/:id', authRequired, checkRole(['admin']), deleteUsuarioById)
router.put('/:id', authRequired, checkRole(['admin']), editUser)

export default router