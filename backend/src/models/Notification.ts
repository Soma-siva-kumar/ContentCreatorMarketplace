import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type NotificationType =
  | 'application_received'
  | 'application_status_updated'
  | 'collaboration_started'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'revision_requested'
  | 'new_message'
  | 'agreement_ready'
  | 'craft_score_updated'
  | 'guardian_review_complete'
  | 'review_received'
  | 'deadline_reminder';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
