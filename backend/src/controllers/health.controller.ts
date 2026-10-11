import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { aiAdapter } from '../services/aiAdapter';
import { env } from '../config/env';

export class HealthController {
  public static async getHealth(req: Request, res: Response): Promise<void> {
    const readyStates: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbState = mongoose.connection.readyState;
    const dbStatus = readyStates[dbState] || 'unknown';
    const isHealthy = dbState === 1;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      project: 'HacXLerate — Kampus.VC',
      subtitle: 'AI-powered content creator marketplace connecting creators and brands',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        engine: 'MongoDB',
        host: mongoose.connection.host || 'localhost',
        database: mongoose.connection.name || 'hacxlerate',
      },
      aiService: aiAdapter.getStatus(),
    });
  }

  public static async ping(req: Request, res: Response): Promise<void> {
    res.json({ pong: true, timestamp: Date.now() });
  }
}
