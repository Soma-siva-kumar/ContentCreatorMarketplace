import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILesson {
  title: string;
  durationMinutes: number;
  content: string;
  videoUrl?: string;
  order: number;
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface IModule {
  title: string;
  order: number;
  lessons: ILesson[];
  quiz?: {
    passingScorePercentage: number;
    questions: IQuizQuestion[];
  };
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl?: string;
  estimatedHours: number;
  modules: IModule[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  durationMinutes: { type: Number, default: 15 },
  content: { type: String, required: true },
  videoUrl: String,
  order: { type: Number, required: true },
});

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
});

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  lessons: [LessonSchema],
  quiz: {
    passingScorePercentage: { type: Number, default: 80 },
    questions: [QuizQuestionSchema],
  },
});

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    thumbnailUrl: String,
    estimatedHours: { type: Number, default: 2 },
    modules: [ModuleSchema],
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
