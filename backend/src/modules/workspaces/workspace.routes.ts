import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireAdmin } from '../../middleware/auth';
import * as workspaceController from './workspace.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(apiRateLimiter);

router.post('/', validate(workspaceController.workspaceValidators.create), workspaceController.createWorkspace);
router.get('/', workspaceController.getWorkspaces);
router.get('/:id', requireWorkspace, workspaceController.getWorkspace);
router.patch('/:id', requireWorkspace, requireAdmin, validate(workspaceController.workspaceValidators.update), workspaceController.updateWorkspace);
router.delete('/:id', requireWorkspace, requireAdmin, workspaceController.deleteWorkspace);

router.get('/:id/settings', requireWorkspace, requireAdmin, workspaceController.getSettings);
router.patch('/:id/settings', requireWorkspace, requireAdmin, workspaceController.updateSettings);

export default router;