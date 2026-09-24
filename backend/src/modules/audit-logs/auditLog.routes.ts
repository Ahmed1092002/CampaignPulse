import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireAdmin } from '../../middleware/auth';
import { paginationSchema } from '../../utils/validators';
import * as auditLogController from './auditLog.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter;

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspace);
router.use(requireAdmin);
router.use(apiRateLimiter);

router.get('/', validate(paginationSchema), async (req, res) => {
  const { page, limit, entityType, entityId, userId, action, startDate, endDate } = req.query;
  const result = await auditLogController.getAuditLogsHandler(req.workspaceId!, req.user!.userId, {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    entityType: entityType as string,
    entityId: entityId as string,
    userId: userId as string,
    action: action as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });
  res.json(result);
});

export default router;