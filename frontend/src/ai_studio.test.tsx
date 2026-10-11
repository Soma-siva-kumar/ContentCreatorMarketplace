import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AIStudioPage } from './pages/AIStudioPage';
import { AuthProvider } from './context/AuthContext';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  api: {
    checkHealth: vi.fn(),
    ping: vi.fn(),
    getAIStatus: vi.fn(),
    generateAIContent: vi.fn(),
    transformAIContent: vi.fn(),
    saveAIDraft: vi.fn(),
    getAIDrafts: vi.fn(),
    getAIDraftById: vi.fn(),
    deleteAIDraft: vi.fn(),
    toggleAIDraftFavorite: vi.fn(),
    getBrandCampaigns: vi.fn(),
  },
}));

describe('Phase 5: AI Content Studio Workspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.getAIStatus).mockResolvedValue({
      success: true,
      status: {
        provider: 'local-heuristic',
        mode: 'offline-deterministic',
        model: 'hacxlerate-deterministic-v1',
        isLiveKeyConfigured: false,
        rateLimitInfo: { maxPerMinute: 60, maxPerDay: 300 },
      },
      usage: {
        minuteCount: 2,
        minuteRemaining: 58,
        dayCount: 5,
        dayRemaining: 295,
      },
    });

    vi.mocked(api.getAIDrafts).mockResolvedValue({
      success: true,
      drafts: [
        {
          _id: 'draft1',
          userId: 'u1',
          title: 'Viral AI Storyboard',
          contentType: 'script',
          platform: 'tiktok',
          tone: 'authentic',
          inputPrompt: '3-step video creation',
          currentContent: 'SCENE 1: High energy hook',
          revisions: [],
          metadata: {},
          isFavorite: false,
          tags: ['tiktok'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });
  });

  it('renders AI Content Studio page with provider status and template tabs', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <AIStudioPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('AI Content Studio')).toBeDefined();
    expect(screen.getByText(/Ideas & Hooks/i)).toBeDefined();
    expect(screen.getByText(/Social Captions/i)).toBeDefined();
    expect(screen.getByText(/Video Script/i)).toBeDefined();
    expect(screen.getByText(/Content Calendar/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Local Heuristic v1')).toBeDefined();
      expect(screen.getByText(/58/i)).toBeDefined();
    });
  });

  it('submits generation form and renders structured creative output', async () => {
    vi.mocked(api.generateAIContent).mockResolvedValue({
      success: true,
      result: {
        provider: 'local-heuristic',
        mode: 'offline-deterministic',
        model: 'hacxlerate-deterministic-v1',
        contentType: 'idea',
        title: 'Creative Concept: Spatial Audio Launch',
        content: '# Creative Concept: Spatial Audio Launch\n\nStop scrolling if you care about 3D audio!',
        formattedPreview: 'Stop scrolling if you care about 3D audio!',
        metadata: {
          hooks: ['"The biggest mistake audio creators make..."'],
          suggestedHashtags: ['#AudioDesign', '#SpatialAudio'],
        },
        disclosureGuidance: {
          requiresSyntheticLabel: false,
          recommendedLabels: ['Created with AI assistance'],
          platformPolicyNotes: { instagram: 'Synthetic media guidance' },
        },
      },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <AIStudioPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const promptTextarea = screen.getByPlaceholderText(/e\.g\. 3 high-impact hooks/i);
    fireEvent.change(promptTextarea, {
      target: { value: 'Spatial Audio Launch Campaign' },
    });

    const submitBtn = screen.getByRole('button', { name: /Generate with Studio AI/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.generateAIContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'idea',
          prompt: 'Spatial Audio Launch Campaign',
        })
      );
      expect(screen.getByText('Creative Concept: Spatial Audio Launch')).toBeDefined();
      expect(screen.getByText('"The biggest mistake audio creators make..."')).toBeDefined();
      expect(screen.getByText('#AudioDesign')).toBeDefined();
    });
  });

  it('transforms content when Shorten button is clicked', async () => {
    vi.mocked(api.generateAIContent).mockResolvedValue({
      success: true,
      result: {
        provider: 'local-heuristic',
        mode: 'offline-deterministic',
        model: 'hacxlerate-deterministic-v1',
        contentType: 'caption',
        title: 'Caption draft',
        content: 'Long creative caption with lots of preliminary discussion and detail.',
        formattedPreview: 'Long caption',
        metadata: {},
        disclosureGuidance: {
          requiresSyntheticLabel: false,
          recommendedLabels: [],
          platformPolicyNotes: {},
        },
      },
    });

    vi.mocked(api.transformAIContent).mockResolvedValue({
      success: true,
      transformed: {
        content: 'Short punchy caption.',
        provider: 'local-heuristic',
        mode: 'offline-deterministic',
      },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <AIStudioPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const promptTextarea = screen.getByPlaceholderText(/e\.g\. 3 high-impact hooks/i);
    fireEvent.change(promptTextarea, { target: { value: 'Test caption' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate with Studio AI/i }));

    await waitFor(() => {
      expect(screen.getByText('Shorten')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Shorten'));

    await waitFor(() => {
      expect(api.transformAIContent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'shorten',
        })
      );
    });
  });

  it('saves draft to MongoDB database via api.saveAIDraft', async () => {
    vi.mocked(api.generateAIContent).mockResolvedValue({
      success: true,
      result: {
        provider: 'local-heuristic',
        mode: 'offline-deterministic',
        model: 'hacxlerate-deterministic-v1',
        contentType: 'script',
        title: 'Draft Script',
        content: 'SCENE 1: Visuals',
        formattedPreview: 'SCENE 1',
        metadata: {},
        disclosureGuidance: {
          requiresSyntheticLabel: true,
          recommendedLabels: ['Altered content'],
          platformPolicyNotes: {},
        },
      },
    });

    vi.mocked(api.saveAIDraft).mockResolvedValue({
      success: true,
      message: 'Draft saved',
      draft: {
        _id: 'draft99',
        userId: 'u1',
        title: 'Draft Script',
        contentType: 'script',
        platform: 'instagram',
        inputPrompt: 'My test prompt',
        currentContent: 'SCENE 1: Visuals',
        revisions: [],
        metadata: {},
        isFavorite: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <AIStudioPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const promptTextarea = screen.getByPlaceholderText(/e\.g\. 3 high-impact hooks/i);
    fireEvent.change(promptTextarea, { target: { value: 'My test prompt' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate with Studio AI/i }));

    await waitFor(() => {
      expect(screen.getByText('Save Draft')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Save Draft'));

    await waitFor(() => {
      expect(api.saveAIDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          currentContent: 'SCENE 1: Visuals',
        })
      );
    });
  });
});
