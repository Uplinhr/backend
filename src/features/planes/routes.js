import express from 'express'
import { 
  getPlanes,
  getPlanById,
  deletePlanById,
  createPlan,
  editPlanById
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/', authRequired, getPlanes); 
router.get('/:id', authRequired, getPlanById)

// Rutas solo para admin
router.delete('/:id', authRequired, checkRole(['admin']), deletePlanById)
router.put('/:id', authRequired, checkRole(['admin']), editPlanById)
router.post('/', authRequired, checkRole(['admin']), createPlan)

export default router