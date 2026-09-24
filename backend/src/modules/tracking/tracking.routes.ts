import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireViewer } from '../../middleware/auth';
import * as trackingController from './tracking.controller';
import { apiRateLimiter, trackingRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public tracking endpoint - for landing page analytics
router.post('/', trackingRateLimiter, validate(trackingController.trackingValidators.event), trackingController.trackEvent);
router.post('/batch', trackingRateLimiter, trackingController.trackEventsBatch);

// Protected routes
router.use(authenticate);
router.use(requireWorkspace);
router.use(requireViewer);
router.use(apiRateLimiter);

router.get('/', trackingController.getEvents);
router.get('/counts', trackingController.getEventCounts);

export default router;