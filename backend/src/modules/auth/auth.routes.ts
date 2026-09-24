import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authRateLimiter, validate(authController.authValidators.register), authController.register);
router.post('/login', authRateLimiter, validate(authController.authValidators.login), authController.login);
router.post('/refresh', authRateLimiter, validate(authController.authValidators.refresh), authController.refresh);
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.patch('/profile', validate(authController.authValidators.changePassword), authController.updateProfile);
router.post('/change-password', validate(authController.authValidators.changePassword), authController.changePassword);

export default router;