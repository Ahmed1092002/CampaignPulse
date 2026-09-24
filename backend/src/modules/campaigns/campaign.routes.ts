import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireMarketer, requireAdmin, requireViewer } from '../../middleware/auth';
import * as campaignController from './campaign.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter;

const router = Router({ mergeParams: true });

// Public routes
router.get('/public/:slug', campaignController.getPublicCampaign);

// Protected routes
router.use(authenticate);
router.use(requireWorkspace);
router.use(apiRateLimiter);

router.post('/', requireMarketer, validate(campaignController.campaignValidators.create), campaignController.createCampaign);
router.get('/', requireViewer, validate(campaignController.campaignValidators.list), campaignController.getCampaigns);
router.post('/generate-slug', requireMarketer, validate(campaignController.campaignValidators.slug), campaignController.generateSlug);
router.get('/:id', requireViewer, campaignController.getCampaign);
router.patch('/:id', requireMarketer, validate(campaignController.campaignValidators.update), campaignController.updateCampaign);
router.delete('/:id', requireAdmin, campaignController.deleteCampaign);

export default router;