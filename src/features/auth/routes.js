import express from 'express';
import { register, login, logout, editPassword, requestPasswordReset, validateResetToken, resetPassword, checkToken } from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
import requireAuth0 from '../../middlewares/auth0.js';
import * as auth0Controller from './auth0.controller.js';
import { upload, uploadAvatar, deleteAvatar } from './avatar.controller.js';

const router = express.Router();

router.post('/register', authRequired, checkRole(['admin']), register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/editPassword/:id', authRequired, editPassword)

router.get('/checkLogin', checkToken)

router.post('/forgotPassword', requestPasswordReset)
router.post('/validateToken', validateResetToken)
router.post('/resetPassword', resetPassword)

// Auth0 integration endpoints (JWT-protected)
router.post('/auth0/sync', requireAuth0, auth0Controller.sync)
router.get('/auth0/me', requireAuth0, auth0Controller.me)
router.get('/auth0/profile/completion', requireAuth0, auth0Controller.profileCompletion)
router.post('/auth0/profile/complete', requireAuth0, auth0Controller.complete)

// Avatar upload (Cloudinary)
router.post('/auth0/avatar', requireAuth0, upload.single('file'), uploadAvatar)
router.delete('/auth0/avatar', requireAuth0, deleteAvatar)


//Falta mailRecoverPassword(investigar enviar mails) y recoverPassword(investigar webhooks)

export default router;