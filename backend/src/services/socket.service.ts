import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { Conversation } from '../models/Conversation';
import { NotificationService } from './notification.service';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: IUser;
  };
}

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO instance has not been initialized yet.');
  }
  return ioInstance;
}

export function initSocketIO(server: http.Server): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  ioInstance = io;
  NotificationService.setGlobalIO(io);

  // Authentication Middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined = undefined;

      // 1. Check handshake auth token
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      // 2. Check Authorization header
      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      // 3. Check Cookie header
      if (!token && socket.handshake.headers.cookie) {
        const cookieStr = socket.handshake.headers.cookie;
        const match = cookieStr.match(/hacxlerate_token=([^;]+)/);
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }

      if (!token) {
        return next(new Error('Authentication required for real-time socket gateway.'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error('User account is invalid or deactivated.'));
      }

      socket.data.user = user;
      next();
    } catch (err: any) {
      console.warn(`[Socket.IO] Authentication failed: ${err.message}`);
      next(new Error('Invalid or expired socket authentication session.'));
    }
  });

  // Connection Handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user!;
    const userId = user._id.toString();

    // Automatically join the user's private notification and direct message room
    socket.join(`user:${userId}`);
    console.log(`[Socket.IO] User connected: ${user.email} (${userId}) on socket ${socket.id}`);

    // Join Conversation Room with strict participant verification
    socket.on('join_conversation', async (data: { conversationId: string }, callback?: (res: any) => void) => {
      try {
        const { conversationId } = data;
        if (!conversationId) {
          if (callback) callback({ success: false, error: 'conversationId required' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, error: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );

        if (!isParticipant) {
          if (callback) callback({ success: false, error: 'Access denied: not a conversation participant' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        if (callback) callback({ success: true, conversationId });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Leave Conversation Room
    socket.on('leave_conversation', (data: { conversationId: string }) => {
      if (data && data.conversationId) {
        socket.leave(`conversation:${data.conversationId}`);
      }
    });

    // Real-Time Typing Indicators
    socket.on('typing:start', (data: { conversationId: string }) => {
      if (data && data.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
          conversationId: data.conversationId,
          userId,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      if (data && data.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
          conversationId: data.conversationId,
          userId,
          isTyping: false,
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] User disconnected: ${user.email} (${reason})`);
    });
  });

  return io;
}
