import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { CreatorProfile } from '../models/CreatorProfile';
import { BrandProfile } from '../models/BrandProfile';
import { AppError } from '../middleware/errorHandler';
import { mailerService } from '../services/mailer';

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function setAuthCookie(res: Response, token: string): void {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('hacxlerate_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    const { email, password, role, displayName, companyName, industry } = req.body;

    // 1. Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // 2. Hash password with bcryptjs
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 4. Create User
    const user = await User.create({
      email,
      passwordHash,
      role,
      isVerified: false,
      isActive: true,
      verificationToken,
      verificationTokenExpires,
    });

    // 5. Create associated profile based on role
    let profile: unknown = null;
    if (role === 'creator') {
      profile = await CreatorProfile.create({
        userId: user._id,
        displayName: displayName || email.split('@')[0],
        skills: [],
        niches: [],
        tools: [],
        availability: 'available',
        craftScore: 70,
        portfolio: [],
      });
    } else if (role === 'brand') {
      profile = await BrandProfile.create({
        userId: user._id,
        companyName: companyName || 'Company',
        industry: industry || 'Technology',
        campaignInterests: [],
        isVerified: false,
      });
    }

    // 6. Send verification email via configured mailer service
    await mailerService.sendVerificationEmail(user.email, verificationToken);

    // 7. Generate session token & set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification email sent.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      profile,
      token,
    });
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    // 1. Find user including passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 2. Verify account is active
    if (!user.isActive) {
      throw new AppError('This account is deactivated. Please contact support.', 403);
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 4. Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // 5. Fetch associated profile
    let profile: unknown = null;
    if (user.role === 'creator') {
      profile = await CreatorProfile.findOne({ userId: user._id });
    } else if (user.role === 'brand') {
      profile = await BrandProfile.findOne({ userId: user._id });
    }

    // 6. Generate token & set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      profile,
      token,
    });
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('hacxlerate_token', {
      httpOnly: true,
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    let profile: unknown = null;
    if (req.user.role === 'creator') {
      profile = await CreatorProfile.findOne({ userId: req.user._id });
    } else if (req.user.role === 'brand') {
      profile = await BrandProfile.findOne({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified,
        isActive: req.user.isActive,
        lastLoginAt: req.user.lastLoginAt,
        createdAt: req.user.createdAt,
      },
      profile,
    });
  }

  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    const token = (req.query.token as string) || req.body.token;
    if (!token) {
      throw new AppError('Verification token is required.', 400);
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      throw new AppError('Invalid or expired verification token.', 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You now have full verified access.',
    });
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user && user.isActive) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      await mailerService.sendPasswordResetEmail(user.email, resetToken);
    }

    // Always return success to protect against email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account matches this email, a password recovery link has been sent.',
    });
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      throw new AppError('Invalid or expired password reset token.', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new credentials.',
    });
  }

  public static async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  }

  public static async deactivateAccount(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    user.isActive = false;
    await user.save();

    res.clearCookie('hacxlerate_token', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Account has been deactivated.',
    });
  }

  public static async deleteAccount(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const userId = req.user._id;

    // Clean up profiles
    await CreatorProfile.deleteOne({ userId });
    await BrandProfile.deleteOne({ userId });
    await User.findByIdAndDelete(userId);

    res.clearCookie('hacxlerate_token', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Account and associated profiles deleted permanently.',
    });
  }
}
