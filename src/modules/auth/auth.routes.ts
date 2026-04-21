import { Router } from 'express';
import * as AuthController from './auth.controller';

const router = Router();

router.post('/register', AuthController.signup);
router.post('/login', AuthController.signin);

export default router;