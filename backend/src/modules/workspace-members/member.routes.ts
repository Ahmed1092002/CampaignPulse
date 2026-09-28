import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireAdmin } from '../../middleware/auth';
import * as memberController from './member.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspace);
router.use(apiRateLimiter);

router.post('/', requireAdmin, validate(memberController.memberValidators.invite), memberController.inviteMember);
router.get('/', memberController.getMembers);
router.patch('/:memberId', requireAdmin, validate(memberController.memberValidators.updateRole), memberController.updateMemberRole);
router.delete('/:memberId', requireAdmin, memberController.removeMember);
router.post('/leave', validate(memberController.memberValidators.leave), memberController.leaveWorkspace);

export default router;