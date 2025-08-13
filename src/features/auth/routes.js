import express from 'express';
import { register, login, logout, editPassword } from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/editPassword/:id', authRequired, editPassword)

export default router;