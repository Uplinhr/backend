import express from 'express';
import { register, login, logout } from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/register', authRequired, checkRole(['admin']), register);
router.post('/login', login);
router.post('/logout', logout);

export default router;