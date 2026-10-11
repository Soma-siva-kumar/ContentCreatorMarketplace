import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'fraud'
  | 'inappropriate_content'
  | 'intellectual_property'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  reportedUserId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'fraud', 'inappropriate_content', 'intellectual_property', 'other'],
      index: true,
    },
    details: {
      type: String,
      required: [true, 'Report details are required'],
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
