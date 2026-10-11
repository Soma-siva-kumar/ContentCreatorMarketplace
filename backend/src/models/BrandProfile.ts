import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IBrandProfile extends Document {
  userId: Types.ObjectId;
  companyName: string;
  logoUrl?: string;
  tagline?: string;
  description?: string;
  industry: string;
  websiteUrl?: string;
  companySize?: string;
  campaignInterests: string[];
  isVerified: boolean;
  verificationDocuments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BrandProfileSchema = new Schema<IBrandProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    logoUrl: { type: String },
    tagline: { type: String, trim: true },
    description: { type: String, trim: true },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
      index: true,
    },
    websiteUrl: { type: String, trim: true },
    companySize: { type: String },
    campaignInterests: [{ type: String, trim: true }],
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationDocuments: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

BrandProfileSchema.index({
  companyName: 'text',
  description: 'text',
  industry: 'text',
});

export const BrandProfile: Model<IBrandProfile> =
  mongoose.models.BrandProfile ||
  mongoose.model<IBrandProfile>('BrandProfile', BrandProfileSchema);
