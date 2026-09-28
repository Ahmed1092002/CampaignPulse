import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import * as userController from './user.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', validate(userController.userValidators.list), userController.getUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', validate(userController.userValidators.update), userController.updateUser);

export default router;