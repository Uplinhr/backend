import express from 'express'
import { 
  getAll,
  getById,
  deleteById,
  create,
  editById,
  enableById,
  buyPlan
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/', authRequired, getAll);
router.get('/:id', authRequired, getById)

// Rutas solo para admin
router.delete('/:id', authRequired, checkRole(['admin']), deleteById)
router.put('/:id', authRequired, checkRole(['admin']), editById)
router.post('/', authRequired, checkRole(['admin']), create)
router.put('/enable/:id', authRequired, checkRole(['admin']), enableById)

// EDIT USER YA HACE LO MISMO, NO SE RECOMIENDA USARLO, PERO SIRVE PARA CUANDO HAYA PASARELA DE PAGO EN EL PROYECTO
router.post('/buy', authRequired, checkRole(['admin']), buyPlan)

export default router