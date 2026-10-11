import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  updateCreatorProfileSchema,
  updateBrandProfileSchema,
} from '../validators/profile.validator';

const router = Router();

// Current user profile
router.get('/me', authenticate, asyncHandler(ProfileController.getMyProfile));
router.put(
  '/creator',
  authenticate,
  requireRole('creator'),
  validateRequest(updateCreatorProfileSchema),
  asyncHandler(ProfileController.updateCreatorProfile)
);
router.put(
  '/brand',
  authenticate,
  requireRole('brand'),
  validateRequest(updateBrandProfileSchema),
  asyncHandler(ProfileController.updateBrandProfile)
);

// Public profile exploration
router.get('/creator/:id', asyncHandler(ProfileController.getPublicCreatorProfile));
router.get('/brand/:id', asyncHandler(ProfileController.getPublicBrandProfile));

export default router;
