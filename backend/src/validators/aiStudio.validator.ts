import { z } from 'zod';

export const generateContentSchema = z.object({
  body: z.object({
    contentType: z.enum([
      'idea',
      'caption',
      'script',
      'reel_outline',
      'campaign_concept',
      'blog_outline',
      'calendar',
      'headline_cta',
      'image_prompt',
    ]),
    prompt: z.string().min(3, 'Prompt must be at least 3 characters long').max(4000, 'Prompt exceeds maximum character length'),
    platform: z.enum(['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'blog', 'general']).optional(),
    tone: z.string().optional(),
    brandVoice: z.string().optional(),
    targetAudience: z.string().optional(),
    language: z.string().optional(),
    campaignTitle: z.string().optional(),
    brandGuidelines: z.string().max(4000).optional(),
  }),
});

export const transformContentSchema = z.object({
  body: z.object({
    content: z.string().min(5, 'Content must be at least 5 characters long').max(10000),
    action: z.enum(['shorten', 'expand', 'tone_change']),
    targetTone: z.string().optional(),
    platform: z.enum(['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'blog', 'general']).optional(),
  }),
});

export const saveDraftSchema = z.object({
  body: z.object({
    draftId: z.string().optional(),
    title: z.string().min(1).max(150).optional(),
    contentType: z.enum([
      'idea',
      'caption',
      'script',
      'reel_outline',
      'campaign_concept',
      'blog_outline',
      'calendar',
      'headline_cta',
      'image_prompt',
    ]).optional(),
    platform: z.enum(['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'blog', 'general']).optional(),
    tone: z.string().optional(),
    brandVoice: z.string().optional(),
    targetAudience: z.string().optional(),
    language: z.string().optional(),
    inputPrompt: z.string().optional(),
    campaignId: z.string().optional(),
    currentContent: z.string().min(1, 'Content is required'),
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    revisionAction: z.enum(['initial', 'edit', 'regenerate', 'shorten', 'expand']).optional(),
    revisionNote: z.string().optional(),
  }),
});
