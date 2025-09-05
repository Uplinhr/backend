import express from 'express';
import { register, login, logout, editPassword, requestPasswordReset, validateResetToken, resetPassword, checkToken } from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/register', register, authRequired, checkRole(['admin']));
router.post('/login', login);
router.post('/logout', logout);
router.put('/editPassword/:id', authRequired, editPassword)

router.get('/checkLogin', checkToken)

router.post('/forgotPassword', requestPasswordReset)
router.post('/validateToken', validateResetToken)
router.post('/resetPassword', resetPassword)


//Falta mailRecoverPassword(investigar enviar mails) y recoverPassword(investigar webhooks)

export default router;