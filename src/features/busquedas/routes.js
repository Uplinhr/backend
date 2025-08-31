import express from 'express'
import { 
  getAll,
  getById,
  deleteById,
  create,
  editById,
  getOwn
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/self', authRequired, getOwn)
router.delete('/:id', authRequired, deleteById)
router.post('/', authRequired, create)

// Rutas solo para admin
router.get('/', authRequired, checkRole(['admin']), getAll);
router.get('/:id', authRequired, checkRole(['admin']), getById)
router.put('/:id', authRequired, checkRole(['admin']), editById)

export default router