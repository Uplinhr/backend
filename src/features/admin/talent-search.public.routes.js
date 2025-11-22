import { Router } from 'express';
import AdminTalentSearchController from './talent-search.controller.js';

const router = Router();

// Public routes for Talent Search Services
router.get('/', AdminTalentSearchController.getAllServices);

export default router;
