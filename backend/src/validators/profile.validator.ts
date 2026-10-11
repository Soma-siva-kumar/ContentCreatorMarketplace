import { z } from 'zod';

export const updateCreatorProfileSchema = z.object({
  body: z.object({
    displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').optional(),
    tagline: z.string().trim().max(150, 'Tagline cannot exceed 150 characters').optional(),
    bio: z.string().trim().max(2000, 'Bio cannot exceed 2000 characters').optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
    skills: z.array(z.string().trim()).optional(),
    niches: z.array(z.string().trim()).optional(),
    tools: z.array(z.string().trim()).optional(),
    pricing: z
      .object({
        hourlyRate: z.number().min(0).optional(),
        projectMinimum: z.number().min(0).optional(),
        currency: z.string().default('USD'),
      })
      .optional(),
    availability: z.enum(['available', 'busy', 'not_taking_clients']).optional(),
    experienceYears: z.number().min(0).max(50).optional(),
    socialLinks: z
      .object({
        instagram: z.string().optional(),
        youtube: z.string().optional(),
        tiktok: z.string().optional(),
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
      })
      .optional(),
    portfolio: z
      .array(
        z.object({
          title: z.string().trim().min(1, 'Portfolio title is required'),
          description: z.string().trim().optional(),
          url: z.string().trim().min(1, 'Portfolio URL is required'),
          mediaType: z.enum(['video', 'image', 'audio', 'article']).default('video'),
          tags: z.array(z.string().trim()).default([]),
        })
      )
      .optional(),
  }),
});

export const updateBrandProfileSchema = z.object({
  body: z.object({
    companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').optional(),
    logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
    tagline: z.string().trim().max(150, 'Tagline cannot exceed 150 characters').optional(),
    description: z.string().trim().max(3000, 'Description cannot exceed 3000 characters').optional(),
    industry: z.string().trim().min(2, 'Industry is required').optional(),
    websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
    companySize: z.string().trim().optional(),
    campaignInterests: z.array(z.string().trim()).optional(),
  }),
});
