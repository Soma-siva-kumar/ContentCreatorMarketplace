import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    targetUserId: z
      .string({ required_error: 'targetUserId is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid target user ID format'),
    collaborationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid collaboration ID format')
      .optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z
      .string({ required_error: 'Message content is required' })
      .min(1, 'Message content cannot be empty')
      .max(5000, 'Message cannot exceed 5000 characters')
      .trim(),
    attachments: z
      .array(
        z.object({
          fileUrl: z.string().url('Invalid attachment URL'),
          fileName: z.string().min(1, 'File name is required'),
          fileSize: z.number().nonnegative().optional(),
          mimeType: z.string().optional(),
        })
      )
      .max(5, 'Maximum 5 attachments allowed per message')
      .optional(),
  }),
});

export const reportConversationSchema = z.object({
  body: z.object({
    reason: z.enum([
      'spam',
      'harassment',
      'fraud',
      'inappropriate_content',
      'intellectual_property',
      'other',
    ], { required_error: 'Valid report reason is required' }),
    details: z
      .string({ required_error: 'Details explaining the report are required' })
      .min(5, 'Report details must be at least 5 characters')
      .max(2000, 'Report details cannot exceed 2000 characters')
      .trim(),
  }),
});
