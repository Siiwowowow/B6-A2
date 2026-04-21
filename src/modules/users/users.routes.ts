import { Router } from 'express';
import * as UsersController from './users.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/',            authorize('admin'),             UsersController.getAllUsers);
router.put('/:userId',     authorize('admin', 'customer'), UsersController.updateUser);
router.delete('/:userId',  authorize('admin'),             UsersController.deleteUser);

export default router;