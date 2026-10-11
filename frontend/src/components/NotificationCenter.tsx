import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Briefcase,
  Zap,
  Shield,
  Star,
  FileText,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import {
  connectSocket,
  onNewNotification,
  onNotificationRead,
  onAllNotificationsRead,
  onNotificationDeleted,
} from '../services/socket';
import { NotificationData, NotificationType } from '../types';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastNotification, setToastNotification] = useState<NotificationData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load initial notifications & count
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications({ limit: 20 });
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Ignore network errors on background poll
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Connect socket for real-time notifications
    connectSocket();

    const unsubNew = onNewNotification((data) => {
      setNotifications((prev) => [data.notification, ...prev]);
      setUnreadCount(data.unreadCount);

      // Show temporary popup toast
      setToastNotification(data.notification);
      setTimeout(() => {
        setToastNotification((curr) => (curr?._id === data.notification._id ? null : curr));
      }, 5000);
    });

    const unsubRead = onNotificationRead((data) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === data.notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(data.unreadCount);
    });

    const unsubAllRead = onAllNotificationsRead((data) => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(data.unreadCount);
    });

    const unsubDeleted = onNotificationDeleted((data) => {
      setNotifications((prev) => prev.filter((n) => n._id !== data.notificationId));
      setUnreadCount(data.unreadCount);
    });

    return () => {
      unsubNew();
      unsubRead();
      unsubAllRead();
      unsubDeleted();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const handleNotificationClick = async (notif: NotificationData) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }

    setIsOpen(false);

    // Route dynamically based on payload context
    if (notif.data?.conversationId) {
      navigate(`/messages?conversationId=${notif.data.conversationId}`);
    } else if (notif.data?.collaborationId) {
      navigate(`/collaborations/${notif.data.collaborationId}`);
    } else if (notif.data?.campaignId) {
      navigate(`/campaigns/${notif.data.campaignId}`);
    }
  };

  const formatRelativeTime = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'application_received':
      case 'application_status_updated':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'collaboration_started':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'milestone_submitted':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'milestone_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'revision_requested':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'craft_score_updated':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'guardian_review_complete':
        return <Shield className="w-4 h-4 text-violet-400" />;
      case 'review_received':
        return <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
      case 'deadline_reminder':
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        aria-label="Notification Center"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Toast Alert when notification arrives in real-time */}
      {toastNotification && !isOpen && (
        <div
          onClick={() => handleNotificationClick(toastNotification)}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-brand-500/50 shadow-2xl shadow-brand-500/20 rounded-2xl p-4 flex items-start gap-3 cursor-pointer hover:border-brand-400 transition animate-bounce"
        >
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
            {getNotificationIcon(toastNotification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{toastNotification.title}</h4>
            <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{toastNotification.message}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Click to view details</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToastNotification(null);
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/50">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500">
                  You have no pending notifications or activity alerts.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 transition flex items-start gap-3 cursor-pointer group ${
                    notif.isRead
                      ? 'bg-slate-900/40 hover:bg-slate-800/50'
                      : 'bg-brand-950/20 hover:bg-brand-950/30 border-l-2 border-brand-500'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4
                        className={`text-xs truncate ${
                          notif.isRead ? 'font-medium text-slate-300' : 'font-bold text-white'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="p-1 hover:text-brand-400 text-slate-400 rounded transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(notif._id, e)}
                      title="Delete notification"
                      className="p-1 hover:text-rose-400 text-slate-400 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
