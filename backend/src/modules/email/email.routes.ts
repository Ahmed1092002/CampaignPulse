import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireAdmin } from '../../middleware/auth';
import * as emailController from './email.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter;

const router = Router();

router.use(authenticate);
router.use(requireWorkspace);
router.use(requireAdmin);
router.use(apiRateLimiter);

router.post('/test', validate(emailController.emailValidators.test), emailController.sendTestEmail);
router.post('/send', validate(emailController.emailValidators.custom), emailController.sendCustomEmail);

export default router;