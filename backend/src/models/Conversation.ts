import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  collaborationId?: Types.ObjectId;
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
  unreadCounts: Map<string, number>;
  isBlocked: boolean;
  blockedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    collaborationId: {
      type: Schema.Types.ObjectId,
      ref: 'Collaboration',
    },
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ participants: 1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
