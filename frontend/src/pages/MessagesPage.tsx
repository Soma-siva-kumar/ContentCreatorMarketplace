import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Paperclip,
  ShieldAlert,
  Ban,
  Unlock,
  Check,
  CheckCheck,
  Search,
  ExternalLink,
  Briefcase,
  AlertTriangle,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  connectSocket,
  joinConversation,
  leaveConversation,
  sendTypingStart,
  sendTypingStop,
  onNewMessage,
  onMessageReceived,
  onMessagesRead,
  onUserTyping,
  onConversationBlocked,
  onConversationUnblocked,
} from '../services/socket';
import {
  ConversationData,
  MessageData,
  MessageAttachment,
  ReportReason,
  CreatorProfileData,
  BrandProfileData,
} from '../types';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversationId');

  // State
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Composer
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Real-time typing
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safety: Block & Report Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = user?.id || '';

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1. Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await api.getConversations();
      if (res.success) {
        setConversations(res.conversations);

        // Auto-select initial conversation from query param, or first conversation
        if (initialConvId) {
          const match = res.conversations.find((c) => c._id === initialConvId);
          if (match) {
            setSelectedConversation(match);
          } else {
            // Load by id directly
            api.getConversationById(initialConvId).then((r) => {
              if (r.success) {
                setSelectedConversation(r.conversation);
                setConversations((prev) => [r.conversation, ...prev]);
              }
            });
          }
        } else if (res.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(res.conversations[0]);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoadingConversations(false);
    }
  }, [initialConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Select conversation & fetch messages
  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.getMessages(convId, { limit: 100 });
      if (res.success) {
        setMessages(res.messages);
        setTimeout(scrollToBottom, 50);
      }

      // Mark conversation as read in backend
      await api.markConversationAsRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      // Ignore
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
      joinConversation(selectedConversation._id);

      // Update URL query parameter
      setSearchParams({ conversationId: selectedConversation._id }, { replace: true });
    }

    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation._id);
      }
    };
  }, [selectedConversation?._id, loadMessages, setSearchParams]);

  // 3. Socket.IO Listeners
  useEffect(() => {
    connectSocket();

    const unsubNewMessage = onNewMessage((data) => {
      // If message is for currently active conversation
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(scrollToBottom, 50);

        // Clear unread count on server
        api.markConversationAsRead(selectedConversation._id);
      }

      // Update sidebar conversation list
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv._id === data.conversationId) {
            const isCurrent = selectedConversation && selectedConversation._id === conv._id;
            const newUnread = isCurrent ? 0 : (conv.unreadCount || 0) + 1;
            return {
              ...conv,
              lastMessage: {
                content: data.message.content,
                senderId: data.message.senderId,
                createdAt: data.message.createdAt,
              },
              unreadCount: newUnread,
              updatedAt: new Date().toISOString(),
            };
          }
          return conv;
        })
      );
    });

    const unsubMsgReceived = onMessageReceived((data) => {
      // Notification of message received
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv._id === data.conversationId) {
            const isCurrent = selectedConversation && selectedConversation._id === conv._id;
            return {
              ...conv,
              lastMessage: {
                content: data.message.content,
                senderId: data.message.senderId,
                createdAt: data.message.createdAt,
              },
              unreadCount: isCurrent ? 0 : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        })
      );
    });

    const unsubMessagesRead = onMessagesRead((data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    });

    const unsubTyping = onUserTyping((data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        if (data.userId !== currentUserId) {
          setIsCounterpartTyping(data.isTyping);
        }
      }
    });

    const unsubBlocked = onConversationBlocked((data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setSelectedConversation((prev) => (prev ? { ...prev, isBlocked: true } : null));
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === data.conversationId ? { ...c, isBlocked: true } : c))
      );
    });

    const unsubUnblocked = onConversationUnblocked((data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setSelectedConversation((prev) => (prev ? { ...prev, isBlocked: false } : null));
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === data.conversationId ? { ...c, isBlocked: false } : c))
      );
    });

    return () => {
      unsubNewMessage();
      unsubMsgReceived();
      unsubMessagesRead();
      unsubTyping();
      unsubBlocked();
      unsubUnblocked();
    };
  }, [selectedConversation, currentUserId]);

  // 4. Handle Typing Indicator Debounce
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessageText(e.target.value);

    if (selectedConversation) {
      sendTypingStart(selectedConversation._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (selectedConversation) {
          sendTypingStop(selectedConversation._id);
        }
      }, 1500);
    }
  };

  // 5. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation) return;
    if (!newMessageText.trim() && attachments.length === 0) return;
    if (selectedConversation.isBlocked) return;

    const content = newMessageText.trim() || 'Shared an attachment';
    const currentAttachments = [...attachments];

    setSending(true);
    try {
      const res = await api.sendMessage(selectedConversation._id, {
        content,
        attachments: currentAttachments,
      });

      if (res.success) {
        setMessages((prev) => [...prev, res.message]);
        setNewMessageText('');
        setAttachments([]);
        sendTypingStop(selectedConversation._id);
        setTimeout(scrollToBottom, 50);

        // Update lastMessage locally in list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConversation._id
              ? {
                  ...c,
                  lastMessage: {
                    content: res.message.content,
                    senderId: res.message.senderId,
                    createdAt: res.message.createdAt,
                  },
                }
              : c
          )
        );
      }
    } catch (err: any) {
      setActionNotice(err.message || 'Failed to send message.');
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setSending(false);
    }
  };

  // 6. Block / Unblock Conversation
  const handleToggleBlock = async () => {
    if (!selectedConversation) return;

    try {
      if (selectedConversation.isBlocked) {
        const res = await api.unblockConversation(selectedConversation._id);
        if (res.success) {
          setSelectedConversation((prev) => (prev ? { ...prev, isBlocked: false } : null));
          setActionNotice('Conversation unblocked.');
        }
      } else {
        const res = await api.blockConversation(selectedConversation._id);
        if (res.success) {
          setSelectedConversation((prev) => (prev ? { ...prev, isBlocked: true } : null));
          setActionNotice('Conversation blocked. No messages can be sent.');
        }
      }
    } catch (err: any) {
      setActionNotice(err.message || 'Action failed.');
    } finally {
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // 7. Report Conversation
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !selectedConversation.otherParticipant) return;

    setSubmittingReport(true);
    try {
      const res = await api.reportConversation(selectedConversation._id, {
        reportedUserId: selectedConversation.otherParticipant._id,
        reason: reportReason,
        details: reportDetails.trim(),
      });

      if (res.success) {
        setShowReportModal(false);
        setReportDetails('');
        setActionNotice('Report submitted successfully to platform trust and safety.');
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err: any) {
      setActionNotice(err.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // 8. Add Attachment Modal
  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    const isImage = /\.(jpeg|jpg|png|webp|gif)$/i.test(attachmentUrl);
    setAttachments((prev) => [
      ...prev,
      {
        fileUrl: attachmentUrl.trim(),
        fileName: attachmentName.trim() || (isImage ? 'image_asset' : 'file_attachment'),
        mimeType: isImage ? 'image/jpeg' : 'application/octet-stream',
      },
    ]);
    setAttachmentUrl('');
    setAttachmentName('');
    setShowAttachmentModal(false);
  };

  // Helpers
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getCounterpartName = (conv: ConversationData) => {
    if (conv.otherProfile) {
      if ('displayName' in conv.otherProfile) {
        return (conv.otherProfile as CreatorProfileData).displayName;
      }
      if ('companyName' in conv.otherProfile) {
        return (conv.otherProfile as BrandProfileData).companyName;
      }
    }
    return conv.otherParticipant?.email?.split('@')[0] || 'Member';
  };

  const filteredConversations = conversations.filter((c) => {
    const name = getCounterpartName(c).toLowerCase();
    const lastMsg = c.lastMessage?.content?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || lastMsg.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Action Toast Alert */}
      {actionNotice && (
        <div className="mb-4 p-3 bg-slate-900 border border-brand-500/50 rounded-2xl text-xs text-brand-300 flex items-center justify-between shadow-xl">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Panel Layout */}
      <div className="flex-1 min-h-0 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 backdrop-blur-md shadow-2xl">
        {/* LEFT PANEL: Conversations Sidebar (col-span-4) */}
        <div className="md:col-span-4 border-r border-slate-800/80 flex flex-col h-full bg-slate-950/40">
          {/* Sidebar Header & Search */}
          <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-400" />
                Messages
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {conversations.length} Active
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">No conversations yet</p>
                <p className="text-[11px] text-slate-600">
                  Direct message creators from their profiles or via campaign proposals.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const counterpartName = getCounterpartName(conv);
                const isSelected = selectedConversation?._id === conv._id;
                const unread = conv.unreadCount || 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/70 border-l-2 border-brand-500'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600/30 to-indigo-600/30 border border-slate-800 flex items-center justify-center font-bold text-xs text-brand-300 shrink-0">
                      {counterpartName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            isSelected ? 'font-bold text-white' : 'font-medium text-slate-200'
                          }`}
                        >
                          {counterpartName}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Active Chat Thread (col-span-8) */}
        <div className="md:col-span-8 flex flex-col h-full bg-slate-950/20">
          {selectedConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                    {getCounterpartName(selectedConversation).charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">
                        {getCounterpartName(selectedConversation)}
                      </h3>
                      {selectedConversation.otherParticipant && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {selectedConversation.otherParticipant.role}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      {isCounterpartTyping ? (
                        <span className="text-brand-400 italic animate-pulse">Typing...</span>
                      ) : (
                        <span>{selectedConversation.otherParticipant?.email}</span>
                      )}

                      {/* Link to Collaboration if present */}
                      {selectedConversation.collaborationId && (
                        <Link
                          to={
                            typeof selectedConversation.collaborationId === 'object'
                              ? `/collaborations/${(selectedConversation.collaborationId as any)._id}`
                              : `/collaborations/${selectedConversation.collaborationId}`
                          }
                          className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                        >
                          <Briefcase className="w-3 h-3" /> Workspace
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Safety & Action Controls */}
                <div className="flex items-center gap-2">
                  {/* Block / Unblock Toggle */}
                  <button
                    onClick={handleToggleBlock}
                    title={selectedConversation.isBlocked ? 'Unblock user' : 'Block user'}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                      selectedConversation.isBlocked
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40'
                    }`}
                  >
                    {selectedConversation.isBlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Unblock</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Block</span>
                      </>
                    )}
                  </button>

                  {/* Report Button */}
                  <button
                    onClick={() => setShowReportModal(true)}
                    title="Report user or conversation"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Blocked Warning Banner */}
              {selectedConversation.isBlocked && (
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center justify-between text-rose-300 text-xs">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    This conversation is currently blocked. No messages can be sent or received.
                  </span>
                </div>
              )}

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Loading conversation messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <MessageSquare className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">Start the conversation</p>
                    <p className="text-[11px] text-slate-500">
                      Discuss creative concepts, deliverables, and project timelines securely.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderIdStr =
                      typeof msg.senderId === 'object' && msg.senderId !== null
                        ? (msg.senderId as any)._id
                        : msg.senderId;
                    const isMine = senderIdStr === currentUserId;

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                            isMine
                              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-xs'
                              : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-bl-xs'
                          }`}
                        >
                          {/* Message Content */}
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                            {msg.content}
                          </p>

                          {/* Attachments preview */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-1.5 pt-2 border-t border-white/10">
                              {msg.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-xl text-xs transition ${
                                    isMine
                                      ? 'bg-white/10 hover:bg-white/20 text-white'
                                      : 'bg-slate-900/60 hover:bg-slate-900 text-sky-400'
                                  }`}
                                >
                                  {att.mimeType?.startsWith('image/') ? (
                                    <ImageIcon className="w-4 h-4 shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 shrink-0" />
                                  )}
                                  <span className="truncate flex-1 font-medium">
                                    {att.fileName}
                                  </span>
                                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Metadata: timestamp & read receipt */}
                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-500">
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
                {/* Pending attachments pill preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs text-slate-300"
                      >
                        <Paperclip className="w-3 h-3 text-brand-400" />
                        <span className="truncate max-w-[150px]">{att.fileName}</span>
                        <button
                          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* Attachment button */}
                  <button
                    type="button"
                    onClick={() => setShowAttachmentModal(true)}
                    disabled={selectedConversation.isBlocked}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                    title="Attach asset or preview link"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Input */}
                  <input
                    type="text"
                    placeholder={
                      selectedConversation.isBlocked
                        ? 'Conversation is blocked'
                        : 'Write a message... (Press Enter to send)'
                    }
                    value={newMessageText}
                    onChange={handleTextChange}
                    disabled={selectedConversation.isBlocked || sending}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={
                      selectedConversation.isBlocked ||
                      sending ||
                      (!newMessageText.trim() && attachments.length === 0)
                    }
                    className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 shadow-lg shadow-brand-600/20 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-white">Select a conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose a conversation from the left panel to review message history, discuss deliverables, or start a new chat.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add Attachment Modal */}
      {showAttachmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-brand-400" />
                Add Media or Deliverable Link
              </h3>
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide a direct URL to an asset preview, Cloudinary file, Google Drive proof, or hosted media asset.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">File or Media URL *</label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/... or https://..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Display Label</label>
                <input
                  type="text"
                  placeholder="e.g. Draft Cut v1.mp4 or Brand Assets.pdf"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAttachmentModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAttachment}
                disabled={!attachmentUrl.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Attach
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Report Conversation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReport}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Report Conversation
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Submit an evidence report for platform moderation. Reports are strictly reviewed by the Kampus.VC Trust & Safety team.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Reason *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option value="harassment">Harassment or abusive conduct</option>
                  <option value="spam">Spam or unsolicited advertising</option>
                  <option value="fraud">Fraud, scam, or payment circumvention</option>
                  <option value="copyright_infringement">Copyright or IP infringement</option>
                  <option value="inappropriate_content">Inappropriate or illicit material</option>
                  <option value="other">Other policy violation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Details & Evidence *</label>
                <textarea
                  rows={4}
                  placeholder="Explain what occurred, citations of messages, or violation specifics..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReport || !reportDetails.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
