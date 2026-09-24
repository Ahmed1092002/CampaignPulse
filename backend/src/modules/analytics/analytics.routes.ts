import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireViewer } from '../../middleware/auth';
import * as analyticsController from './analytics.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(requireWorkspace);
router.use(requireViewer);
router.use(apiRateLimiter);

router.get('/dashboard', validate(analyticsController.analyticsValidators.query), analyticsController.getDashboardStats);
router.get('/realtime', analyticsController.getRealtimeStats);
router.get('/campaign/:id', validate(analyticsController.analyticsValidators.query), analyticsController.getCampaignAnalytics);

export default router;