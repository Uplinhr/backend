import express from 'express'
import { 
  getCompra_Planes,
  getCompra_PlanById,
  deleteCompra_PlanById,
  createCompra_Plan,
  editCompra_PlanById
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/', authRequired, getCompra_Planes);
router.get('/:id', authRequired, getCompra_PlanById)

// Rutas solo para admin
router.delete('/:id', authRequired, checkRole(['admin']), deleteCompra_PlanById)
router.put('/:id', authRequired, checkRole(['admin']), editCompra_PlanById)
router.post('/', authRequired, checkRole(['admin']), createCompra_Plan)

export default router