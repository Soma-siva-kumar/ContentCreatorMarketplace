import { Server as SocketIOServer } from 'socket.io';
import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { mailerService } from './mailer';

export interface CreateNotificationParams {
  recipientId: string | Types.ObjectId;
  senderId?: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  io?: SocketIOServer;
  sendEmail?: boolean;
  actionUrl?: string;
}

export class NotificationService {
  private static globalIO: SocketIOServer | null = null;

  public static setGlobalIO(io: SocketIOServer): void {
    this.globalIO = io;
  }

  public static async createAndEmit(params: CreateNotificationParams): Promise<INotification> {
    const {
      recipientId,
      senderId,
      type,
      title,
      message,
      data,
      io,
      sendEmail = false,
      actionUrl,
    } = params;

    // 1. Persist notification in MongoDB
    const notification = await Notification.create({
      recipientId: new Types.ObjectId(recipientId.toString()),
      senderId: senderId ? new Types.ObjectId(senderId.toString()) : undefined,
      type,
      title,
      message,
      data: data || {},
      isRead: false,
    });

    // 2. Real-time emit to recipient socket room
    const targetIO = io || this.globalIO;
    if (targetIO) {
      targetIO.to(`user:${recipientId.toString()}`).emit('notification:new', {
        notification: notification.toObject(),
      });
    }

    // 3. Optional Email Dispatch
    if (sendEmail) {
      try {
        const user = await User.findById(recipientId);
        if (user && user.email) {
          await mailerService.sendNotificationEmail(user.email, title, message, actionUrl);
        }
      } catch (err) {
        console.error('[NotificationService] Email dispatch failed:', err);
      }
    }

    return notification;
  }

  public static async getUserNotifications(
    userId: string | Types.ObjectId,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{
    notifications: INotification[];
    unreadCount: number;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      recipientId: new Types.ObjectId(userId.toString()),
    };

    if (options.unreadOnly) {
      filter.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipientId: new Types.ObjectId(userId.toString()),
        isRead: false,
      }),
      Notification.find(filter)
        .populate('senderId', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async markAsRead(
    notificationId: string,
    userId: string | Types.ObjectId
  ): Promise<INotification | null> {
    if (!Types.ObjectId.isValid(notificationId)) {
      return null;
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId.toString()),
      },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  public static async markAllAsRead(userId: string | Types.ObjectId): Promise<number> {
    const res = await Notification.updateMany(
      {
        recipientId: new Types.ObjectId(userId.toString()),
        isRead: false,
      },
      { isRead: true }
    );
    return res.modifiedCount;
  }

  public static async deleteNotification(
    notificationId: string,
    userId: string | Types.ObjectId
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(notificationId)) {
      return false;
    }

    const res = await Notification.deleteOne({
      _id: new Types.ObjectId(notificationId),
      recipientId: new Types.ObjectId(userId.toString()),
    });
    return res.deletedCount > 0;
  }
}
