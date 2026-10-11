import { io, Socket } from 'socket.io-client';
import { MessageData, NotificationData } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  // Disconnect any stale or disconnected instance
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const token = localStorage.getItem('hacxlerate_token');

  // In development, the Vite proxy or direct localhost:5000 is used
  const socketUrl =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : window.location.origin;

  socket = io(socketUrl, {
    auth: {
      token: token || '',
    },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // Connected to Socket.IO gateway
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket.IO] Connection error:', error.message);
  });

  socket.on('disconnect', (_reason) => {
    // Handle disconnection
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Conversation Room Operations
export function joinConversation(conversationId: string): void {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join_conversation', { conversationId });
  }
}

export function leaveConversation(conversationId: string): void {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('leave_conversation', { conversationId });
  }
}

// Typing Indicators
export function sendTypingStart(conversationId: string): void {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('typing:start', { conversationId });
  }
}

export function sendTypingStop(conversationId: string): void {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('typing:stop', { conversationId });
  }
}

// Event Listeners with Cleanup Callbacks
export function onNewMessage(
  callback: (data: {
    message: MessageData;
    conversationId: string;
    unreadCounts?: Record<string, number>;
  }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('new_message', callback);
  return () => {
    s.off('new_message', callback);
  };
}

export function onMessageReceived(
  callback: (data: {
    message: MessageData;
    conversationId: string;
    unreadCounts?: Record<string, number>;
  }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('message_received', callback);
  return () => {
    s.off('message_received', callback);
  };
}

export function onMessagesRead(
  callback: (data: { conversationId: string; readBy: string }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('messages_read', callback);
  return () => {
    s.off('messages_read', callback);
  };
}

export function onUserTyping(
  callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('user_typing', callback);
  return () => {
    s.off('user_typing', callback);
  };
}

export function onConversationBlocked(
  callback: (data: { conversationId: string; blockedBy: string }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('conversation_blocked', callback);
  return () => {
    s.off('conversation_blocked', callback);
  };
}

export function onConversationUnblocked(
  callback: (data: { conversationId: string; unblockedBy: string }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('conversation_unblocked', callback);
  return () => {
    s.off('conversation_unblocked', callback);
  };
}

// Real-Time Notification Listeners
export function onNewNotification(
  callback: (data: { notification: NotificationData; unreadCount: number }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('new_notification', callback);
  return () => {
    s.off('new_notification', callback);
  };
}

export function onNotificationRead(
  callback: (data: { notificationId: string; unreadCount: number }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('notification_read', callback);
  return () => {
    s.off('notification_read', callback);
  };
}

export function onAllNotificationsRead(
  callback: (data: { unreadCount: number }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('all_notifications_read', callback);
  return () => {
    s.off('all_notifications_read', callback);
  };
}

export function onNotificationDeleted(
  callback: (data: { notificationId: string; unreadCount: number }) => void
): () => void {
  const s = getSocket() || connectSocket();
  s.on('notification_deleted', callback);
  return () => {
    s.off('notification_deleted', callback);
  };
}
