import express from 'express'
import { 
  getById,
  getAll,
  deleteById,
  editOwn,
  editById,
  getOwn,
  enableById
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/self', authRequired, getOwn)
router.put('/fullName/:id', authRequired, editOwn)

// Rutas solo para admin
router.get('/', authRequired, checkRole(['admin']), getAll);
router.get('/:id', authRequired, checkRole(['admin']), getById)
router.delete('/:id', authRequired, checkRole(['admin']), deleteById)
router.put('/:id', authRequired, checkRole(['admin']), editById)
router.put('/enable/:id', authRequired, checkRole(['admin']), enableById)

export default router