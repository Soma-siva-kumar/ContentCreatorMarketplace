import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { User } from '../src/models/User';
import { CreatorProfile } from '../src/models/CreatorProfile';
import { BrandProfile } from '../src/models/BrandProfile';
import { mailerService } from '../src/services/mailer';

describe('Phase 2: Authentication and Profile Workflows', () => {
  const app = createApp();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
    }
  });

  afterAll(async () => {
    // Clean up test database records
    await User.deleteMany({ email: /@test-hacxlerate\.com$/ });
    await CreatorProfile.deleteMany({});
    await BrandProfile.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    // Clean up specific test accounts before each run
    await User.deleteMany({ email: /@test-hacxlerate\.com$/ });
  });

  it('1. should register a new Creator, hash password, create CreatorProfile in MongoDB, and send verification email', async () => {
    const creatorPayload = {
      email: 'creator1@test-hacxlerate.com',
      password: 'StrongPassword123!',
      role: 'creator',
      displayName: 'Creator One',
    };

    const res = await request(app).post('/api/auth/register').send(creatorPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(creatorPayload.email);
    expect(res.body.user.role).toBe('creator');
    expect(res.body.user.isVerified).toBe(false);
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.displayName).toBe('Creator One');

    // Verify cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('hacxlerate_token');

    // Verify User persisted in MongoDB with hashed password
    const userInDb = await User.findOne({ email: creatorPayload.email });
    expect(userInDb).not.toBeNull();
    expect(userInDb!.passwordHash).not.toBe(creatorPayload.password);
    expect(userInDb!.passwordHash.startsWith('$2')).toBe(true);

    // Verify CreatorProfile persisted in MongoDB
    const profileInDb = await CreatorProfile.findOne({ userId: userInDb!._id });
    expect(profileInDb).not.toBeNull();
    expect(profileInDb!.displayName).toBe('Creator One');

    // Verify verification email was actually sent via mailer provider
    const sentEmail = mailerService.getLastSentEmail(creatorPayload.email);
    expect(sentEmail).toBeDefined();
    expect(sentEmail!.subject).toContain('Verify');
    expect(sentEmail!.token).toBeDefined();
  });

  it('2. should reject duplicate registration with same email with HTTP 409 Conflict', async () => {
    const userPayload = {
      email: 'duplicate@test-hacxlerate.com',
      password: 'StrongPassword123!',
      role: 'creator',
      displayName: 'First User',
    };

    // First registration
    const res1 = await request(app).post('/api/auth/register').send(userPayload);
    expect(res1.status).toBe(201);

    // Second registration with same email
    const res2 = await request(app).post('/api/auth/register').send(userPayload);
    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toContain('already exists');
  });

  it('3. should reject login with invalid credentials with HTTP 401', async () => {
    const userPayload = {
      email: 'login-test@test-hacxlerate.com',
      password: 'CorrectPassword123!',
      role: 'creator',
      displayName: 'Login User',
    };

    await request(app).post('/api/auth/register').send(userPayload);

    // Attempt with incorrect password
    const res = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('4. should login successfully with valid credentials, update lastLoginAt, and set cookie', async () => {
    const userPayload = {
      email: 'valid-login@test-hacxlerate.com',
      password: 'ValidPassword123!',
      role: 'creator',
      displayName: 'Valid User',
    };

    await request(app).post('/api/auth/register').send(userPayload);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: userPayload.password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.user.email).toBe(userPayload.email);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.headers['set-cookie']).toBeDefined();

    // Verify lastLoginAt updated in MongoDB
    const userInDb = await User.findOne({ email: userPayload.email });
    expect(userInDb!.lastLoginAt).toBeDefined();
  });

  it('5. should complete the real email verification flow using the token dispatched by mailer', async () => {
    const userPayload = {
      email: 'verify-test@test-hacxlerate.com',
      password: 'Password123!',
      role: 'creator',
      displayName: 'Verify User',
    };

    await request(app).post('/api/auth/register').send(userPayload);

    // Retrieve the actual token dispatched to mailer
    const sentEmail = mailerService.getLastSentEmail(userPayload.email);
    expect(sentEmail).toBeDefined();
    const token = sentEmail!.token!;
    expect(token).toBeDefined();

    // Call verify-email endpoint
    const verifyRes = await request(app).get(`/api/auth/verify-email?token=${token}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.message).toContain('verified');

    // Confirm isVerified is true in MongoDB
    const userInDb = await User.findOne({ email: userPayload.email });
    expect(userInDb!.isVerified).toBe(true);
  });

  it('6. should execute single-use expiring password reset flow', async () => {
    const userPayload = {
      email: 'reset-flow@test-hacxlerate.com',
      password: 'OriginalPassword123!',
      role: 'creator',
      displayName: 'Reset User',
    };

    await request(app).post('/api/auth/register').send(userPayload);

    // Request password reset
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({
      email: userPayload.email,
    });
    expect(forgotRes.status).toBe(200);

    // Extract reset token from mailer service
    const resetEmail = mailerService.getLastSentEmail(userPayload.email);
    expect(resetEmail).toBeDefined();
    const resetToken = resetEmail!.token!;
    expect(resetToken).toBeDefined();

    // Execute reset password
    const newPassword = 'BrandNewPassword999!';
    const resetRes = await request(app).post('/api/auth/reset-password').send({
      token: resetToken,
      newPassword,
    });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify login with old password fails
    const oldLogin = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: userPayload.password,
    });
    expect(oldLogin.status).toBe(401);

    // Verify login with new password succeeds
    const newLogin = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: newPassword,
    });
    expect(newLogin.status).toBe(200);
  });

  it('7. should enforce unauthorized API access protection (HTTP 401 without token)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('8. should enforce role restrictions (HTTP 403 when creator tries brand-only endpoint)', async () => {
    // Register as creator
    const creatorPayload = {
      email: 'creator-role@test-hacxlerate.com',
      password: 'Password123!',
      role: 'creator',
      displayName: 'Creator Role Test',
    };
    const regRes = await request(app).post('/api/auth/register').send(creatorPayload);
    const token = regRes.body.token;

    // Creator tries to update brand profile -> must return 403 Forbidden
    const res = await request(app)
      .put('/api/profiles/brand')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'Unauthorized Brand',
        industry: 'Technology',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access forbidden');
  });

  it('9. should register Brand, login, and allow updating BrandProfile', async () => {
    const brandPayload = {
      email: 'brand1@test-hacxlerate.com',
      password: 'BrandPassword123!',
      role: 'brand',
      companyName: 'Apex Media Corp',
      industry: 'Technology',
    };

    const regRes = await request(app).post('/api/auth/register').send(brandPayload);
    expect(regRes.status).toBe(201);
    const token = regRes.body.token;

    // Brand updates their profile
    const updateRes = await request(app)
      .put('/api/profiles/brand')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'Apex Media Corp Global',
        tagline: 'Leading creator partnerships',
        description: 'We partner with creators across AI, tech, and entertainment.',
        industry: 'Digital Media',
        websiteUrl: 'https://apexmedia.example.com',
        campaignInterests: ['AI Tools', 'Reels', 'Product Reviews'],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.profile.companyName).toBe('Apex Media Corp Global');
    expect(updateRes.body.profile.campaignInterests).toContain('AI Tools');

    // Confirm persisted in MongoDB
    const brandInDb = await BrandProfile.findOne({ companyName: 'Apex Media Corp Global' });
    expect(brandInDb).not.toBeNull();
    expect(brandInDb!.websiteUrl).toBe('https://apexmedia.example.com');
  });

  it('10. should allow Creator to update profile with portfolio items, pricing, availability, and skills', async () => {
    const creatorPayload = {
      email: 'creator-portfolio@test-hacxlerate.com',
      password: 'Password123!',
      role: 'creator',
      displayName: 'Sam Designer',
    };

    const regRes = await request(app).post('/api/auth/register').send(creatorPayload);
    const token = regRes.body.token;

    const updateRes = await request(app)
      .put('/api/profiles/creator')
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'Sam Visuals',
        tagline: 'Award-winning motion designer',
        bio: 'Specializing in cinematic 3D commercials.',
        skills: ['Motion Design', 'Cinema4D', 'After Effects'],
        niches: ['3D Art', 'Tech Hardware'],
        tools: ['Octane', 'Redshift', 'Figma'],
        pricing: { hourlyRate: 90, projectMinimum: 500, currency: 'USD' },
        availability: 'busy',
        experienceYears: 6,
        portfolio: [
          {
            title: 'SaaS Brand Launch 3D Reel',
            url: 'https://vimeo.com/example-reel',
            mediaType: 'video',
            tags: ['3D', 'Cinema4D'],
          },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.profile.displayName).toBe('Sam Visuals');
    expect(updateRes.body.profile.skills).toContain('Motion Design');
    expect(updateRes.body.profile.portfolio.length).toBe(1);

    // Verify in MongoDB
    const profileInDb = await CreatorProfile.findOne({ displayName: 'Sam Visuals' });
    expect(profileInDb).not.toBeNull();
    expect(profileInDb!.portfolio[0].title).toBe('SaaS Brand Launch 3D Reel');
    expect(profileInDb!.experienceYears).toBe(6);
  });

  it('11. should change password successfully when authenticated', async () => {
    const userPayload = {
      email: 'change-pw@test-hacxlerate.com',
      password: 'OldPassword123!',
      role: 'creator',
      displayName: 'Change Password User',
    };

    const regRes = await request(app).post('/api/auth/register').send(userPayload);
    const token = regRes.body.token;

    // Change password
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'BrandNewSecurePassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: 'BrandNewSecurePassword123!',
    });
    expect(loginRes.status).toBe(200);
  });

  it('12. should deactivate account and prevent subsequent logins', async () => {
    const userPayload = {
      email: 'deactivate-test@test-hacxlerate.com',
      password: 'Password123!',
      role: 'creator',
      displayName: 'Deactivate User',
    };

    const regRes = await request(app).post('/api/auth/register').send(userPayload);
    const token = regRes.body.token;

    // Deactivate
    const deactRes = await request(app)
      .post('/api/auth/deactivate')
      .set('Authorization', `Bearer ${token}`);
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.message).toContain('deactivated');

    // Attempt login -> should return 403 Forbidden
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: userPayload.password,
    });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.message).toContain('deactivated');
  });

  it('13. should permanently delete account and remove associated profiles from MongoDB', async () => {
    const userPayload = {
      email: 'delete-me@test-hacxlerate.com',
      password: 'Password123!',
      role: 'creator',
      displayName: 'To Be Deleted',
    };

    const regRes = await request(app).post('/api/auth/register').send(userPayload);
    const token = regRes.body.token;

    // Delete account
    const delRes = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toContain('deleted permanently');

    // Verify User and Profile are completely gone from MongoDB
    const userInDb = await User.findOne({ email: userPayload.email });
    expect(userInDb).toBeNull();
    const profileInDb = await CreatorProfile.findOne({ displayName: 'To Be Deleted' });
    expect(profileInDb).toBeNull();
  });

  it('14. should logout and clear cookie header', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    // Cookie is cleared or set to expired/empty
    expect(cookies[0]).toMatch(/hacxlerate_token=;/);
  });
});
