import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createConversationSchema,
  sendMessageSchema,
  reportConversationSchema,
} from '../validators/message.validator';

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

// 1. List user conversations
router.get('/', asyncHandler(ConversationController.getConversations));

// 2. Start or get conversation between creator and brand
router.post(
  '/',
  validateRequest(createConversationSchema),
  asyncHandler(ConversationController.getOrCreateConversation)
);

// 3. Conversation detail
router.get('/:id', asyncHandler(ConversationController.getConversationById));

// 4. Fetch messages
router.get('/:id/messages', asyncHandler(ConversationController.getMessages));

// 5. Send message
router.post(
  '/:id/messages',
  validateRequest(sendMessageSchema),
  asyncHandler(ConversationController.sendMessage)
);

// 6. Mark conversation as read
router.patch('/:id/read', asyncHandler(ConversationController.markConversationAsRead));

// 7. Safety: Block conversation
router.post('/:id/block', asyncHandler(ConversationController.blockConversation));

// 8. Safety: Unblock conversation
router.post('/:id/unblock', asyncHandler(ConversationController.unblockConversation));

// 9. Safety: Report conversation/user
router.post(
  '/:id/report',
  validateRequest(reportConversationSchema),
  asyncHandler(ConversationController.reportConversation)
);

export const conversationRoutes = router;
