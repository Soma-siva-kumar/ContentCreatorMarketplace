import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type CampaignStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';

export interface IDeliverableSpec {
  _id?: Types.ObjectId;
  title: string;
  format: 'short_video' | 'long_video' | 'static_post' | 'story' | 'article';
  quantity: number;
  deadline?: Date;
  guidelines?: string;
}

export interface ICampaign extends Document {
  brandId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  status: CampaignStatus;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  contentTypes: string[];
  targetAudience: {
    ageRange?: string;
    locations?: string[];
    interests?: string[];
  };
  brandGuidelines: string;
  deliverables: IDeliverableSpec[];
  requiredSkills: string[];
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  applicationsCount: number;
  acceptedApplicationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverableSpecSchema = new Schema<IDeliverableSpec>({
  title: { type: String, required: true },
  format: {
    type: String,
    enum: ['short_video', 'long_video', 'static_post', 'story', 'article'],
    required: true,
  },
  quantity: { type: Number, default: 1, min: 1 },
  deadline: { type: Date },
  guidelines: { type: String },
});

const CampaignSchema = new Schema<ICampaign>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required'],
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'USD' },
    },
    contentTypes: [{ type: String, trim: true }],
    targetAudience: {
      ageRange: String,
      locations: [String],
      interests: [String],
    },
    brandGuidelines: {
      type: String,
      default: '',
    },
    deliverables: [DeliverableSpecSchema],
    requiredSkills: [{ type: String, trim: true }],
    applicationDeadline: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    applicationsCount: { type: Number, default: 0 },
    acceptedApplicationsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
});

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
