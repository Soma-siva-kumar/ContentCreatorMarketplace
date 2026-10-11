import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IFavorite extends Document {
  userId: Types.ObjectId;
  creatorId: Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

FavoriteSchema.index({ userId: 1, creatorId: 1 }, { unique: true });

export const Favorite: Model<IFavorite> =
  mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);
