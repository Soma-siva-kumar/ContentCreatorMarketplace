import { Request, Response } from 'express';
import { CreatorProfile } from '../models/CreatorProfile';
import { BrandProfile } from '../models/BrandProfile';
import { AppError } from '../middleware/errorHandler';

export class ProfileController {
  public static async getMyProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    let profile: unknown = null;
    if (req.user.role === 'creator') {
      profile = await CreatorProfile.findOne({ userId: req.user._id });
    } else if (req.user.role === 'brand') {
      profile = await BrandProfile.findOne({ userId: req.user._id });
    }

    if (!profile) {
      throw new AppError('Profile record not found for this user.', 404);
    }

    res.status(200).json({
      success: true,
      role: req.user.role,
      profile,
    });
  }

  public static async updateCreatorProfile(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'creator') {
      throw new AppError('Only creators can update a creator profile.', 403);
    }

    const {
      displayName,
      tagline,
      bio,
      avatarUrl,
      skills,
      niches,
      tools,
      pricing,
      availability,
      experienceYears,
      socialLinks,
      portfolio,
    } = req.body;

    const profile = await CreatorProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          ...(displayName !== undefined && { displayName }),
          ...(tagline !== undefined && { tagline }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(skills !== undefined && { skills }),
          ...(niches !== undefined && { niches }),
          ...(tools !== undefined && { tools }),
          ...(pricing !== undefined && { pricing }),
          ...(availability !== undefined && { availability }),
          ...(experienceYears !== undefined && { experienceYears }),
          ...(socialLinks !== undefined && { socialLinks }),
          ...(portfolio !== undefined && { portfolio }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      throw new AppError('Creator profile not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Creator profile updated successfully.',
      profile,
    });
  }

  public static async updateBrandProfile(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'brand') {
      throw new AppError('Only brands can update a brand profile.', 403);
    }

    const {
      companyName,
      logoUrl,
      tagline,
      description,
      industry,
      websiteUrl,
      companySize,
      campaignInterests,
    } = req.body;

    const profile = await BrandProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          ...(companyName !== undefined && { companyName }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(tagline !== undefined && { tagline }),
          ...(description !== undefined && { description }),
          ...(industry !== undefined && { industry }),
          ...(websiteUrl !== undefined && { websiteUrl }),
          ...(companySize !== undefined && { companySize }),
          ...(campaignInterests !== undefined && { campaignInterests }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      throw new AppError('Brand profile not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Brand profile updated successfully.',
      profile,
    });
  }

  public static async getPublicCreatorProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const profile = await CreatorProfile.findById(id).populate('userId', 'email isVerified createdAt');
    if (!profile) {
      // Try finding by userId
      const profileByUser = await CreatorProfile.findOne({ userId: id }).populate(
        'userId',
        'email isVerified createdAt'
      );
      if (!profileByUser) {
        throw new AppError('Creator profile not found.', 404);
      }
      res.status(200).json({ success: true, profile: profileByUser });
      return;
    }

    res.status(200).json({
      success: true,
      profile,
    });
  }

  public static async getPublicBrandProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const profile = await BrandProfile.findById(id).populate('userId', 'email isVerified createdAt');
    if (!profile) {
      const profileByUser = await BrandProfile.findOne({ userId: id }).populate(
        'userId',
        'email isVerified createdAt'
      );
      if (!profileByUser) {
        throw new AppError('Brand profile not found.', 404);
      }
      res.status(200).json({ success: true, profile: profileByUser });
      return;
    }

    res.status(200).json({
      success: true,
      profile,
    });
  }
}
