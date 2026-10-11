export type UserRole = 'creator' | 'brand' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface PortfolioItem {
  _id?: string;
  title: string;
  description?: string;
  url: string;
  mediaType: 'video' | 'image' | 'audio' | 'article';
  tags: string[];
  createdAt: string;
}

export interface CreatorProfileData {
  _id?: string;
  userId: string;
  displayName: string;
  tagline?: string;
  bio?: string;
  avatarUrl?: string;
  skills: string[];
  niches: string[];
  tools: string[];
  pricing: {
    hourlyRate?: number;
    projectMinimum?: number;
    currency: string;
  };
  availability: 'available' | 'busy' | 'not_taking_clients';
  experienceYears?: number;
  socialLinks: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  portfolio: PortfolioItem[];
  craftScore: number;
  rating: number;
  reviewCount: number;
  completedCollaborationsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandProfileData {
  _id?: string;
  userId: string;
  companyName: string;
  logoUrl?: string;
  tagline?: string;
  description?: string;
  industry: string;
  websiteUrl?: string;
  companySize?: string;
  campaignInterests: string[];
  isVerified: boolean;
  verificationDocuments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  profile: CreatorProfileData | BrandProfileData | null;
  token?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  project: string;
  subtitle: string;
  environment: string;
  timestamp: string;
  database: {
    status: 'connected' | 'connecting' | 'disconnected' | 'unknown';
    engine: string;
    host: string;
    database: string;
  };
  aiService: {
    provider: string;
    mode: string;
    model: string;
    isLiveKeyConfigured: boolean;
  };
}

// Phase 3: Marketplace, Campaigns, Applications, Collaborations & Reviews

export interface ReviewData {
  _id: string;
  creatorId: string;
  brandId: {
    _id: string;
    email: string;
  } | string;
  collaborationId: string;
  rating: number;
  reviewText: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableItem {
  _id?: string;
  title: string;
  format: 'short_video' | 'long_video' | 'static_post' | 'carousel' | 'story' | 'audio' | 'article' | 'other';
  description?: string;
  quantity?: number;
  aspectRatio?: string;
  deadline?: string;
  guidelines?: string;
}

export interface CampaignData {
  _id: string;
  brandId: {
    _id: string;
    email: string;
  } | string;
  brandProfile?: {
    companyName: string;
    logoUrl?: string;
    industry: string;
    isVerified: boolean;
  } | null;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  deliverables: DeliverableItem[];
  requiredSkills: string[];
  requiredTools: string[];
  targetAudience?: string;
  brandGuidelines?: string;
  keyPerformanceIndicators?: string[];
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  applicationDeadline?: string;
  applicationsCount: number;
  acceptedApplicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationData {
  _id: string;
  campaignId: CampaignData | string;
  creatorId: {
    _id: string;
    email: string;
    isVerified?: boolean;
    createdAt?: string;
  } | string;
  creatorProfile?: CreatorProfileData | null;
  pitch: string;
  proposedRate: number;
  estimatedDays: number;
  milestonesProposal?: string;
  portfolioSamples?: string[];
  status: 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneDeliverable {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  notes?: string;
  submittedAt: string;
}

export interface CollaborationMilestone {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'submitted' | 'revision_requested' | 'approved';
  deliverable?: MilestoneDeliverable;
  revisionNotes?: string;
  approvedAt?: string;
}

export interface CollaborationData {
  _id: string;
  campaignId: CampaignData;
  brandId: {
    _id: string;
    email: string;
  };
  creatorId: {
    _id: string;
    email: string;
  };
  status: 'active' | 'in_review' | 'completed' | 'disputed' | 'cancelled';
  totalAmount: number;
  currency: string;
  milestones: CollaborationMilestone[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Phase 4: Real-time Messaging, Notifications & Safety Controls

export interface MessageAttachment {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
}

export interface MessageData {
  _id: string;
  conversationId: string;
  senderId:
    | {
        _id: string;
        email: string;
        role: UserRole;
      }
    | string;
  receiverId:
    | {
        _id: string;
        email: string;
        role: UserRole;
      }
    | string;
  content: string;
  attachments: MessageAttachment[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationData {
  _id: string;
  participants: Array<
    | {
        _id: string;
        email: string;
        role: UserRole;
        isVerified?: boolean;
      }
    | string
  >;
  collaborationId?: {
    _id: string;
    status: string;
    totalAmount: number;
    currency: string;
  } | string;
  lastMessage?: {
    content: string;
    senderId: { _id: string; email: string } | string;
    createdAt: string;
  };
  unreadCounts?: Record<string, number>;
  unreadCount?: number;
  isBlocked: boolean;
  blockedBy?: { _id: string; email: string } | string;
  otherParticipant?: {
    _id: string;
    email: string;
    role: UserRole;
    isVerified?: boolean;
  } | null;
  otherProfile?: CreatorProfileData | BrandProfileData | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'application_received'
  | 'application_status_updated'
  | 'collaboration_started'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'revision_requested'
  | 'new_message'
  | 'agreement_ready'
  | 'craft_score_updated'
  | 'guardian_review_complete'
  | 'review_received'
  | 'deadline_reminder';

export interface NotificationData {
  _id: string;
  recipientId: string;
  senderId?: {
    _id: string;
    email: string;
  } | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'copyright_infringement'
  | 'fraud'
  | 'inappropriate_content'
  | 'other';

export interface ReportData {
  _id: string;
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  reason: ReportReason;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

// Phase 5: AI Content Studio & Drafts

export type AIContentType =
  | 'idea'
  | 'caption'
  | 'script'
  | 'reel_outline'
  | 'campaign_concept'
  | 'blog_outline'
  | 'calendar'
  | 'headline_cta'
  | 'image_prompt';

export type AIPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'blog'
  | 'general';

export interface AIProviderStatus {
  provider: 'gemini' | 'local-heuristic';
  mode: 'live-api' | 'offline-deterministic';
  model: string;
  isLiveKeyConfigured: boolean;
  rateLimitInfo: {
    maxPerMinute: number;
    maxPerDay: number;
  };
}

export interface AIUsageStats {
  minuteCount: number;
  minuteRemaining: number;
  dayCount: number;
  dayRemaining: number;
}

export interface GenerateContentRequest {
  contentType: AIContentType;
  prompt: string;
  platform?: AIPlatform;
  tone?: string;
  brandVoice?: string;
  targetAudience?: string;
  language?: string;
  campaignTitle?: string;
  brandGuidelines?: string;
}

export interface GeneratedResult {
  provider: 'gemini' | 'local-heuristic';
  mode: 'live-api' | 'offline-deterministic';
  model: string;
  contentType: AIContentType;
  title: string;
  content: string;
  formattedPreview: string;
  metadata: {
    hooks?: string[];
    suggestedHashtags?: string[];
    visualPrompts?: string[];
    scenes?: Array<{
      timing: string;
      visual: string;
      audio: string;
      speech: string;
    }>;
    calendarEvents?: Array<{
      day: string;
      platform: string;
      contentType: string;
      hook: string;
      cta: string;
    }>;
    headlines?: string[];
    callsToAction?: string[];
    imagePromptData?: {
      prompt: string;
      aspectRatio: string;
      negativePrompt: string;
      styleKeywords: string[];
    };
  };
  disclosureGuidance: {
    requiresSyntheticLabel: boolean;
    recommendedLabels: string[];
    platformPolicyNotes: Record<string, string>;
  };
}

export interface DraftRevisionData {
  revisionId: string;
  content: string;
  action: 'initial' | 'edit' | 'regenerate' | 'shorten' | 'expand';
  note?: string;
  createdAt: string;
}

export interface ContentDraftData {
  _id: string;
  userId: string;
  title: string;
  contentType: AIContentType;
  platform: AIPlatform;
  tone?: string;
  brandVoice?: string;
  targetAudience?: string;
  language: string;
  inputPrompt: string;
  campaignId?: any;
  currentContent: string;
  revisions: DraftRevisionData[];
  metadata: Record<string, any>;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

