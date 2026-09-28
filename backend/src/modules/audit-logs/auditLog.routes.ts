import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireAdmin } from '../../middleware/auth';
import * as auditLogController from './auditLog.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspace);
router.use(requireAdmin);
router.use(apiRateLimiter);

router.get('/', validate(auditLogController.auditLogValidators.list), auditLogController.getAuditLogsHandler);

export default router;