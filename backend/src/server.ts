import http from 'http';
import { initSocketIO } from './services/socket.service';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create Express App
    const app = createApp();

    // 3. Create HTTP & Socket.IO Server
    const server = http.createServer(app);
    const io = initSocketIO(server);

    // Expose io on app instance
    app.set('io', io);

    // 4. Start Listening
    server.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 HacXLerate — Kampus.VC Backend Active`);
      console.log(`📡 URL: http://localhost:${env.PORT}`);
      console.log(`🩺 Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🤖 AI Adapter: ${env.GEMINI_API_KEY ? 'Gemini (Live)' : 'Local Heuristic'}`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
