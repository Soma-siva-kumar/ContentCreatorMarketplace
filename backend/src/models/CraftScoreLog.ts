import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ICraftScoreBreakdown {
  portfolioQualityScore: number; // 0-100 (Weight: 25%)
  originalityConfidence: number; // 0-100 (Weight: 25%)
  completionReliability: number; // 0-100 (Weight: 25%)
  clientSatisfactionScore: number; // 0-100 (Weight: 15%)
  academySkillScore: number; // 0-100 (Weight: 10%)
}

export interface ICraftScoreLog extends Document {
  creatorId: Types.ObjectId;
  scoreVersion: string;
  overallScore: number;
  breakdown: ICraftScoreBreakdown;
  calculationFactors: {
    verifiedReviewsCount: number;
    collaborationsAnalyzed: number;
    coursesCompleted: number;
    originalAssetsVerified: number;
  };
  explanationSummary: string;
  calculatedAt: Date;
  createdAt: Date;
}

const CraftScoreLogSchema = new Schema<ICraftScoreLog>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scoreVersion: {
      type: String,
      default: 'v1.0-explainable',
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    breakdown: {
      portfolioQualityScore: { type: Number, required: true },
      originalityConfidence: { type: Number, required: true },
      completionReliability: { type: Number, required: true },
      clientSatisfactionScore: { type: Number, required: true },
      academySkillScore: { type: Number, required: true },
    },
    calculationFactors: {
      verifiedReviewsCount: { type: Number, default: 0 },
      collaborationsAnalyzed: { type: Number, default: 0 },
      coursesCompleted: { type: Number, default: 0 },
      originalAssetsVerified: { type: Number, default: 0 },
    },
    explanationSummary: {
      type: String,
      required: true,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const CraftScoreLog: Model<ICraftScoreLog> =
  mongoose.models.CraftScoreLog ||
  mongoose.model<ICraftScoreLog>('CraftScoreLog', CraftScoreLogSchema);
