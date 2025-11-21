import express from 'express';
import { register, login, logout, editPassword, requestPasswordReset, validateResetToken, resetPassword, checkToken, sendVerifyEmail, confirmVerifyEmail } from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
import requireAuth0 from '../../middlewares/auth0.js';
import * as auth0Controller from './auth0.controller.js';
import { upload, uploadAvatar, deleteAvatar } from './avatar.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/editPassword/:id', authRequired, editPassword)

router.get('/checkLogin', checkToken)

router.post('/forgotPassword', requestPasswordReset)
router.post('/validateToken', validateResetToken)
router.post('/resetPassword', resetPassword)

// Email verification (local JWT)
router.post('/verify-email/send', authRequired, sendVerifyEmail)
router.get('/verify-email/confirm', confirmVerifyEmail)

// Auth0 integration endpoints (JWT-protected)
router.post('/auth0/sync', requireAuth0, auth0Controller.sync)
router.get('/auth0/me', requireAuth0, auth0Controller.me)
router.get('/auth0/profile/completion', requireAuth0, auth0Controller.profileCompletion)
router.post('/auth0/profile/complete', requireAuth0, auth0Controller.complete)

// Avatar upload (Cloudinary) - Auth0-protected endpoints
router.post('/auth0/avatar', requireAuth0, upload.single('file'), uploadAvatar)
router.delete('/auth0/avatar', requireAuth0, deleteAvatar)

// Avatar upload (Cloudinary) - Local JWT-protected endpoints
router.post('/avatar', authRequired, upload.single('file'), uploadAvatar)
router.delete('/avatar', authRequired, deleteAvatar)


//Falta mailRecoverPassword(investigar enviar mails) y recoverPassword(investigar webhooks)

export default router;