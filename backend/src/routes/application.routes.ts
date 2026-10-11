import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  submitApplicationSchema,
  updateApplicationStatusSchema,
} from '../validators/application.validator';

const router = Router();

// Creator: View own applications
router.get('/my', authenticate, requireRole('creator'), asyncHandler(ApplicationController.getMyApplications));

// Creator: Apply to campaign
router.post(
  '/campaign/:campaignId',
  authenticate,
  requireRole('creator'),
  validateRequest(submitApplicationSchema),
  asyncHandler(ApplicationController.applyToCampaign)
);

// Creator: Withdraw proposal
router.post('/:id/withdraw', authenticate, requireRole('creator'), asyncHandler(ApplicationController.withdrawApplication));

// Brand: View applications for a specific campaign
router.get(
  '/campaign/:campaignId/all',
  authenticate,
  requireRole('brand'),
  asyncHandler(ApplicationController.getCampaignApplications)
);

// Brand: Update application status (shortlist, accept, reject)
router.patch(
  '/:id/status',
  authenticate,
  requireRole('brand'),
  validateRequest(updateApplicationStatusSchema),
  asyncHandler(ApplicationController.updateApplicationStatus)
);

export default router;
