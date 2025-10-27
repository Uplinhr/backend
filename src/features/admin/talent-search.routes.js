import express from 'express';
import AdminTalentSearchController from '../admin/talent-search.controller.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';

const router = express.Router();

/**
 * Rutas administrativas para gestión de servicios de búsqueda de talento
 * Todas requieren autenticación y permisos de administrador
 */

// Aplicar middleware de autenticación a todas las rutas admin
router.use(requireAdmin);

// Obtener todos los servicios
router.get('/talent-search-services', AdminTalentSearchController.getAllServices);

// Crear nuevo servicio
router.post('/talent-search-services', AdminTalentSearchController.createService);

// Actualizar servicio existente
router.put('/talent-search-services/:serviceId', AdminTalentSearchController.updateService);

// Eliminar servicio (desactivar)
router.delete('/talent-search-services/:serviceId', AdminTalentSearchController.deleteService);

// Obtener estadísticas de uso
router.get('/talent-search-services/stats', AdminTalentSearchController.getServiceStats);

// Activar servicio
router.post('/talent-search-services/:serviceId/activate', AdminTalentSearchController.activateService);

// Desactivar servicio
router.post('/talent-search-services/:serviceId/deactivate', AdminTalentSearchController.deactivateService);

export default router;
