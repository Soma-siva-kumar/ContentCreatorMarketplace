import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  api: {
    checkHealth: vi.fn(),
    ping: vi.fn(),
  },
}));

describe('App Component', () => {
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
  });

  it('renders HacXLerate brand in navigation and footer', async () => {
    render(<App />);
    const brandElements = screen.getAllByText(/HacXLerate/i);
    expect(brandElements.length).toBeGreaterThan(0);
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
});
