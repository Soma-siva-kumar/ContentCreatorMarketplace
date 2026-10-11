import { z } from 'zod';

export const deliverableSpecSchema = z.object({
  title: z.string().min(1, 'Deliverable title is required'),
  format: z.enum(['short_video', 'long_video', 'static_post', 'story', 'article']),
  quantity: z.number().min(1).default(1),
  deadline: z.string().datetime().optional().or(z.date()).or(z.string()),
  guidelines: z.string().optional(),
});

export const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Campaign title must be at least 3 characters'),
    description: z.string().trim().min(10, 'Campaign description must be at least 10 characters'),
    category: z.string().trim().min(2, 'Category is required'),
    budget: z.object({
      min: z.number().min(0, 'Minimum budget must be positive'),
      max: z.number().min(0, 'Maximum budget must be positive'),
      currency: z.string().default('USD'),
    }).refine((b) => b.max >= b.min, {
      message: 'Maximum budget must be greater than or equal to minimum budget',
    }),
    contentTypes: z.array(z.string()).default([]),
    targetAudience: z
      .object({
        ageRange: z.string().optional(),
        locations: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
      })
      .optional(),
    brandGuidelines: z.string().default(''),
    deliverables: z.array(deliverableSpecSchema).min(1, 'At least one deliverable is required'),
    requiredSkills: z.array(z.string()).default([]),
    applicationDeadline: z.string().datetime().optional().or(z.string()).or(z.date()),
    startDate: z.string().datetime().optional().or(z.string()).or(z.date()),
    endDate: z.string().datetime().optional().or(z.string()).or(z.date()),
    status: z.enum(['draft', 'published']).default('draft'),
  }),
});

export const updateCampaignSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).optional(),
    description: z.string().trim().min(10).optional(),
    category: z.string().trim().min(2).optional(),
    budget: z
      .object({
        min: z.number().min(0),
        max: z.number().min(0),
        currency: z.string().default('USD'),
      })
      .optional(),
    contentTypes: z.array(z.string()).optional(),
    targetAudience: z.object({
      ageRange: z.string().optional(),
      locations: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
    }).optional(),
    brandGuidelines: z.string().optional(),
    deliverables: z.array(deliverableSpecSchema).optional(),
    requiredSkills: z.array(z.string()).optional(),
    applicationDeadline: z.string().datetime().optional().or(z.string()).or(z.date()),
    startDate: z.string().datetime().optional().or(z.string()).or(z.date()),
    endDate: z.string().datetime().optional().or(z.string()).or(z.date()),
  }),
});

export const updateCampaignStatusSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'published', 'in_progress', 'completed', 'closed', 'cancelled']),
  }),
});
