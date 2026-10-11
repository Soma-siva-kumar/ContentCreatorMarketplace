import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLessons: string[]; // List of completed lesson keys
  quizScores: Map<string, number>;
  progressPercentage: number;
  isCompleted: boolean;
  certificateIssuedAt?: Date;
  certificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    completedLessons: [{ type: String }],
    quizScores: {
      type: Map,
      of: Number,
      default: {},
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    certificateIssuedAt: Date,
    certificateId: String,
  },
  {
    timestamps: true,
  }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
