import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public auth endpoints
router.post('/register', validateRequest(registerSchema), asyncHandler(AuthController.register));
router.post('/login', validateRequest(loginSchema), asyncHandler(AuthController.login));
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/verify-email', asyncHandler(AuthController.verifyEmail));
router.post('/verify-email', asyncHandler(AuthController.verifyEmail));
router.post('/forgot-password', validateRequest(forgotPasswordSchema), asyncHandler(AuthController.forgotPassword));
router.post('/reset-password', validateRequest(resetPasswordSchema), asyncHandler(AuthController.resetPassword));

// Protected account management endpoints
router.get('/me', authenticate, asyncHandler(AuthController.getMe));
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), asyncHandler(AuthController.changePassword));
router.post('/deactivate', authenticate, asyncHandler(AuthController.deactivateAccount));
router.delete('/delete-account', authenticate, asyncHandler(AuthController.deleteAccount));

export default router;
