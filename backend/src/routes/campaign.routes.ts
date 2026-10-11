import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { ApplicationController } from '../controllers/application.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateCampaignStatusSchema,
} from '../validators/campaign.validator';
import { submitApplicationSchema } from '../validators/application.validator';

const router = Router();

// Public / Creator explore
router.get('/', asyncHandler(CampaignController.exploreCampaigns));

// Brand-specific campaigns
router.get('/brand/my', authenticate, requireRole('brand'), asyncHandler(CampaignController.getBrandCampaigns));

// Campaign details
router.get('/:id', asyncHandler(CampaignController.getCampaignById));

// Brand operations
router.post(
  '/',
  authenticate,
  requireRole('brand'),
  validateRequest(createCampaignSchema),
  asyncHandler(CampaignController.createCampaign)
);

router.put(
  '/:id',
  authenticate,
  requireRole('brand'),
  validateRequest(updateCampaignSchema),
  asyncHandler(CampaignController.updateCampaign)
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole('brand'),
  validateRequest(updateCampaignStatusSchema),
  asyncHandler(CampaignController.updateCampaignStatus)
);

router.delete('/:id', authenticate, requireRole('brand'), asyncHandler(CampaignController.deleteCampaign));

// Applications under this campaign
router.post(
  '/:campaignId/apply',
  authenticate,
  requireRole('creator'),
  validateRequest(submitApplicationSchema),
  asyncHandler(ApplicationController.applyToCampaign)
);

router.get(
  '/:campaignId/all',
  authenticate,
  requireRole('brand'),
  asyncHandler(ApplicationController.getCampaignApplications)
);

router.get(
  '/:campaignId/applications',
  authenticate,
  requireRole('brand'),
  asyncHandler(ApplicationController.getCampaignApplications)
);

export default router;
