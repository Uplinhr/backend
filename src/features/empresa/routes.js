import express from 'express'
import { 
  getAll,
  getById,
  deleteById,
  create,
  editById,
  getOwn,
  editOwn
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/self', authRequired, getOwn)
router.put('/self', authRequired, editOwn)

// Rutas solo para admin
router.get('/', authRequired, checkRole(['admin']), getAll);
router.get('/:id', authRequired, checkRole(['admin']), getById)
router.delete('/:id', authRequired, checkRole(['admin']), deleteById)
router.put('/:id', authRequired, checkRole(['admin']), editById)
router.post('/', authRequired, checkRole(['admin']), create)

export default router