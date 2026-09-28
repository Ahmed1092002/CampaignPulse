import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireAdmin } from '../../middleware/auth';
import * as webhookController from './webhook.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/crm', webhookController.handleCRMWebhook);

router.get('/', authenticate, requireWorkspace, requireAdmin, apiRateLimiter, webhookController.listWebhooks);
router.post('/', authenticate, requireWorkspace, requireAdmin, apiRateLimiter, validate(webhookController.webhookValidators.create), webhookController.createWebhook);
router.delete('/:id', authenticate, requireWorkspace, requireAdmin, apiRateLimiter, validate(webhookController.webhookValidators.delete), webhookController.deleteWebhook);

export default router;