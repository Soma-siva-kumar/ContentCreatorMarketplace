import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AIContentType =
  | 'idea'
  | 'caption'
  | 'script'
  | 'reel_outline'
  | 'campaign_concept'
  | 'blog_outline'
  | 'calendar'
  | 'headline_cta'
  | 'image_prompt';

export type AIPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'blog'
  | 'general';

export interface IDraftRevision {
  revisionId: string;
  content: string;
  action: 'initial' | 'edit' | 'regenerate' | 'shorten' | 'expand';
  note?: string;
  createdAt: Date;
}

export interface IContentDraft extends Document {
  userId: Types.ObjectId;
  title: string;
  contentType: AIContentType;
  platform: AIPlatform;
  tone?: string;
  brandVoice?: string;
  targetAudience?: string;
  language: string;
  inputPrompt: string;
  campaignId?: Types.ObjectId;
  currentContent: string;
  revisions: IDraftRevision[];
  metadata: Record<string, unknown>;
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DraftRevisionSchema = new Schema<IDraftRevision>(
  {
    revisionId: { type: String, required: true },
    content: { type: String, required: true },
    action: {
      type: String,
      enum: ['initial', 'edit', 'regenerate', 'shorten', 'expand'],
      default: 'initial',
    },
    note: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ContentDraftSchema = new Schema<IContentDraft>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    contentType: {
      type: String,
      required: true,
      enum: [
        'idea',
        'caption',
        'script',
        'reel_outline',
        'campaign_concept',
        'blog_outline',
        'calendar',
        'headline_cta',
        'image_prompt',
      ],
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'blog', 'general'],
      default: 'general',
    },
    tone: { type: String, default: 'casual' },
    brandVoice: { type: String, default: 'authentic' },
    targetAudience: { type: String, default: '' },
    language: { type: String, default: 'English' },
    inputPrompt: { type: String, required: true },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    currentContent: {
      type: String,
      required: [true, 'Content is required'],
    },
    revisions: {
      type: [DraftRevisionSchema],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ContentDraftSchema.index({ userId: 1, contentType: 1 });
ContentDraftSchema.index({ userId: 1, isFavorite: 1 });
ContentDraftSchema.index({ userId: 1, updatedAt: -1 });

export const ContentDraft: Model<IContentDraft> =
  mongoose.models.ContentDraft ||
  mongoose.model<IContentDraft>('ContentDraft', ContentDraftSchema);
