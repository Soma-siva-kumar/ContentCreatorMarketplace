import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Conversation, IConversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { CreatorProfile } from '../models/CreatorProfile';
import { BrandProfile } from '../models/BrandProfile';
import { Report } from '../models/Report';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';

export class ConversationController {
  public static async getConversations(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();

    // 1. Find all conversations where current user is a participant
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'email role isVerified')
      .populate('collaborationId', 'status totalAmount currency')
      .sort({ updatedAt: -1 });

    // 2. Collect other participant IDs to fetch profile dossiers
    const otherUserIds: Types.ObjectId[] = [];
    conversations.forEach((conv) => {
      conv.participants.forEach((p: any) => {
        if (p._id.toString() !== currentUserId) {
          otherUserIds.push(p._id);
        }
      });
    });

    const [creatorProfiles, brandProfiles] = await Promise.all([
      CreatorProfile.find({ userId: { $in: otherUserIds } }),
      BrandProfile.find({ userId: { $in: otherUserIds } }),
    ]);

    const creatorMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]));
    const brandMap = new Map(brandProfiles.map((b) => [b.userId.toString(), b]));

    // 3. Enrich conversations with counterpart information
    const enriched = conversations.map((conv) => {
      const convObj: any = conv.toObject();
      const otherParticipant = convObj.participants.find(
        (p: any) => p._id.toString() !== currentUserId
      );

      let otherProfile = null;
      if (otherParticipant) {
        otherProfile =
          creatorMap.get(otherParticipant._id.toString()) ||
          brandMap.get(otherParticipant._id.toString()) ||
          null;
      }

      // Read unread count for current user
      const unread = conv.unreadCounts?.get(currentUserId) || 0;

      return {
        ...convObj,
        otherParticipant: otherParticipant || null,
        otherProfile,
        unreadCount: unread,
      };
    });

    res.status(200).json({
      success: true,
      conversations: enriched,
    });
  }

  public static async getOrCreateConversation(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { targetUserId, collaborationId } = req.body;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      throw new AppError('Cannot start a conversation with yourself.', 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Target user not found.', 404);
    }

    // Check if conversation already exists between these 2 users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, new Types.ObjectId(targetUserId)] },
    }).populate('participants', 'email role isVerified');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, new Types.ObjectId(targetUserId)],
        collaborationId: collaborationId ? new Types.ObjectId(collaborationId) : undefined,
        unreadCounts: new Map(),
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'email role isVerified'
      );
    }

    // Fetch target user's profile
    const [cProfile, bProfile] = await Promise.all([
      CreatorProfile.findOne({ userId: targetUserId }),
      BrandProfile.findOne({ userId: targetUserId }),
    ]);

    const otherProfile = cProfile || bProfile || null;

    res.status(200).json({
      success: true,
      conversation,
      otherProfile,
    });
  }

  public static async getConversationById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();
    const conversation = await Conversation.findById(id)
      .populate('participants', 'email role isVerified')
      .populate('collaborationId');

    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    // Authorization check: User must be a participant
    const isParticipant = conversation.participants.some(
      (p: any) => p._id.toString() === currentUserId
    );

    if (!isParticipant) {
      throw new AppError('You do not have access to this conversation.', 403);
    }

    // Fetch counterpart profile
    const otherParticipant = conversation.participants.find(
      (p: any) => p._id.toString() !== currentUserId
    ) as any;

    let otherProfile = null;
    if (otherParticipant) {
      const [cProfile, bProfile] = await Promise.all([
        CreatorProfile.findOne({ userId: otherParticipant._id }),
        BrandProfile.findOne({ userId: otherParticipant._id }),
      ]);
      otherProfile = cProfile || bProfile || null;
    }

    res.status(200).json({
      success: true,
      conversation,
      otherParticipant,
      otherProfile,
      unreadCount: conversation.unreadCounts?.get(currentUserId) || 0,
    });
  }

  public static async getMessages(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { page, limit } = req.query as Record<string, any>;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );

    if (!isParticipant) {
      throw new AppError('You do not have access to messages in this conversation.', 403);
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, messages] = await Promise.all([
      Message.countDocuments({ conversationId: id }),
      Message.find({ conversationId: id })
        .populate('senderId', 'email role')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      messages,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  }

  public static async sendMessage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );

    if (!isParticipant) {
      throw new AppError('You do not have permission to send messages in this conversation.', 403);
    }

    if (conversation.isBlocked) {
      throw new AppError('This conversation is currently blocked. No messages can be sent.', 403);
    }

    // Determine receiver
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== currentUserId
    );

    if (!receiverId) {
      throw new AppError('No recipient found in this conversation.', 400);
    }

    // 1. Create Message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      receiverId,
      content,
      attachments: attachments || [],
      isRead: false,
    });

    // 2. Update Conversation state
    conversation.lastMessage = {
      content,
      senderId: req.user._id,
      createdAt: new Date(),
    };

    const currentUnread = conversation.unreadCounts?.get(receiverId.toString()) || 0;
    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }
    conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);

    await conversation.save();

    // 3. Emit real-time Socket event
    const io = req.app.get('io');
    if (io) {
      const messageObj = await Message.findById(message._id).populate('senderId', 'email role');
      // Broadcast to active conversation room
      io.to(`conversation:${id}`).emit('message:new', {
        message: messageObj,
      });

      // Also notify receiver's direct user room so badge / conversation list updates
      io.to(`user:${receiverId.toString()}`).emit('conversation:updated', {
        conversationId: id,
        lastMessage: conversation.lastMessage,
        unreadCount: currentUnread + 1,
      });
    }

    // 4. Dispatch notification to recipient
    await NotificationService.createAndEmit({
      recipientId: receiverId,
      senderId: req.user._id,
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.email}: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
      data: {
        conversationId: id,
        messageId: message._id.toString(),
      },
      io,
      sendEmail: true,
      actionUrl: `/messages?conversationId=${id}`,
    });

    res.status(201).json({
      success: true,
      message,
    });
  }

  public static async markConversationAsRead(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );

    if (!isParticipant) {
      throw new AppError('Access denied.', 403);
    }

    // 1. Mark unread messages where receiver is current user as read
    await Message.updateMany(
      {
        conversationId: id,
        receiverId: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // 2. Reset unread count for current user
    if (conversation.unreadCounts) {
      conversation.unreadCounts.set(currentUserId, 0);
      await conversation.save();
    }

    // 3. Emit read receipt via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${id}`).emit('conversation:read', {
        conversationId: id,
        readByUserId: currentUserId,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read.',
    });
  }

  public static async blockConversation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );

    if (!isParticipant) {
      throw new AppError('Access denied.', 403);
    }

    conversation.isBlocked = true;
    conversation.blockedBy = req.user._id;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation has been blocked.',
      conversation,
    });
  }

  public static async unblockConversation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    if (!conversation.isBlocked) {
      res.status(200).json({ success: true, message: 'Conversation is not blocked.' });
      return;
    }

    if (conversation.blockedBy && conversation.blockedBy.toString() !== currentUserId) {
      throw new AppError('Only the user who initiated the block can unblock this conversation.', 403);
    }

    conversation.isBlocked = false;
    conversation.blockedBy = undefined;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation has been unblocked.',
      conversation,
    });
  }

  public static async reportConversation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason, details } = req.body;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const currentUserId = req.user._id.toString();
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== currentUserId
    );

    if (!otherParticipant) {
      throw new AppError('Reported user could not be determined.', 400);
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reportedUserId: otherParticipant,
      conversationId: conversation._id,
      reason,
      details,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted for trust & safety review.',
      report,
    });
  }
}
