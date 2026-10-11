import { z } from 'zod';

export const submitApplicationSchema = z.object({
  body: z.object({
    pitch: z.string().trim().min(10, 'Proposal pitch must be at least 10 characters'),
    proposedRate: z.number().min(0, 'Proposed rate must be positive'),
    estimatedDays: z.number().min(1, 'Estimated delivery days must be at least 1'),
    milestonesProposal: z.string().default(''),
    portfolioSamples: z.array(z.string().url('Invalid portfolio URL')).default([]),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['shortlisted', 'accepted', 'rejected']),
    rejectionReason: z.string().optional(),
  }),
});

export const submitMilestoneDeliverableSchema = z.object({
  body: z.object({
    fileUrl: z.string().url('Deliverable file URL is required'),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    caption: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const reviewMilestoneSchema = z.object({
  body: z.object({
    action: z.enum(['approve', 'request_revision']),
    revisionNotes: z.string().optional(),
  }),
});
