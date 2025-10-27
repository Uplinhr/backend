import { Router } from 'express';
import TaxController from './controller.js';
import { requireAdmin } from '../../middlewares/security.middleware.js';
import { verifyToken } from '../../middlewares/auth.js';

const router = Router();

// Ruta pública para calcular impuestos
router.post('/calculate', TaxController.calculateTax);

// Rutas protegidas (Admin)
router.get('/config', verifyToken, requireAdmin, TaxController.getAllTaxConfigs);
router.post('/config', verifyToken, requireAdmin, TaxController.createTaxConfig);
router.put('/config/:id', verifyToken, requireAdmin, TaxController.updateTaxConfig);

export default router;
