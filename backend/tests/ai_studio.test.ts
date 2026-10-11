import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { ContentDraft } from '../src/models/ContentDraft';

const app = createApp();

describe('Phase 5: AI Content Studio & Drafts API', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let createdDraftId: string;

  beforeAll(async () => {
    await connectDB();

    // Clean up test domain users and drafts
    const testUsers = await User.find({ email: /@test-phase5\.com$/ });
    const userIds = testUsers.map((u) => u._id);
    await ContentDraft.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ email: /@test-phase5\.com$/ });

    // Register User A (Creator)
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'creatorA@test-phase5.com',
        password: 'Password123!',
        role: 'creator',
        displayName: 'Creator Alpha',
      });
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B (Brand)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'brandB@test-phase5.com',
        password: 'Password123!',
        role: 'brand',
        companyName: 'Brand Beta',
        industry: 'Digital Media',
      });
    userBToken = resB.body.token;
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    const testUsers = await User.find({ email: /@test-phase5\.com$/ });
    const userIds = testUsers.map((u) => u._id);
    await ContentDraft.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ email: /@test-phase5\.com$/ });
  });

  it('1. should return AI provider status and user usage quotas', async () => {
    const res = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBeDefined();
    expect(res.body.status.provider).toBeDefined();
    expect(res.body.status.mode).toBeDefined();
    expect(res.body.usage).toBeDefined();
    expect(res.body.usage.minuteRemaining).toBeGreaterThan(0);
  });

  it('2. should reject unauthenticated AI generation with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({
        contentType: 'idea',
        prompt: 'AI video editing workflows',
      });

    expect(res.status).toBe(401);
  });

  it('3. should generate structured Content Ideas with hooks, hashtags, and disclosure', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        contentType: 'idea',
        prompt: 'Generative AI tools for high-retention TikTok videos',
        platform: 'tiktok',
        tone: 'authentic',
        targetAudience: 'Gen Z short-form video editors',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { result } = res.body;
    expect(result.contentType).toBe('idea');
    expect(result.title).toContain('Generative AI tools');
    expect(result.content).toBeDefined();
    expect(result.metadata.hooks.length).toBeGreaterThanOrEqual(2);
    expect(result.metadata.suggestedHashtags.length).toBeGreaterThan(0);
    expect(result.disclosureGuidance).toBeDefined();
  });

  it('4. should generate production-ready Video Scripts with timed scene breakdowns', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        contentType: 'script',
        prompt: 'Spatial Audio Headphone Unboxing & Review',
        platform: 'youtube',
        tone: 'cinematic',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { result } = res.body;
    expect(result.contentType).toBe('script');
    expect(result.metadata.scenes.length).toBeGreaterThanOrEqual(4);
    expect(result.metadata.scenes[0].timing).toBeDefined();
    expect(result.metadata.scenes[0].visual).toBeDefined();
    expect(result.metadata.scenes[0].speech).toBeDefined();
  });

  it('5. should generate structured 7-Day Content Calendar schedule', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        contentType: 'calendar',
        prompt: 'Fintech Mobile App Launch Campaign',
        platform: 'general',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { result } = res.body;
    expect(result.metadata.calendarEvents.length).toBe(7);
    expect(result.metadata.calendarEvents[0].day).toBe('Monday');
    expect(result.metadata.calendarEvents[0].hook).toBeDefined();
  });

  it('6. should generate Image Prompt blueprint with positive, negative, and aspect ratios', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        contentType: 'image_prompt',
        prompt: 'Futuristic AI Content Studio in Tokyo',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { result } = res.body;
    expect(result.metadata.imagePromptData).toBeDefined();
    expect(result.metadata.imagePromptData.prompt).toContain('Futuristic AI Content Studio in Tokyo');
    expect(result.metadata.imagePromptData.negativePrompt).toBeDefined();
    expect(result.metadata.imagePromptData.aspectRatio).toBe('16:9');
  });

  it('7. should transform content (shorten, expand, tone adaptation)', async () => {
    const originalText =
      'In this detailed tutorial, we are going to explore the comprehensive steps to build an audience. First, understand your niche. Second, post consistently. Third, engage directly with your commenters to build retention.';

    // Shorten
    const shortenRes = await request(app)
      .post('/api/ai/transform')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        content: originalText,
        action: 'shorten',
      });

    expect(shortenRes.status).toBe(200);
    expect(shortenRes.body.success).toBe(true);
    expect(shortenRes.body.transformed.content.length).toBeLessThan(originalText.length);

    // Expand
    const expandRes = await request(app)
      .post('/api/ai/transform')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        content: originalText,
        action: 'expand',
      });

    expect(expandRes.status).toBe(200);
    expect(expandRes.body.success).toBe(true);
    expect(expandRes.body.transformed.content.length).toBeGreaterThan(originalText.length);
  });

  it('8. should save a new Content Draft with initial revision history in MongoDB', async () => {
    const res = await request(app)
      .post('/api/ai/drafts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'GenAI Film Breakdown',
        contentType: 'script',
        platform: 'youtube',
        tone: 'cinematic',
        inputPrompt: 'Cinematic AI storytelling techniques',
        currentContent: 'SCENE 1: High energy hook. The camera pans across the virtual set.',
        tags: ['filmmaking', 'genai'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.draft._id).toBeDefined();
    expect(res.body.draft.revisions.length).toBe(1);
    expect(res.body.draft.revisions[0].action).toBe('initial');

    createdDraftId = res.body.draft._id;
  });

  it('9. should append revisions when updating an existing draft', async () => {
    const res = await request(app)
      .post('/api/ai/drafts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        draftId: createdDraftId,
        currentContent: 'SCENE 1: Refined script draft with revised dialogue and tighter pacing.',
        revisionAction: 'edit',
        revisionNote: 'Tightened opening hook',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.draft.revisions.length).toBe(2);
    expect(res.body.draft.currentContent).toContain('Refined script draft');
  });

  it('10. should list drafts and retrieve draft with full revision history', async () => {
    const listRes = await request(app)
      .get('/api/ai/drafts')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.drafts.length).toBeGreaterThanOrEqual(1);

    const getRes = await request(app)
      .get(`/api/ai/drafts/${createdDraftId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.draft.revisions.length).toBe(2);
  });

  it('11. should enforce cross-user privacy: User B cannot view or delete User A drafts', async () => {
    const getRes = await request(app)
      .get(`/api/ai/drafts/${createdDraftId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(getRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/ai/drafts/${createdDraftId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(deleteRes.status).toBe(404);
  });

  it('12. should toggle favorite status and allow owner to delete draft', async () => {
    const favRes = await request(app)
      .post(`/api/ai/drafts/${createdDraftId}/favorite`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(favRes.status).toBe(200);
    expect(favRes.body.isFavorite).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/ai/drafts/${createdDraftId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain('Draft removed successfully');
  });
});
