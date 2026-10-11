import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// 1. Get user notifications
router.get('/', asyncHandler(NotificationController.getMyNotifications));

// 2. Mark all as read
router.patch('/read-all', asyncHandler(NotificationController.markAllAsRead));

// 3. Mark single as read
router.patch('/:id/read', asyncHandler(NotificationController.markAsRead));

// 4. Delete notification
router.delete('/:id', asyncHandler(NotificationController.deleteNotification));

export const notificationRoutes = router;
