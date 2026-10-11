import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { CreatorProfile } from '../src/models/CreatorProfile';
import { BrandProfile } from '../src/models/BrandProfile';
import { Conversation } from '../src/models/Conversation';
import { Message } from '../src/models/Message';
import { Notification } from '../src/models/Notification';
import { Report } from '../src/models/Report';

describe('Phase 4: Real-Time Messaging and Notification Workflows', () => {
  const app = createApp();

  let creatorUser: any;
  let creatorToken: string;
  let brandUser: any;
  let brandToken: string;
  let thirdPartyUser: any;
  let thirdPartyToken: string;

  let conversationId: string;
  let testNotificationId: string;

  beforeAll(async () => {
    await connectDB();

    // Clean up collections first
    await Promise.all([
      User.deleteMany({ email: /.*phase4.*/ }),
      CreatorProfile.deleteMany({ displayName: /.*Lucas.*|.*Snoop.*/ }),
      BrandProfile.deleteMany({ companyName: /.*Lumina.*/ }),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
    ]);

    // 1. Register Creator
    const creatorRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'creator@test-phase4.com',
        password: 'Password123!',
        role: 'creator',
        displayName: 'Lucas Luminary',
      });
    creatorToken = creatorRes.body.token;
    creatorUser = creatorRes.body.user;

    // 2. Register Brand
    const brandRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'brand@test-phase4.com',
        password: 'Password123!',
        role: 'brand',
        companyName: 'Lumina Dynamics',
      });
    brandToken = brandRes.body.token;
    brandUser = brandRes.body.user;

    // 3. Register Third-Party (Unauthorized) User
    const thirdPartyRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'thirdparty@test-phase4.com',
        password: 'Password123!',
        role: 'creator',
        displayName: 'Snoop User',
      });
    thirdPartyToken = thirdPartyRes.body.token;
    thirdPartyUser = thirdPartyRes.body.user;
  });

  afterAll(async () => {
    // Cleanup collections
    await Promise.all([
      User.deleteMany({ email: /.*phase4.*/ }),
      CreatorProfile.deleteMany({ displayName: /.*Lucas.*|.*Snoop.*/ }),
      BrandProfile.deleteMany({ companyName: /.*Lumina.*/ }),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
    ]);
  });

  it('1. should create a persistent authorized conversation between Creator and Brand', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        targetUserId: creatorUser.id,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversation).toBeDefined();
    expect(res.body.conversation.participants.length).toBe(2);

    conversationId = res.body.conversation._id;

    // Verify in MongoDB
    const convInDb = await Conversation.findById(conversationId);
    expect(convInDb).not.toBeNull();
    expect(convInDb!.participants.map((p) => p.toString())).toContain(creatorUser.id);
    expect(convInDb!.participants.map((p) => p.toString())).toContain(brandUser.id);
  });

  it('2. should reject attempts to start a conversation with oneself', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        targetUserId: brandUser.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('yourself');
  });

  it('3. should allow Brand to send persistent message, updating conversation and recipient unread count', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        content: 'Hi Lucas, we loved your generative portfolio and want to discuss a campaign.',
        attachments: [
          {
            fileUrl: 'https://example.com/brief-v1.pdf',
            fileName: 'brief-v1.pdf',
            fileSize: 1048576,
            mimeType: 'application/pdf',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message.content).toContain('loved your generative portfolio');
    expect(res.body.message.attachments.length).toBe(1);

    // Verify message persistence in MongoDB
    const msgInDb = await Message.findById(res.body.message._id);
    expect(msgInDb).not.toBeNull();
    expect(msgInDb!.isRead).toBe(false);

    // Verify conversation lastMessage and unreadCounts updated in MongoDB
    const conv = await Conversation.findById(conversationId);
    expect(conv!.lastMessage?.content).toContain('loved your generative portfolio');
    expect(conv!.unreadCounts.get(creatorUser.id)).toBe(1);
  });

  it('4. should prevent unauthorized third-party user from reading messages in another user\'s conversation', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${thirdPartyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('access');
  });

  it('5. should allow recipient Creator to retrieve conversation messages', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.messages.length).toBe(1);
    expect(res.body.messages[0].content).toContain('loved your generative portfolio');
  });

  it('6. should allow recipient Creator to mark conversation messages as read', async () => {
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify messages marked read in MongoDB
    const unreadMessages = await Message.countDocuments({
      conversationId,
      receiverId: creatorUser.id,
      isRead: false,
    });
    expect(unreadMessages).toBe(0);

    // Verify conversation unread count reset
    const conv = await Conversation.findById(conversationId);
    expect(conv!.unreadCounts.get(creatorUser.id)).toBe(0);
  });

  it('7. should enforce conversation blocking controls and prevent sending messages when blocked', async () => {
    // Creator blocks the conversation
    const blockRes = await request(app)
      .post(`/api/conversations/${conversationId}/block`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(blockRes.status).toBe(200);
    expect(blockRes.body.conversation.isBlocked).toBe(true);

    // Brand attempts to send a message while blocked
    const sendRes = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        content: 'Are you available to talk?',
      });

    expect(sendRes.status).toBe(403);
    expect(sendRes.body.message).toContain('blocked');

    // Only the blocker can unblock
    const unauthorizedUnblock = await request(app)
      .post(`/api/conversations/${conversationId}/unblock`)
      .set('Authorization', `Bearer ${brandToken}`);

    expect(unauthorizedUnblock.status).toBe(403);

    // Creator unblocks
    const unblockRes = await request(app)
      .post(`/api/conversations/${conversationId}/unblock`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(unblockRes.status).toBe(200);
    expect(unblockRes.body.conversation.isBlocked).toBe(false);
  });

  it('8. should allow reporting a conversation and record Report in MongoDB', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/report`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        reason: 'spam',
        details: 'Unsolicited promotional requests not matching campaign rules.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.report).toBeDefined();

    const reportInDb = await Report.findById(res.body.report._id);
    expect(reportInDb).not.toBeNull();
    expect(reportInDb!.reason).toBe('spam');
    expect(reportInDb!.status).toBe('pending');
  });

  it('9. should retrieve Notification list for recipient and calculate real unread counts', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notifications.length).toBeGreaterThan(0);
    expect(res.body.unreadCount).toBeGreaterThan(0);

    testNotificationId = res.body.notifications[0]._id;
  });

  it('10. should prevent another user from marking a different user\'s notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${testNotificationId}/read`)
      .set('Authorization', `Bearer ${thirdPartyToken}`);

    expect(res.status).toBe(404);
  });

  it('11. should allow recipient to mark single notification as read and mark all as read', async () => {
    // 1. Mark single
    const singleRes = await request(app)
      .patch(`/api/notifications/${testNotificationId}/read`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(singleRes.status).toBe(200);
    expect(singleRes.body.notification.isRead).toBe(true);

    // 2. Mark all as read
    const allRes = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(allRes.status).toBe(200);

    // Verify unread count is now 0
    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(listRes.body.unreadCount).toBe(0);
  });
});
