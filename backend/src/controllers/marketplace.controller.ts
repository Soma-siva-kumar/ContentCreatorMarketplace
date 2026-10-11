import { Request, Response } from 'express';
import { CreatorProfile } from '../models/CreatorProfile';
import { Review } from '../models/Review';
import { Favorite } from '../models/Favorite';
import { AppError } from '../middleware/errorHandler';

export class MarketplaceController {
  public static async searchCreators(req: Request, res: Response): Promise<void> {
    const {
      q,
      niche,
      skill,
      tool,
      availability,
      minRate,
      maxRate,
      minCraftScore,
      sortBy,
      page,
      limit,
    } = req.query as Record<string, any>;

    const queryFilter: Record<string, any> = {};

    // Text search query
    if (q && typeof q === 'string' && q.trim()) {
      queryFilter.$or = [
        { displayName: { $regex: q.trim(), $options: 'i' } },
        { tagline: { $regex: q.trim(), $options: 'i' } },
        { bio: { $regex: q.trim(), $options: 'i' } },
        { skills: { $in: [new RegExp(q.trim(), 'i')] } },
        { niches: { $in: [new RegExp(q.trim(), 'i')] } },
        { tools: { $in: [new RegExp(q.trim(), 'i')] } },
      ];
    }

    // Specific filters
    if (niche && typeof niche === 'string' && niche.trim()) {
      queryFilter.niches = { $in: [new RegExp(niche.trim(), 'i')] };
    }

    if (skill && typeof skill === 'string' && skill.trim()) {
      queryFilter.skills = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    if (tool && typeof tool === 'string' && tool.trim()) {
      queryFilter.tools = { $in: [new RegExp(tool.trim(), 'i')] };
    }

    if (availability) {
      queryFilter.availability = availability;
    }

    if (minRate !== undefined || maxRate !== undefined) {
      queryFilter['pricing.hourlyRate'] = {};
      if (minRate !== undefined) queryFilter['pricing.hourlyRate'].$gte = Number(minRate);
      if (maxRate !== undefined) queryFilter['pricing.hourlyRate'].$lte = Number(maxRate);
    }

    if (minCraftScore !== undefined) {
      queryFilter.craftScore = { $gte: Number(minCraftScore) };
    }

    // Sorting definition
    let sortOptions: Record<string, any> = { craftScore: -1 };
    if (sortBy === 'rating') {
      sortOptions = { rating: -1, reviewCount: -1 };
    } else if (sortBy === 'rate_asc') {
      sortOptions = { 'pricing.hourlyRate': 1 };
    } else if (sortBy === 'rate_desc') {
      sortOptions = { 'pricing.hourlyRate': -1 };
    } else if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, creators] = await Promise.all([
      CreatorProfile.countDocuments(queryFilter),
      CreatorProfile.find(queryFilter)
        .populate('userId', 'email isVerified createdAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: creators,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  }

  public static async getCreatorDetail(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    let profile = await CreatorProfile.findById(id).populate('userId', 'email isVerified createdAt');
    if (!profile) {
      // Allow searching by userId as well
      profile = await CreatorProfile.findOne({ userId: id }).populate('userId', 'email isVerified createdAt');
    }

    if (!profile) {
      throw new AppError('Creator profile not found.', 404);
    }

    // Fetch verified reviews for this creator
    const reviews = await Review.find({ creatorId: profile.userId })
      .populate('brandId', 'email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      profile,
      reviews,
    });
  }

  public static async toggleFavorite(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { creatorId } = req.params;

    const existing = await Favorite.findOne({
      userId: req.user._id,
      creatorId,
    });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      res.status(200).json({
        success: true,
        favorited: false,
        message: 'Removed from favorites.',
      });
      return;
    }

    await Favorite.create({
      userId: req.user._id,
      creatorId,
    });

    res.status(200).json({
      success: true,
      favorited: true,
      message: 'Added to favorites.',
    });
  }

  public static async getMyFavorites(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const favorites = await Favorite.find({ userId: req.user._id });
    const creatorUserIds = favorites.map((f) => f.creatorId);

    const profiles = await CreatorProfile.find({ userId: { $in: creatorUserIds } }).populate(
      'userId',
      'email isVerified'
    );

    res.status(200).json({
      success: true,
      favorites: profiles,
    });
  }
}
