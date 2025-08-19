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
router.get('/self', authRequired, getOwn) //Todavia no funciona esta ruta

// Rutas solo para admin
router.get('/', authRequired, checkRole(['admin']), getAll);
router.get('/:id', authRequired, checkRole(['admin']), getById)
router.delete('/:id', authRequired, checkRole(['admin']), deleteById)
router.put('/:id', authRequired, checkRole(['admin']), editById)
router.post('/', authRequired, checkRole(['admin']), create)

export default router