import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IReview extends Document {
  creatorId: Types.ObjectId;
  brandId: Types.ObjectId;
  collaborationId: Types.ObjectId;
  rating: number; // 1 to 5
  reviewText: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
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
      required: true,
      index: true,
    },
    collaborationId: {
      type: Schema.Types.ObjectId,
      ref: 'Collaboration',
      required: true,
      unique: true, // Only one review per collaboration
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
    },
    communicationRating: { type: Number, min: 1, max: 5 },
    qualityRating: { type: Number, min: 1, max: 5 },
    timelinessRating: { type: Number, min: 1, max: 5 },
  },
  {
    timestamps: true,
  }
);

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
