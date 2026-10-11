import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type InfringementStatus = 'clean' | 'reported' | 'under_review' | 'appealed' | 'resolved';

export interface IAsset extends Document {
  creatorId: Types.ObjectId;
  brandId?: Types.ObjectId;
  collaborationId?: Types.ObjectId;
  title: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  sha256Hash: string; // Cryptographic SHA-256 hash for provenance
  licenseType: 'full_transfer' | 'exclusive_commercial' | 'non_exclusive_commercial' | 'portfolio_only';
  commercialUseAllowed: boolean;
  derivativeAllowed: boolean;
  infringementStatus: InfringementStatus;
  infringementReport?: {
    reportedBy: Types.ObjectId;
    reason: string;
    evidenceUrls: string[];
    reportedAt: Date;
    appealNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    collaborationId: {
      type: Schema.Types.ObjectId,
      ref: 'Collaboration',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sha256Hash: {
      type: String,
      required: true,
      index: true,
    },
    licenseType: {
      type: String,
      enum: ['full_transfer', 'exclusive_commercial', 'non_exclusive_commercial', 'portfolio_only'],
      default: 'non_exclusive_commercial',
    },
    commercialUseAllowed: {
      type: Boolean,
      default: true,
    },
    derivativeAllowed: {
      type: Boolean,
      default: false,
    },
    infringementStatus: {
      type: String,
      enum: ['clean', 'reported', 'under_review', 'appealed', 'resolved'],
      default: 'clean',
      index: true,
    },
    infringementReport: {
      reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      evidenceUrls: [String],
      reportedAt: Date,
      appealNotes: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Asset: Model<IAsset> =
  mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
