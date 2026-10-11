import { z } from 'zod';

export const creatorSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    niche: z.string().optional(),
    skill: z.string().optional(),
    tool: z.string().optional(),
    availability: z.enum(['available', 'busy', 'not_taking_clients']).optional(),
    minRate: z.coerce.number().min(0).optional(),
    maxRate: z.coerce.number().min(0).optional(),
    minCraftScore: z.coerce.number().min(0).max(100).optional(),
    sortBy: z.enum(['craftScore', 'rating', 'rate_asc', 'rate_desc', 'newest']).default('craftScore'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(12),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    collaborationId: z.string({ required_error: 'Collaboration ID is required' }),
    rating: z.number().min(1).max(5),
    reviewText: z.string().min(5, 'Review must be at least 5 characters'),
    communicationRating: z.number().min(1).max(5).optional(),
    qualityRating: z.number().min(1).max(5).optional(),
    timelinessRating: z.number().min(1).max(5).optional(),
  }),
});
