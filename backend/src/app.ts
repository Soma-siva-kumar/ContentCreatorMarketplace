import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import campaignRoutes from './routes/campaign.routes';
import applicationRoutes from './routes/application.routes';
import collaborationRoutes from './routes/collaboration.routes';
import { conversationRoutes } from './routes/conversation.routes';
import { notificationRoutes } from './routes/notification.routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Let frontend handle CSP if needed
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Parsers & Logging
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Static Uploads
  const uploadPath = path.resolve(__dirname, '../../uploads');
  app.use('/uploads', express.static(uploadPath));

  // Mount API Routers
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/collaborations', collaborationRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/notifications', notificationRoutes);

  // 404 & Central Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
