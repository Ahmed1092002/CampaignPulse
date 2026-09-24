import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireMarketer, requireAdmin } from '../../middleware/auth';
import * as leadController from './lead.controller';
import { apiRateLimiter, publicFormRateLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });

// Public lead submission - no auth required
router.post('/', publicFormRateLimiter, validate(leadController.leadValidators.create), leadController.createLead);

// Protected routes
router.use(authenticate);
router.use(requireWorkspace);
router.use(apiRateLimiter);

router.get('/', validate(leadController.leadValidators.list), leadController.getLeads);
router.get('/stats', leadController.getLeadStats);
router.get('/:id', leadController.getLead);
router.patch('/:id', requireMarketer, validate(leadController.leadValidators.update), leadController.updateLead);
router.delete('/:id', requireAdmin, leadController.deleteLead);

router.post('/:campaignId/sources', requireMarketer, leadController.createSources);
router.get('/:campaignId/sources', leadController.getSources);

export default router;