import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireViewer } from '../../middleware/auth';
import * as notificationController from './notification.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(requireWorkspace);
router.use(requireViewer);
router.use(apiRateLimiter);

router.get('/', validate(notificationController.notificationValidators.list), notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;