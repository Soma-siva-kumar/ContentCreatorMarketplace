import { Router } from 'express';
import { AIStudioController } from '../controllers/aiStudio.controller';
import { authenticate } from '../middleware/auth';
import { aiUsageLimiter } from '../middleware/aiRateLimit';
import { validateRequest } from '../middleware/validate';
import {
  generateContentSchema,
  transformContentSchema,
  saveDraftSchema,
} from '../validators/aiStudio.validator';

const router = Router();

// Provider & Usage Status
router.get('/status', (req, res, next) => {
  // Optional auth to attach user usage stats if token exists
  authenticate(req, res, () => {
    AIStudioController.getStatus(req, res).catch(next);
  }).catch(() => {
    // If not authenticated, still return general provider status
    AIStudioController.getStatus(req, res).catch(next);
  });
});

// AI Generation & Transformation (Protected + Rate Limited)
router.post(
  '/generate',
  authenticate,
  aiUsageLimiter,
  validateRequest(generateContentSchema),
  (req, res, next) => {
    AIStudioController.generate(req, res).catch(next);
  }
);

router.post(
  '/transform',
  authenticate,
  aiUsageLimiter,
  validateRequest(transformContentSchema),
  (req, res, next) => {
    AIStudioController.transform(req, res).catch(next);
  }
);

// Saved Drafts & Revision History
router.post('/drafts', authenticate, validateRequest(saveDraftSchema), (req, res, next) => {
  AIStudioController.saveDraft(req, res).catch(next);
});

router.get('/drafts', authenticate, (req, res, next) => {
  AIStudioController.getDrafts(req, res).catch(next);
});

router.get('/drafts/:id', authenticate, (req, res, next) => {
  AIStudioController.getDraftById(req, res).catch(next);
});

router.delete('/drafts/:id', authenticate, (req, res, next) => {
  AIStudioController.deleteDraft(req, res).catch(next);
});

router.post('/drafts/:id/favorite', authenticate, (req, res, next) => {
  AIStudioController.toggleFavorite(req, res).catch(next);
});

export const aiStudioRoutes = router;
