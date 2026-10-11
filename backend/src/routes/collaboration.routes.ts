import { Router } from 'express';
import { CollaborationController } from '../controllers/collaboration.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  submitMilestoneDeliverableSchema,
  reviewMilestoneSchema,
} from '../validators/application.validator';
import { createReviewSchema } from '../validators/marketplace.validator';

const router = Router();

// List user's collaborations
router.get('/my', authenticate, asyncHandler(CollaborationController.getMyCollaborations));

// Collaboration details workspace
router.get('/:id', authenticate, asyncHandler(CollaborationController.getCollaborationById));

// Creator: Submit milestone deliverable
router.post(
  '/:id/milestones/:milestoneId/submit',
  authenticate,
  validateRequest(submitMilestoneDeliverableSchema),
  asyncHandler(CollaborationController.submitMilestoneDeliverable)
);

// Brand: Review milestone deliverable
router.post(
  '/:id/milestones/:milestoneId/review',
  authenticate,
  validateRequest(reviewMilestoneSchema),
  asyncHandler(CollaborationController.reviewMilestoneDeliverable)
);

// Brand: Submit verified review after completion
router.post(
  '/:id/review',
  authenticate,
  validateRequest(createReviewSchema),
  asyncHandler(CollaborationController.submitReview)
);

export default router;
