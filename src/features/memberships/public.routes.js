import express from 'express';
import { listPlans } from './admin.controller.js';

const router = express.Router();

// Public route to list membership plans
router.get('/plans', listPlans);

export default router;
