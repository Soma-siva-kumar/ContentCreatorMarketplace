import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { HealthResponse } from '../types';

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const data = await api.checkHealth();
      const end = performance.now();
      setHealth(data);
      setLatencyMs(Math.round(end - start));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend server';
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { health, loading, error, latencyMs, refresh };
}
