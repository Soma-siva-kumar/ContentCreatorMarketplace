import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { creatorSearchSchema } from '../validators/marketplace.validator';

const router = Router();

// Public creator discovery
router.get('/creators', validateRequest(creatorSearchSchema), asyncHandler(MarketplaceController.searchCreators));
router.get('/creators/:id', asyncHandler(MarketplaceController.getCreatorDetail));

// Favorites (Authenticated)
router.post('/favorites/:creatorId', authenticate, asyncHandler(MarketplaceController.toggleFavorite));
router.get('/favorites', authenticate, asyncHandler(MarketplaceController.getMyFavorites));

export default router;
