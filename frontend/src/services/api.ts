import {
  HealthResponse,
  AuthResponse,
  User,
  CreatorProfileData,
  BrandProfileData,
  CampaignData,
  ApplicationData,
  CollaborationData,
  ReviewData,
  PaginationData,
  ConversationData,
  MessageData,
  MessageAttachment,
  NotificationData,
  ReportReason,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.set(key, String(val));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('hacxlerate_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Dual auth support: Bearer token header if present in localStorage + HTTP-only cookies
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Send HTTP-only cookies automatically
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let details: unknown = undefined;

    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.message) {
        errorMessage = errorJson.message;
      }
      details = errorJson.details || errorJson.errors || errorJson;
    } catch {
      // Non-JSON response
    }

    throw new ApiError(response.status, errorMessage, details);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  // System & Health
  checkHealth: () => request<HealthResponse>('/health'),
  ping: () => request<{ pong: boolean; timestamp: number }>('/health/ping'),

  // Authentication
  register: (data: unknown) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: unknown) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),
  getMe: () => request<{ success: boolean; user: User; profile: CreatorProfileData | BrandProfileData | null }>('/auth/me'),
  verifyEmail: (token: string) => request<{ success: boolean; message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  forgotPassword: (email: string) => request<{ success: boolean; message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; newPassword: string }) => request<{ success: boolean; message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => request<{ success: boolean; message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  deactivateAccount: () => request<{ success: boolean; message: string }>('/auth/deactivate', { method: 'POST' }),
  deleteAccount: () => request<{ success: boolean; message: string }>('/auth/delete-account', { method: 'DELETE' }),

  // Profiles
  getMyProfile: () => request<{ success: boolean; role: string; profile: CreatorProfileData | BrandProfileData }>('/profiles/me'),
  updateCreatorProfile: (data: Partial<CreatorProfileData>) => request<{ success: boolean; message: string; profile: CreatorProfileData }>('/profiles/creator', { method: 'PUT', body: JSON.stringify(data) }),
  updateBrandProfile: (data: Partial<BrandProfileData>) => request<{ success: boolean; message: string; profile: BrandProfileData }>('/profiles/brand', { method: 'PUT', body: JSON.stringify(data) }),
  getPublicCreatorProfile: (id: string) => request<{ success: boolean; profile: CreatorProfileData }>(`/profiles/creator/${id}`),
  getPublicBrandProfile: (id: string) => request<{ success: boolean; profile: BrandProfileData }>(`/profiles/brand/${id}`),

  // Marketplace & Creators
  searchCreators: (params?: Record<string, any>) =>
    request<{ success: boolean; data: CreatorProfileData[]; pagination: PaginationData }>(
      `/marketplace/creators${toQuery(params)}`
    ),
  getCreatorDetail: (id: string) =>
    request<{ success: boolean; profile: CreatorProfileData; reviews: ReviewData[] }>(
      `/marketplace/creators/${id}`
    ),
  toggleFavorite: (creatorId: string) =>
    request<{ success: boolean; favorited: boolean; message: string }>(
      `/marketplace/favorites/${creatorId}`,
      { method: 'POST' }
    ),
  getFavorites: () =>
    request<{ success: boolean; favorites: CreatorProfileData[] }>('/marketplace/favorites'),

  // Campaigns
  createCampaign: (data: Partial<CampaignData>) =>
    request<{ success: boolean; message: string; campaign: CampaignData }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBrandCampaigns: () =>
    request<{ success: boolean; campaigns: CampaignData[] }>('/campaigns/brand'),
  exploreCampaigns: (params?: Record<string, any>) =>
    request<{ success: boolean; data: CampaignData[]; pagination: PaginationData }>(
      `/campaigns${toQuery(params)}`
    ),
  getCampaignById: (id: string) =>
    request<{ success: boolean; campaign: CampaignData; brandProfile?: BrandProfileData }>(
      `/campaigns/${id}`
    ),
  updateCampaign: (id: string, data: Partial<CampaignData>) =>
    request<{ success: boolean; message: string; campaign: CampaignData }>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateCampaignStatus: (id: string, status: string) =>
    request<{ success: boolean; message: string; campaign: CampaignData }>(
      `/campaigns/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    ),
  deleteCampaign: (id: string) =>
    request<{ success: boolean; message: string }>(`/campaigns/${id}`, {
      method: 'DELETE',
    }),

  // Applications
  applyToCampaign: (
    campaignId: string,
    data: {
      pitch: string;
      proposedRate: number;
      estimatedDays: number;
      milestonesProposal?: string;
      portfolioSamples?: string[];
    }
  ) =>
    request<{ success: boolean; message: string; application: ApplicationData }>(
      `/campaigns/${campaignId}/apply`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  getMyApplications: () =>
    request<{ success: boolean; applications: ApplicationData[] }>('/applications/my'),
  getCampaignApplications: (campaignId: string) =>
    request<{ success: boolean; applications: ApplicationData[] }>(
      `/campaigns/${campaignId}/applications`
    ),
  updateApplicationStatus: (
    id: string,
    data: { status: string; rejectionReason?: string }
  ) =>
    request<{
      success: boolean;
      message: string;
      application: ApplicationData;
      collaboration?: CollaborationData;
    }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  withdrawApplication: (id: string) =>
    request<{ success: boolean; message: string }>(`/applications/${id}/withdraw`, {
      method: 'POST',
    }),

  // Collaborations
  getMyCollaborations: () =>
    request<{ success: boolean; collaborations: CollaborationData[] }>('/collaborations/my'),
  getCollaborationById: (id: string) =>
    request<{
      success: boolean;
      collaboration: CollaborationData;
      brandProfile?: BrandProfileData;
      creatorProfile?: CreatorProfileData;
      isBrand: boolean;
      isCreator: boolean;
      hasReviewed: boolean;
      review?: ReviewData | null;
    }>(`/collaborations/${id}`),
  submitMilestoneDeliverable: (
    id: string,
    milestoneId: string,
    data: {
      fileUrl: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      caption?: string;
      notes?: string;
    }
  ) =>
    request<{ success: boolean; message: string; collaboration: CollaborationData }>(
      `/collaborations/${id}/milestones/${milestoneId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  reviewMilestoneDeliverable: (
    id: string,
    milestoneId: string,
    data: { action: 'approve' | 'request_revision'; revisionNotes?: string }
  ) =>
    request<{ success: boolean; message: string; collaboration: CollaborationData }>(
      `/collaborations/${id}/milestones/${milestoneId}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  submitReview: (
    id: string,
    data: {
      rating: number;
      reviewText: string;
      communicationRating?: number;
      qualityRating?: number;
      timelinessRating?: number;
    }
  ) =>
    request<{ success: boolean; message: string; review: ReviewData }>(
      `/collaborations/${id}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Conversations & Real-time Messaging
  getConversations: () =>
    request<{ success: boolean; conversations: ConversationData[] }>('/conversations'),

  getOrCreateConversation: (data: { targetUserId: string; collaborationId?: string }) =>
    request<{
      success: boolean;
      conversation: ConversationData;
      otherParticipant?: any;
      otherProfile?: any;
    }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getConversationById: (id: string) =>
    request<{
      success: boolean;
      conversation: ConversationData;
      otherParticipant?: any;
      otherProfile?: any;
      unreadCount?: number;
    }>(`/conversations/${id}`),

  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    request<{
      success: boolean;
      messages: MessageData[];
      pagination: PaginationData;
    }>(`/conversations/${conversationId}/messages${toQuery(params)}`),

  sendMessage: (
    conversationId: string,
    data: { content: string; attachments?: MessageAttachment[] }
  ) =>
    request<{
      success: boolean;
      message: MessageData;
      conversation: ConversationData;
    }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markConversationAsRead: (conversationId: string) =>
    request<{ success: boolean; message: string; conversationId: string }>(
      `/conversations/${conversationId}/read`,
      {
        method: 'PATCH',
      }
    ),

  blockConversation: (conversationId: string) =>
    request<{ success: boolean; message: string; conversation: ConversationData }>(
      `/conversations/${conversationId}/block`,
      {
        method: 'POST',
      }
    ),

  unblockConversation: (conversationId: string) =>
    request<{ success: boolean; message: string; conversation: ConversationData }>(
      `/conversations/${conversationId}/unblock`,
      {
        method: 'POST',
      }
    ),

  reportConversation: (
    conversationId: string,
    data: { reportedUserId: string; reason: ReportReason; details?: string }
  ) =>
    request<{ success: boolean; message: string }>(
      `/conversations/${conversationId}/report`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Notifications
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    request<{
      success: boolean;
      notifications: NotificationData[];
      unreadCount: number;
      pagination: PaginationData;
    }>(`/notifications${toQuery(params)}`),

  markNotificationAsRead: (id: string) =>
    request<{ success: boolean; message: string; notification: NotificationData }>(
      `/notifications/${id}/read`,
      {
        method: 'PATCH',
      }
    ),

  markAllNotificationsAsRead: () =>
    request<{ success: boolean; message: string; modifiedCount: number }>(
      '/notifications/read-all',
      {
        method: 'POST',
      }
    ),

  deleteNotification: (id: string) =>
    request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};
