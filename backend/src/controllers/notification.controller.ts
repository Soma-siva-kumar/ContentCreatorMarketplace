import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';

export class NotificationController {
  public static async getMyNotifications(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { page, limit, unreadOnly } = req.query as Record<string, any>;

    const result = await NotificationService.getUserNotifications(req.user._id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      unreadOnly: unreadOnly === 'true',
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  }

  public static async markAsRead(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const notification = await NotificationService.markAsRead(id, req.user._id);
    if (!notification) {
      throw new AppError('Notification not found or access denied.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  }

  public static async markAllAsRead(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const modifiedCount = await NotificationService.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: `Marked ${modifiedCount} notifications as read.`,
      modifiedCount,
    });
  }

  public static async deleteNotification(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const deleted = await NotificationService.deleteNotification(id, req.user._id);
    if (!deleted) {
      throw new AppError('Notification not found or access denied.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted.',
    });
  }
}
