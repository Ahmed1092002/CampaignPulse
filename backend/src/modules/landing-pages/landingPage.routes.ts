import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireMarketer } from '../../middleware/auth';
import * as landingPageController from './landingPage.controller';
import { apiRateLimiter, publicFormRateLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });

// Public route - no auth required
router.get('/public/:slug', publicFormRateLimiter, landingPageController.getPublicLandingPage);

// Protected routes
router.use(authenticate);
router.use(requireWorkspace);
router.use(apiRateLimiter);

router.get('/:campaignId', landingPageController.getLandingPage);
router.patch('/:campaignId', requireMarketer, validate(landingPageController.landingPageValidators.update), landingPageController.updateLandingPage);
router.post('/:campaignId/duplicate', requireMarketer, validate(landingPageController.landingPageValidators.duplicate), landingPageController.duplicateLandingPage);

export default router;