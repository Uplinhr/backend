import express from 'express';
import { getAll } from './controller.js';

const router = express.Router();

// Public route to get all active plans
router.get('/plans', getAll);

export default router;
