import express from 'express';
import requireAuth0 from '../../middlewares/auth0.js';
import { subscribeCtrl, cancelCtrl, resumeCtrl } from './controller.js';

const router = express.Router();

// Suscribir a una membresía (Start, Growth, Premium, Custom)
router.post('/subscribe', requireAuth0, subscribeCtrl);

// Cancelar la membresía (no elimina historial)
router.post('/cancel', requireAuth0, cancelCtrl);

// Reanudar membresía suspendida/cancelada
router.post('/resume', requireAuth0, resumeCtrl);

export default router;
