import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { env } from '../src/config/env';

describe('Health and System Routes', () => {
  const app = createApp();

  beforeAll(async () => {
    // Connect to local MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
    }
  });

  afterAll(async () => {
    // Close mongoose connection after test suite
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('GET /api/health/ping should return HTTP 200 and pong: true', async () => {
    const res = await request(app).get('/api/health/ping');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pong', true);
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/health should return system status, MongoDB engine and AI adapter details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.project).toBe('HacXLerate — Kampus.VC');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.engine).toBe('MongoDB');
    expect(res.body.database.status).toBe('connected');
    expect(res.body.aiService).toBeDefined();
    expect(res.body.aiService.provider).toMatch(/gemini|local-heuristic/);
  });

  it('GET /api/nonexistent-route should return HTTP 404 with structured AppError JSON', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.message).toContain('Endpoint not found');
  });
});
