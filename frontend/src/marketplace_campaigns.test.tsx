import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MarketplacePage } from './pages/MarketplacePage';
import { CampaignsExplorePage } from './pages/CampaignsExplorePage';
import { AuthProvider } from './context/AuthContext';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  api: {
    checkHealth: vi.fn(),
    ping: vi.fn(),
    searchCreators: vi.fn(),
    exploreCampaigns: vi.fn(),
    getFavorites: vi.fn(),
  },
}));

describe('Phase 3 Frontend Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.getFavorites).mockResolvedValue({
      success: true,
      favorites: [],
    });
  });

  it('renders MarketplacePage with search filters and creator cards', async () => {
    vi.mocked(api.searchCreators).mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'c1',
          userId: 'u1',
          displayName: 'Elena Synthetics',
          tagline: 'GenAI Film Director',
          bio: 'Specializing in cinematic AI storyboards.',
          skills: ['Motion Design', 'Video Editing'],
          niches: ['AI Film & Video'],
          tools: ['Runway Gen-3', 'Midjourney v6'],
          pricing: {
            hourlyRate: 85,
            currency: 'USD',
          },
          availability: 'available',
          craftScore: 92,
          rating: 4.9,
          reviewCount: 7,
          completedCollaborationsCount: 5,
          socialLinks: {},
          portfolio: [],
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <MarketplacePage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Discover Top AI Content Creators/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Search by creator name, niche, skill, or AI tool/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Elena Synthetics')).toBeDefined();
      expect(screen.getByText('GenAI Film Director')).toBeDefined();
      expect(screen.getByText('92/100')).toBeDefined();
      expect(screen.getByText('$85/hr')).toBeDefined();
    });
  });

  it('renders CampaignsExplorePage with category filters and campaign briefs', async () => {
    vi.mocked(api.exploreCampaigns).mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'camp1',
          brandId: { _id: 'b1', email: 'sponsor@brand.com' },
          brandProfile: {
            companyName: 'Apex Audio Labs',
            industry: 'Consumer Tech',
            isVerified: true,
          },
          title: 'Spatial Audio Launch Video',
          description: 'Create high fidelity 3D audio-reactive videos.',
          category: 'AI Video Ad',
          budget: {
            min: 1500,
            max: 3000,
            currency: 'USD',
          },
          deliverables: [
            {
              title: '30s Hero Reel',
              format: 'short_video',
            },
          ],
          requiredSkills: ['Motion Design', 'Sound Design'],
          requiredTools: ['ElevenLabs'],
          status: 'published',
          applicationsCount: 3,
          acceptedApplicationsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 9,
        totalPages: 1,
      },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <CampaignsExplorePage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Opportunities & Creative Briefs/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Spatial Audio Launch Video')).toBeDefined();
      expect(screen.getByText('Apex Audio Labs')).toBeDefined();
      expect(screen.getByText('$1500 - $3000 USD')).toBeDefined();
    });
  });
});
