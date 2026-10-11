import { Request, Response } from 'express';
import { Campaign } from '../models/Campaign';
import { BrandProfile } from '../models/BrandProfile';
import { AppError } from '../middleware/errorHandler';

export class CampaignController {
  public static async createCampaign(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'brand') {
      throw new AppError('Only registered brands can create campaigns.', 403);
    }

    const campaignData = {
      ...req.body,
      brandId: req.user._id,
      applicationsCount: 0,
      acceptedApplicationsCount: 0,
    };

    const campaign = await Campaign.create(campaignData);

    res.status(201).json({
      success: true,
      message: campaign.status === 'published' ? 'Campaign published successfully!' : 'Campaign saved as draft.',
      campaign,
    });
  }

  public static async getBrandCampaigns(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'brand') {
      throw new AppError('Only brands can access their own campaigns.', 403);
    }

    const campaigns = await Campaign.find({ brandId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      campaigns,
    });
  }

  public static async exploreCampaigns(req: Request, res: Response): Promise<void> {
    const { q, category, minBudget, maxBudget, skill, page, limit } = req.query as Record<string, any>;

    const queryFilter: Record<string, any> = {
      status: 'published',
    };

    if (q && typeof q === 'string' && q.trim()) {
      queryFilter.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { category: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    if (category && typeof category === 'string' && category.trim()) {
      queryFilter.category = new RegExp(category.trim(), 'i');
    }

    if (skill && typeof skill === 'string' && skill.trim()) {
      queryFilter.requiredSkills = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    if (minBudget !== undefined || maxBudget !== undefined) {
      if (minBudget !== undefined) queryFilter['budget.max'] = { $gte: Number(minBudget) };
      if (maxBudget !== undefined) queryFilter['budget.min'] = { $lte: Number(maxBudget) };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, campaigns] = await Promise.all([
      Campaign.countDocuments(queryFilter),
      Campaign.find(queryFilter)
        .populate('brandId', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Attach brand profile names
    const brandUserIds = campaigns.map((c) => c.brandId);
    const brandProfiles = await BrandProfile.find({ userId: { $in: brandUserIds } });
    const brandProfileMap = new Map(brandProfiles.map((b) => [b.userId.toString(), b]));

    const enrichedCampaigns = campaigns.map((c) => {
      const cObj = c.toObject();
      const bProfile = brandProfileMap.get(c.brandId._id.toString());
      return {
        ...cObj,
        brandProfile: bProfile
          ? {
              companyName: bProfile.companyName,
              logoUrl: bProfile.logoUrl,
              industry: bProfile.industry,
              isVerified: bProfile.isVerified,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedCampaigns,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  }

  public static async getCampaignById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const campaign = await Campaign.findById(id).populate('brandId', 'email');
    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    // If draft, only owner brand can view
    if (campaign.status === 'draft') {
      if (!req.user || campaign.brandId._id.toString() !== req.user._id.toString()) {
        throw new AppError('Access to draft campaigns is restricted to the owning brand.', 403);
      }
    }

    const brandProfile = await BrandProfile.findOne({ userId: campaign.brandId._id });

    res.status(200).json({
      success: true,
      campaign,
      brandProfile,
    });
  }

  public static async updateCampaign(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    if (campaign.brandId.toString() !== req.user._id.toString()) {
      throw new AppError('You do not have permission to modify this campaign.', 403);
    }

    Object.assign(campaign, req.body);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully.',
      campaign,
    });
  }

  public static async updateCampaignStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    if (campaign.brandId.toString() !== req.user._id.toString()) {
      throw new AppError('You do not have permission to change status for this campaign.', 403);
    }

    campaign.status = status;
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Campaign status updated to ${status}.`,
      campaign,
    });
  }

  public static async deleteCampaign(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    if (campaign.brandId.toString() !== req.user._id.toString()) {
      throw new AppError('You do not have permission to delete this campaign.', 403);
    }

    await Campaign.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully.',
    });
  }
}
