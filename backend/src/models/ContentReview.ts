import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ReviewStatus = 'clean' | 'needs_revision' | 'flagged' | 'appealed' | 'approved_by_admin';

export interface IReviewFlag {
  category: string;
  severity: 'info' | 'warning' | 'critical';
  feedback: string;
  passed: boolean;
}

export interface IContentReview extends Document {
  deliverableUrl: string;
  creatorId: Types.ObjectId;
  brandId: Types.ObjectId;
  collaborationId?: Types.ObjectId;
  caption: string;
  transcript?: string;
  status: ReviewStatus;
  complianceScore: number;
  brandAlignmentScore: number;
  ftcCompliance: {
    isCompliant: boolean;
    hasProperDisclosure: boolean;
    recommendation: string;
  };
  flags: IReviewFlag[];
  appealNotes?: string;
  reviewedByAdminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewFlagSchema = new Schema<IReviewFlag>({
  category: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], required: true },
  feedback: { type: String, required: true },
  passed: { type: Boolean, required: true },
});

const ContentReviewSchema = new Schema<IContentReview>(
  {
    deliverableUrl: {
      type: String,
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collaborationId: {
      type: Schema.Types.ObjectId,
      ref: 'Collaboration',
    },
    caption: {
      type: String,
      default: '',
    },
    transcript: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['clean', 'needs_revision', 'flagged', 'appealed', 'approved_by_admin'],
      default: 'clean',
      index: true,
    },
    complianceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    brandAlignmentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    ftcCompliance: {
      isCompliant: { type: Boolean, default: false },
      hasProperDisclosure: { type: Boolean, default: false },
      recommendation: { type: String, default: '' },
    },
    flags: [ReviewFlagSchema],
    appealNotes: { type: String },
    reviewedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const ContentReview: Model<IContentReview> =
  mongoose.models.ContentReview ||
  mongoose.model<IContentReview>('ContentReview', ContentReviewSchema);
