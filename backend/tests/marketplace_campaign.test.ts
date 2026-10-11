import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { User } from '../src/models/User';
import { CreatorProfile } from '../src/models/CreatorProfile';
import { BrandProfile } from '../src/models/BrandProfile';
import { Campaign } from '../src/models/Campaign';
import { Application } from '../src/models/Application';
import { Collaboration } from '../src/models/Collaboration';
import { Review } from '../src/models/Review';
import { Favorite } from '../src/models/Favorite';

describe('Phase 3: Marketplace Discovery, Campaigns, Applications, and Collaborations', () => {
  const app = createApp();

  let creator1Token = '';
  let creator1UserId = '';
  let creator1ProfileId = '';

  let creator2Token = '';
  let creator2UserId = '';

  let brandToken = '';
  let brandUserId = '';

  let campaignId = '';
  let applicationId = '';
  let collaborationId = '';
  let milestoneId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean up test data
    await User.deleteMany({ email: /@test-phase3\.com$/ });
    await Campaign.deleteMany({ title: /Test Phase3/ });
    await Collaboration.deleteMany({});
    await Application.deleteMany({});
    await Review.deleteMany({});
    await Favorite.deleteMany({});

    // 1. Setup Creator 1
    const regC1 = await request(app).post('/api/auth/register').send({
      email: 'creator1@test-phase3.com',
      password: 'Password123!',
      role: 'creator',
      displayName: 'Maya Motion Artist',
    });
    creator1Token = regC1.body.token;
    creator1UserId = regC1.body.user.id;
    creator1ProfileId = regC1.body.profile._id;

    // Update Creator 1 with rich profile
    await request(app)
      .put('/api/profiles/creator')
      .set('Authorization', `Bearer ${creator1Token}`)
      .send({
        displayName: 'Maya Motion Artist',
        tagline: 'Senior 3D Artist & Motion Designer',
        bio: 'Creating viral product visual reels and 3D tech demos.',
        skills: ['Motion Design', '3D Animation', 'After Effects'],
        niches: ['Tech Hardware', 'Gaming Gear'],
        tools: ['Blender', 'Cinema4D', 'Unreal Engine'],
        pricing: { hourlyRate: 85, projectMinimum: 400, currency: 'USD' },
        availability: 'available',
        experienceYears: 5,
        portfolio: [
          {
            title: 'VR Headset Commercial',
            url: 'https://vimeo.com/example-vr',
            mediaType: 'video',
            tags: ['VR', '3D'],
          },
        ],
      });

    // 2. Setup Creator 2
    const regC2 = await request(app).post('/api/auth/register').send({
      email: 'creator2@test-phase3.com',
      password: 'Password123!',
      role: 'creator',
      displayName: 'Leo Tech Reviewer',
    });
    creator2Token = regC2.body.token;
    creator2UserId = regC2.body.user.id;

    await request(app)
      .put('/api/profiles/creator')
      .set('Authorization', `Bearer ${creator2Token}`)
      .send({
        displayName: 'Leo Tech Reviewer',
        tagline: 'Honest consumer electronics reviews',
        skills: ['Long Form Video', 'Scriptwriting'],
        niches: ['Smartphones', 'Audio Gear'],
        tools: ['Final Cut Pro', 'DaVinci Resolve'],
        pricing: { hourlyRate: 60, projectMinimum: 250, currency: 'USD' },
        availability: 'busy',
        experienceYears: 3,
      });

    // 3. Setup Brand
    const regB = await request(app).post('/api/auth/register').send({
      email: 'brand@test-phase3.com',
      password: 'Password123!',
      role: 'brand',
      companyName: 'Quantum Audio Labs',
      industry: 'Consumer Electronics',
    });
    brandToken = regB.body.token;
    brandUserId = regB.body.user.id;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test-phase3\.com$/ });
    await CreatorProfile.deleteMany({ userId: { $in: [creator1UserId, creator2UserId] } });
    await BrandProfile.deleteMany({ userId: brandUserId });
    await Campaign.deleteMany({ title: /Test Phase3/ });
    await Collaboration.deleteMany({});
    await Application.deleteMany({});
    await Review.deleteMany({});
    await Favorite.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // --- 1. Creator Discovery & Marketplace ---
  it('1. should search and filter creators by skill, niche, and availability with pagination', async () => {
    // Filter by skill 'Motion Design'
    const resSkill = await request(app).get('/api/marketplace/creators?skill=Motion%20Design');
    expect(resSkill.status).toBe(200);
    expect(resSkill.body.success).toBe(true);
    expect(resSkill.body.data.length).toBeGreaterThanOrEqual(1);
    expect(resSkill.body.data[0].displayName).toBe('Maya Motion Artist');

    // Filter by availability 'busy'
    const resAvail = await request(app).get('/api/marketplace/creators?availability=busy');
    expect(resAvail.status).toBe(200);
    expect(resAvail.body.data.some((c: any) => c.displayName === 'Leo Tech Reviewer')).toBe(true);

    // Text search query
    const resSearch = await request(app).get('/api/marketplace/creators?q=Blender');
    expect(resSearch.status).toBe(200);
    expect(resSearch.body.data[0].tools).toContain('Blender');
  });

  it('2. should fetch creator detail with populated portfolio and reviews', async () => {
    const res = await request(app).get(`/api/marketplace/creators/${creator1ProfileId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.displayName).toBe('Maya Motion Artist');
    expect(res.body.profile.portfolio.length).toBe(1);
    expect(res.body.reviews).toBeDefined();
  });

  it('3. should toggle creator favorite for an authenticated brand', async () => {
    // Add to favorites
    const addFav = await request(app)
      .post(`/api/marketplace/favorites/${creator1UserId}`)
      .set('Authorization', `Bearer ${brandToken}`);
    expect(addFav.status).toBe(200);
    expect(addFav.body.favorited).toBe(true);

    // Get favorites
    const getFavs = await request(app)
      .get('/api/marketplace/favorites')
      .set('Authorization', `Bearer ${brandToken}`);
    expect(getFavs.status).toBe(200);
    expect(getFavs.body.favorites.length).toBe(1);

    // Remove from favorites
    const removeFav = await request(app)
      .post(`/api/marketplace/favorites/${creator1UserId}`)
      .set('Authorization', `Bearer ${brandToken}`);
    expect(removeFav.status).toBe(200);
    expect(removeFav.body.favorited).toBe(false);
  });

  // --- 2. Campaign Lifecycle ---
  it('4. should allow Brand to create a draft campaign and prevent unauthorized creator access', async () => {
    const campaignPayload = {
      title: 'Test Phase3: Wireless ANC Earbuds Launch',
      description: 'We are launching our flagship ANC earbuds. Looking for 3D visual showcase and review reel.',
      category: 'Consumer Tech',
      budget: { min: 500, max: 1500, currency: 'USD' },
      contentTypes: ['Short Video Reel', 'Product Demo'],
      brandGuidelines: 'Highlight transparency mode and battery endurance. Maintain sleek aesthetic.',
      deliverables: [
        {
          title: '3D Exploded View Reel',
          format: 'short_video',
          quantity: 1,
          guidelines: 'Focus on titanium acoustic chamber',
        },
        {
          title: 'Sound Quality Hands-on Review',
          format: 'short_video',
          quantity: 1,
          guidelines: 'Demonstrate ANC in noisy cafe',
        },
      ],
      requiredSkills: ['Motion Design', 'Product Demo'],
      status: 'draft',
    };

    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${brandToken}`)
      .send(campaignPayload);

    expect(res.status).toBe(201);
    expect(res.body.campaign.status).toBe('draft');
    campaignId = res.body.campaign._id;

    // Creator tries to view draft campaign -> HTTP 403 Forbidden
    const unauthView = await request(app)
      .get(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${creator1Token}`);
    expect(unauthView.status).toBe(403);
  });

  it('5. should allow Brand to publish campaign and allow Creators to discover it', async () => {
    // Publish campaign
    const publishRes = await request(app)
      .patch(`/api/campaigns/${campaignId}/status`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ status: 'published' });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.campaign.status).toBe('published');

    // Creator explores published campaigns
    const exploreRes = await request(app).get('/api/campaigns?q=Earbuds');
    expect(exploreRes.status).toBe(200);
    expect(exploreRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(exploreRes.body.data[0].title).toContain('Earbuds Launch');
    expect(exploreRes.body.data[0].brandProfile.companyName).toBe('Quantum Audio Labs');
  });

  // --- 3. Applications & Proposals ---
  it('6. should allow Creator to submit proposal and reject duplicate submissions with HTTP 409', async () => {
    const proposal = {
      pitch: 'I have extensive experience crafting 3D hardware reels. I can deliver a stunning titanium acoustic breakdown!',
      proposedRate: 900,
      estimatedDays: 10,
      milestonesProposal: 'Milestone 1: 3D Animation (5 days), Milestone 2: Audio review & sound testing (5 days)',
      portfolioSamples: ['https://vimeo.com/example-vr'],
    };

    // First submission
    const res1 = await request(app)
      .post(`/api/campaigns/${campaignId}/apply`)
      .set('Authorization', `Bearer ${creator1Token}`)
      .send(proposal);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.application.status).toBe('submitted');
    applicationId = res1.body.application._id;

    // Second submission by SAME creator on SAME campaign -> 409 Conflict
    const res2 = await request(app)
      .post(`/api/campaigns/${campaignId}/apply`)
      .set('Authorization', `Bearer ${creator1Token}`)
      .send(proposal);

    expect(res2.status).toBe(409);
    expect(res2.body.message).toContain('already submitted');
  });

  it('7. should prevent Brands from submitting proposals to campaigns', async () => {
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/apply`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        pitch: 'Brand trying to apply as creator.',
        proposedRate: 500,
        estimatedDays: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('requires one of [creator] roles');
  });

  it('8. should allow Brand to view applicants, shortlist, and accept proposal, automatically instantiating a Collaboration', async () => {
    // Brand views applicants
    const appListRes = await request(app)
      .get(`/api/campaigns/${campaignId}/all`)
      .set('Authorization', `Bearer ${brandToken}`);

    expect(appListRes.status).toBe(200);
    expect(appListRes.body.applications.length).toBe(1);
    expect(appListRes.body.applications[0].creatorProfile.displayName).toBe('Maya Motion Artist');

    // Brand shortlists proposal
    const shortlistRes = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ status: 'shortlisted' });
    expect(shortlistRes.status).toBe(200);
    expect(shortlistRes.body.application.status).toBe('shortlisted');

    // Brand accepts proposal
    const acceptRes = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ status: 'accepted' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.application.status).toBe('accepted');
    expect(acceptRes.body.collaboration).toBeDefined();

    collaborationId = acceptRes.body.collaboration._id;
    expect(acceptRes.body.collaboration.status).toBe('active');
    expect(acceptRes.body.collaboration.milestones.length).toBe(2);

    milestoneId = acceptRes.body.collaboration.milestones[0]._id;
  });

  // --- 4. Milestone Submissions, Revisions, and Approvals ---
  it('9. should allow assigned Creator to view collaboration workspace and submit milestone deliverable', async () => {
    // Creator views workspace
    const viewRes = await request(app)
      .get(`/api/collaborations/${collaborationId}`)
      .set('Authorization', `Bearer ${creator1Token}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.isCreator).toBe(true);

    // Third-party (Creator 2) tries to access -> 403 Forbidden
    const unauthRes = await request(app)
      .get(`/api/collaborations/${collaborationId}`)
      .set('Authorization', `Bearer ${creator2Token}`);
    expect(unauthRes.status).toBe(403);

    // Creator 1 submits deliverable for Milestone 1
    const submitRes = await request(app)
      .post(`/api/collaborations/${collaborationId}/milestones/${milestoneId}/submit`)
      .set('Authorization', `Bearer ${creator1Token}`)
      .send({
        fileUrl: 'https://cdn.example.com/renders/exploded_view_v1.mp4',
        fileName: 'exploded_view_v1.mp4',
        caption: 'Final 4K 60fps render showcasing titanium driver casing.',
        notes: 'Rendered in Cinema4D + Octane.',
      });

    expect(submitRes.status).toBe(200);
    const updatedMilestone = submitRes.body.collaboration.milestones.find(
      (m: any) => m._id === milestoneId
    );
    expect(updatedMilestone.status).toBe('submitted');
    expect(updatedMilestone.deliverable.fileUrl).toContain('exploded_view_v1.mp4');
  });

  it('10. should allow Brand to request revision and subsequently approve milestone', async () => {
    // Brand requests revision
    const revRes = await request(app)
      .post(`/api/collaborations/${collaborationId}/milestones/${milestoneId}/review`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        action: 'request_revision',
        revisionNotes: 'Please increase lighting on the charging pins at 0:04.',
      });

    expect(revRes.status).toBe(200);
    let milestone = revRes.body.collaboration.milestones.find((m: any) => m._id === milestoneId);
    expect(milestone.status).toBe('revision_requested');
    expect(milestone.revisionNotes).toContain('charging pins');

    // Creator resubmits
    await request(app)
      .post(`/api/collaborations/${collaborationId}/milestones/${milestoneId}/submit`)
      .set('Authorization', `Bearer ${creator1Token}`)
      .send({
        fileUrl: 'https://cdn.example.com/renders/exploded_view_v2.mp4',
        notes: 'Adjusted key lighting on pins.',
      });

    // Brand approves Milestone 1
    const approveRes1 = await request(app)
      .post(`/api/collaborations/${collaborationId}/milestones/${milestoneId}/review`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ action: 'approve' });

    expect(approveRes1.status).toBe(200);
    milestone = approveRes1.body.collaboration.milestones.find((m: any) => m._id === milestoneId);
    expect(milestone.status).toBe('approved');

    // Also approve Milestone 2 to trigger collaboration completion
    const milestone2Id = approveRes1.body.collaboration.milestones[1]._id;
    const approveRes2 = await request(app)
      .post(`/api/collaborations/${collaborationId}/milestones/${milestone2Id}/review`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ action: 'approve' });

    expect(approveRes2.status).toBe(200);
    expect(approveRes2.body.collaboration.status).toBe('completed');

    // Verify creator completed count incremented in MongoDB
    const creatorInDb = await CreatorProfile.findOne({ userId: creator1UserId });
    expect(creatorInDb!.completedCollaborationsCount).toBe(1);
  });

  // --- 5. Verified Client Reviews ---
  it('11. should allow Brand to submit verified review after completion and update creator rating', async () => {
    const reviewRes = await request(app)
      .post(`/api/collaborations/${collaborationId}/review`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        collaborationId,
        rating: 5,
        reviewText: 'Outstanding 3D animation work! Delivered ahead of schedule with immaculate attention to detail.',
        communicationRating: 5,
        qualityRating: 5,
        timelinessRating: 5,
      });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.review.rating).toBe(5);

    // Verify CreatorProfile rating and reviewCount updated in MongoDB
    const creatorInDb = await CreatorProfile.findOne({ userId: creator1UserId });
    expect(creatorInDb!.reviewCount).toBe(1);
    expect(creatorInDb!.rating).toBe(5.0);

    // Submitting a duplicate review on same collaboration must fail with HTTP 409
    const dupReviewRes = await request(app)
      .post(`/api/collaborations/${collaborationId}/review`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        collaborationId,
        rating: 4,
        reviewText: 'Second review attempt.',
      });

    expect(dupReviewRes.status).toBe(409);
    expect(dupReviewRes.body.message).toContain('already been submitted');
  });
});
