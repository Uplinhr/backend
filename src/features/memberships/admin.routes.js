import express from 'express';
import { authRequired, checkRole } from '../../middlewares/auth.js';
import { listPlans, upsertPlan, listSubscriptions, updateSubscriptionStatus } from './admin.controller.js';

const router = express.Router();

router.use(authRequired, checkRole(['admin']));

router.get('/plans', listPlans);
router.put('/plans', upsertPlan);
router.get('/subscriptions', listSubscriptions);
router.patch('/subscriptions/:id/status', updateSubscriptionStatus);

export default router;
