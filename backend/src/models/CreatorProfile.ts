import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IPortfolioItem {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  url: string;
  mediaType: 'video' | 'image' | 'audio' | 'article';
  tags: string[];
  createdAt: Date;
}

export interface ICreatorProfile extends Document {
  userId: Types.ObjectId;
  displayName: string;
  tagline?: string;
  bio?: string;
  avatarUrl?: string;
  skills: string[];
  niches: string[];
  tools: string[];
  pricing: {
    hourlyRate?: number;
    projectMinimum?: number;
    currency: string;
  };
  availability: 'available' | 'busy' | 'not_taking_clients';
  experienceYears?: number;
  socialLinks: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  portfolio: IPortfolioItem[];
  craftScore: number;
  rating: number;
  reviewCount: number;
  completedCollaborationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioItemSchema = new Schema<IPortfolioItem>({
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String, required: true },
  mediaType: {
    type: String,
    enum: ['video', 'image', 'audio', 'article'],
    default: 'video',
  },
  tags: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
});

const CreatorProfileSchema = new Schema<ICreatorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      index: true,
    },
    tagline: { type: String, trim: true },
    bio: { type: String, trim: true },
    avatarUrl: { type: String },
    skills: [{ type: String, trim: true, index: true }],
    niches: [{ type: String, trim: true, index: true }],
    tools: [{ type: String, trim: true }],
    pricing: {
      hourlyRate: { type: Number, min: 0 },
      projectMinimum: { type: Number, min: 0 },
      currency: { type: String, default: 'USD' },
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'not_taking_clients'],
      default: 'available',
      index: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    socialLinks: {
      instagram: String,
      youtube: String,
      tiktok: String,
      twitter: String,
      linkedin: String,
      website: String,
    },
    portfolio: [PortfolioItemSchema],
    craftScore: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    completedCollaborationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for marketplace search
CreatorProfileSchema.index({
  displayName: 'text',
  tagline: 'text',
  bio: 'text',
  niches: 'text',
  skills: 'text',
});

export const CreatorProfile: Model<ICreatorProfile> =
  mongoose.models.CreatorProfile ||
  mongoose.model<ICreatorProfile>('CreatorProfile', CreatorProfileSchema);
