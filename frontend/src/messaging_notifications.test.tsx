import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationCenter } from './components/NotificationCenter';
import { MessagesPage } from './pages/MessagesPage';
import { AuthProvider } from './context/AuthContext';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  api: {
    checkHealth: vi.fn(),
    ping: vi.fn(),
    getNotifications: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    getConversations: vi.fn(),
    getConversationById: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markConversationAsRead: vi.fn(),
    blockConversation: vi.fn(),
    unblockConversation: vi.fn(),
    reportConversation: vi.fn(),
  },
}));

vi.mock('./services/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ connected: true })),
  joinConversation: vi.fn(),
  leaveConversation: vi.fn(),
  sendTypingStart: vi.fn(),
  sendTypingStop: vi.fn(),
  onNewMessage: vi.fn(() => () => {}),
  onMessageReceived: vi.fn(() => () => {}),
  onMessagesRead: vi.fn(() => () => {}),
  onUserTyping: vi.fn(() => () => {}),
  onConversationBlocked: vi.fn(() => () => {}),
  onConversationUnblocked: vi.fn(() => () => {}),
  onNewNotification: vi.fn(() => () => {}),
  onNotificationRead: vi.fn(() => () => {}),
  onAllNotificationsRead: vi.fn(() => () => {}),
  onNotificationDeleted: vi.fn(() => () => {}),
}));

describe('Phase 4: Real-time Messaging and Notifications UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotificationCenter Component', () => {
    it('renders notification bell and shows unread notifications badge', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue({
        success: true,
        notifications: [
          {
            _id: 'n1',
            recipientId: 'u1',
            type: 'milestone_submitted',
            title: 'Milestone Submitted',
            message: 'Elena submitted deliverable for Hero Reel.',
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: 'n2',
            recipientId: 'u1',
            type: 'new_message',
            title: 'New Message',
            message: 'You received a message from Nexus Brands.',
            isRead: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      render(
        <BrowserRouter>
          <NotificationCenter />
        </BrowserRouter>
      );

      // Bell trigger button
      const bellButton = screen.getByRole('button', { name: /Notification Center/i });
      expect(bellButton).toBeDefined();

      // Unread badge
      await waitFor(() => {
        expect(screen.getByText('1')).toBeDefined();
      });

      // Click to open popover
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeDefined();
        expect(screen.getByText('Milestone Submitted')).toBeDefined();
        expect(screen.getByText('Elena submitted deliverable for Hero Reel.')).toBeDefined();
        expect(screen.getByText('Mark all read')).toBeDefined();
      });
    });

    it('handles mark all as read action in popover', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue({
        success: true,
        notifications: [
          {
            _id: 'n1',
            recipientId: 'u1',
            type: 'application_received',
            title: 'New Proposal',
            message: 'A creator applied to your campaign.',
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      vi.mocked(api.markAllNotificationsAsRead).mockResolvedValue({
        success: true,
        message: 'All notifications marked as read',
        modifiedCount: 1,
      });

      render(
        <BrowserRouter>
          <NotificationCenter />
        </BrowserRouter>
      );

      const bellButton = screen.getByRole('button', { name: /Notification Center/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeDefined();
      });

      fireEvent.click(screen.getByText('Mark all read'));

      await waitFor(() => {
        expect(api.markAllNotificationsAsRead).toHaveBeenCalled();
      });
    });
  });

  describe('MessagesPage Component', () => {
    it('renders conversations list and active chat window', async () => {
      const mockConv = {
        _id: 'conv1',
        participants: [
          { _id: 'u1', email: 'creator@test.com', role: 'creator' as const },
          { _id: 'u2', email: 'brand@test.com', role: 'brand' as const },
        ],
        lastMessage: {
          content: 'Here is the draft review storyboard',
          senderId: 'u2',
          createdAt: new Date().toISOString(),
        },
        unreadCount: 2,
        isBlocked: false,
        otherParticipant: {
          _id: 'u2',
          email: 'brand@test.com',
          role: 'brand' as const,
        },
        otherProfile: {
          userId: 'u2',
          companyName: 'Studio Quantum',
          industry: 'Tech',
          isVerified: true,
          campaignInterests: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(api.getConversations).mockResolvedValue({
        success: true,
        conversations: [mockConv],
      });

      vi.mocked(api.getMessages).mockResolvedValue({
        success: true,
        messages: [
          {
            _id: 'm1',
            conversationId: 'conv1',
            senderId: 'u2',
            receiverId: 'u1',
            content: 'Hello! Excited to collaborate with you.',
            attachments: [],
            isRead: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
      });

      vi.mocked(api.markConversationAsRead).mockResolvedValue({
        success: true,
        message: 'Conversation marked as read',
        conversationId: 'conv1',
      });

      render(
        <AuthProvider>
          <BrowserRouter>
            <MessagesPage />
          </BrowserRouter>
        </AuthProvider>
      );

      // Search & Header
      expect(screen.getByPlaceholderText(/Search conversations.../i)).toBeDefined();

      // Conversation item in sidebar & header
      await waitFor(() => {
        expect(screen.getAllByText('Studio Quantum').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Hello! Excited to collaborate with you.')).toBeDefined();
      });

      // Active chat window displays counterpart
      expect(screen.getByText('brand@test.com')).toBeDefined();
      expect(screen.getByPlaceholderText(/Write a message.../i)).toBeDefined();
    });

    it('sends a message through the composer and calls api.sendMessage', async () => {
      const mockConv = {
        _id: 'conv1',
        participants: [
          { _id: 'u1', email: 'creator@test.com', role: 'creator' as const },
          { _id: 'u2', email: 'brand@test.com', role: 'brand' as const },
        ],
        unreadCount: 0,
        isBlocked: false,
        otherParticipant: {
          _id: 'u2',
          email: 'brand@test.com',
          role: 'brand' as const,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(api.getConversations).mockResolvedValue({
        success: true,
        conversations: [mockConv],
      });

      vi.mocked(api.getMessages).mockResolvedValue({
        success: true,
        messages: [],
        pagination: { total: 0, page: 1, limit: 100, totalPages: 1 },
      });

      vi.mocked(api.sendMessage).mockResolvedValue({
        success: true,
        message: {
          _id: 'm_new',
          conversationId: 'conv1',
          senderId: 'u1',
          receiverId: 'u2',
          content: 'Just uploaded the high-res 4K cut!',
          attachments: [],
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        conversation: mockConv,
      });

      render(
        <AuthProvider>
          <BrowserRouter>
            <MessagesPage />
          </BrowserRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a message.../i)).toBeDefined();
      });

      const input = screen.getByPlaceholderText(/Write a message.../i);
      fireEvent.change(input, { target: { value: 'Just uploaded the high-res 4K cut!' } });

      const form = input.closest('form');
      expect(form).not.toBeNull();
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(api.sendMessage).toHaveBeenCalledWith('conv1', {
          content: 'Just uploaded the high-res 4K cut!',
          attachments: [],
        });
      });
    });
  });
});
