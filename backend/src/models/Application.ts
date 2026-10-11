import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ApplicationStatus = 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

export interface IApplication extends Document {
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;
  pitch: string;
  proposedRate: number;
  estimatedDays: number;
  milestonesProposal: string;
  portfolioSamples: string[];
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pitch: {
      type: String,
      required: [true, 'Application pitch is required'],
      trim: true,
    },
    proposedRate: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDays: {
      type: Number,
      required: true,
      min: 1,
    },
    milestonesProposal: {
      type: String,
      default: '',
    },
    portfolioSamples: [{ type: String }],
    status: {
      type: String,
      enum: ['submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
      default: 'submitted',
      index: true,
    },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate proposals from same creator on same campaign
ApplicationSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });

export const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema);
