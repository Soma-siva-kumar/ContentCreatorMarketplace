import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
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

describe('App & Homepage Component', () => {
  beforeEach(() => {
    vi.mocked(api.checkHealth).mockResolvedValue({
      status: 'healthy',
      project: 'HacXLerate — Kampus.VC',
      subtitle: 'AI-powered content creator marketplace connecting creators and brands',
      environment: 'test',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        engine: 'MongoDB',
        host: 'localhost',
        database: 'hacxlerate',
      },
      aiService: {
        provider: 'local-heuristic',
        mode: 'offline-deterministic',
        model: 'hacxlerate-deterministic-v1',
        isLiveKeyConfigured: false,
      },
    });

    vi.mocked(api.searchCreators).mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'c1',
          userId: { _id: 'u1', email: 'creator1@test.com' },
          displayName: 'Sarah Connor',
          niche: 'AI Film & Video',
          bio: 'Cinematic AI director with Sora and Runway experience.',
          skills: ['Video Editing', 'GenAI Prompting'],
          tools: ['Runway Gen-3'],
          isVerified: true,
          pricing: { hourlyRate: 85 },
        } as any,
      ],
      pagination: { total: 1, page: 1, limit: 4, pages: 1 },
    });

    vi.mocked(api.exploreCampaigns).mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'camp1',
          title: 'Quantum SaaS Launch Campaign',
          description: 'Looking for 3 video creators to produce high-converting reels.',
          contentType: 'Video',
          budget: { min: 2000, max: 4000 },
          applicationDeadline: '2026-12-31',
          requiredSkills: ['GenAI Prompting'],
          status: 'published',
        } as any,
      ],
      pagination: { total: 1, page: 1, limit: 3, pages: 1 },
    });

    vi.mocked(api.getFavorites).mockResolvedValue({
      success: true,
      favorites: [],
    });
  });

  it('renders HacXLerate and CreatorConnect brand in navigation and footer', async () => {
    render(<App />);
    const brandElements = screen.getAllByText(/HacXLerate/i);
    expect(brandElements.length).toBeGreaterThan(0);
    const creatorConnectElements = screen.getAllByText(/CreatorConnect/i);
    expect(creatorConnectElements.length).toBeGreaterThan(0);
  });

  it('renders the complete creator lifecycle stages', async () => {
    render(<App />);
    expect(screen.getByText('Learn')).toBeDefined();
    expect(screen.getByText('Create')).toBeDefined();
    expect(screen.getByText('Discover Opportunities')).toBeDefined();
    expect(screen.getByText('Review Content')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/healthy/i)).toBeDefined();
    });
  });

  it('renders the Hero section with headline and action buttons', async () => {
    render(<App />);
    expect(screen.getAllByText(/Creative Talent/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Powerful Brands/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Explore Creators')).toBeDefined();
    expect(screen.getAllByText('Launch a Campaign').length).toBeGreaterThan(0);
    expect(screen.getByText(/Built for creators, brands, and bold ideas/i)).toBeDefined();
  });

  it('renders marketplace search panel with category selector and trending chips', async () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Search creators, skills, niches, or brand campaigns/i)).toBeDefined();
    expect(screen.getByText('Video Creators')).toBeDefined();
    expect(screen.getByText('Designers')).toBeDefined();
    expect(screen.getByText('Influencers')).toBeDefined();
    expect(screen.getByText('AI Creators')).toBeDefined();
  });

  it('renders all 4 AI-powered platform feature cards', async () => {
    render(<App />);
    expect(screen.getByText('AI Creator Matching')).toBeDefined();
    expect(screen.getAllByText('AI Content Studio').length).toBeGreaterThan(0);
    expect(screen.getByText('AI Content Guardian')).toBeDefined();
    expect(screen.getByText('Creator Originality & Craft')).toBeDefined();
  });

  it('renders separate calls to action for creators and brands', async () => {
    render(<App />);
    expect(screen.getByText('Your Creativity Deserves the Spotlight.')).toBeDefined();
    expect(screen.getByText('Join as a Creator')).toBeDefined();
    expect(screen.getByText('Find the Talent Behind Your Next Big Campaign.')).toBeDefined();
    expect(screen.getByText('Start a Brand Campaign')).toBeDefined();
  });

  it('renders FAQ accordion and toggles answer visibility on click', async () => {
    render(<App />);
    const faqButton = screen.getByText('What is this creator marketplace?');
    expect(faqButton).toBeDefined();

    // First question is open by default
    expect(screen.getByText(/HacXLerate CreatorConnect AI is a full-lifecycle marketplace/i)).toBeDefined();

    // Click second question
    const secondFaqButton = screen.getByText('How can creators join and get discovered?');
    fireEvent.click(secondFaqButton);
    expect(screen.getByText(/Creators can register for free, build their detailed profile/i)).toBeDefined();
  });
});
