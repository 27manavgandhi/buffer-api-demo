import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
  validateRegistration,
  validateLogin,
  handleValidationErrors,
} from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  validateRegistration,
  handleValidationErrors,
  authController.register
);

router.post('/login', validateLogin, handleValidationErrors, authController.login);

router.get('/me', authenticate, authController.getCurrentUser);

export default router;