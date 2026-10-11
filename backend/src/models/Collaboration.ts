import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type CollaborationStatus = 'active' | 'in_review' | 'completed' | 'disputed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'revision_requested';

export interface IMilestone {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  status: MilestoneStatus;
  deliverable?: {
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    caption?: string;
    notes?: string;
    submittedAt: Date;
    aiGuardianReviewId?: Types.ObjectId;
  };
  revisionNotes?: string;
  approvedAt?: Date;
}

export interface ICollaboration extends Document {
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  agreementId?: Types.ObjectId;
  status: CollaborationStatus;
  totalAmount: number;
  currency: string;
  milestones: IMilestone[];
  disputeReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'revision_requested'],
    default: 'pending',
  },
  deliverable: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    caption: String,
    notes: String,
    submittedAt: Date,
    aiGuardianReviewId: { type: Schema.Types.ObjectId, ref: 'ContentReview' },
  },
  revisionNotes: String,
  approvedAt: Date,
});

const CollaborationSchema = new Schema<ICollaboration>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    agreementId: {
      type: Schema.Types.ObjectId,
      ref: 'Agreement',
    },
    status: {
      type: String,
      enum: ['active', 'in_review', 'completed', 'disputed', 'cancelled'],
      default: 'active',
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    milestones: [MilestoneSchema],
    disputeReason: { type: String },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Collaboration: Model<ICollaboration> =
  mongoose.models.Collaboration ||
  mongoose.model<ICollaboration>('Collaboration', CollaborationSchema);
