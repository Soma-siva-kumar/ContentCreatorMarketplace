import { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Campaign } from '../models/Campaign';
import { Collaboration } from '../models/Collaboration';
import { CreatorProfile } from '../models/CreatorProfile';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';

export class ApplicationController {
  public static async applyToCampaign(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'creator') {
      throw new AppError('Only creators can submit campaign proposals.', 403);
    }

    const { campaignId } = req.params;
    const { pitch, proposedRate, estimatedDays, milestonesProposal, portfolioSamples } = req.body;

    // 1. Verify campaign exists and is accepting applications
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    if (campaign.status !== 'published') {
      throw new AppError(`Cannot apply: campaign is currently ${campaign.status}.`, 400);
    }

    if (campaign.applicationDeadline && new Date(campaign.applicationDeadline) < new Date()) {
      throw new AppError('The application deadline for this campaign has expired.', 400);
    }

    // 2. Enforce duplicate application prevention
    const existingApplication = await Application.findOne({
      campaignId: campaign._id,
      creatorId: req.user._id,
    });

    if (existingApplication) {
      throw new AppError('You have already submitted a proposal for this campaign.', 409);
    }

    // 3. Create application
    const application = await Application.create({
      campaignId: campaign._id,
      creatorId: req.user._id,
      pitch,
      proposedRate,
      estimatedDays,
      milestonesProposal: milestonesProposal || '',
      portfolioSamples: portfolioSamples || [],
      status: 'submitted',
    });

    // 4. Update campaign counter
    campaign.applicationsCount = (campaign.applicationsCount || 0) + 1;
    await campaign.save();

    // 5. Notify the Brand of proposal submission
    await NotificationService.createAndEmit({
      recipientId: campaign.brandId,
      senderId: req.user._id,
      type: 'application_received',
      title: 'New Campaign Proposal',
      message: `A creator submitted a proposal for "${campaign.title}".`,
      data: { campaignId: campaign._id.toString(), applicationId: application._id.toString() },
      io: req.app.get('io'),
      sendEmail: true,
      actionUrl: `/campaigns/${campaign._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully!',
      application,
    });
  }

  public static async getMyApplications(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'creator') {
      throw new AppError('Only creators can access submitted applications.', 403);
    }

    const applications = await Application.find({ creatorId: req.user._id })
      .populate('campaignId', 'title category status budget deliverables applicationDeadline')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications,
    });
  }

  public static async getCampaignApplications(req: Request, res: Response): Promise<void> {
    const { campaignId } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    // Only owning brand can view applicant proposals
    if (campaign.brandId.toString() !== req.user._id.toString()) {
      throw new AppError('You do not have permission to view applicants for this campaign.', 403);
    }

    const applications = await Application.find({ campaignId })
      .populate('creatorId', 'email isVerified createdAt')
      .sort({ createdAt: -1 });

    // Attach creator profiles
    const creatorUserIds = applications.map((a) => a.creatorId._id);
    const creatorProfiles = await CreatorProfile.find({ userId: { $in: creatorUserIds } });
    const profileMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]));

    const enrichedApplications = applications.map((a) => {
      const aObj = a.toObject();
      const profile = profileMap.get(a.creatorId._id.toString());
      return {
        ...aObj,
        creatorProfile: profile || null,
      };
    });

    res.status(200).json({
      success: true,
      applications: enrichedApplications,
    });
  }

  public static async updateApplicationStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!req.user || req.user.role !== 'brand') {
      throw new AppError('Only brands can review and update application statuses.', 403);
    }

    const application = await Application.findById(id).populate('campaignId');
    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    const campaign = application.campaignId as any;
    if (campaign.brandId.toString() !== req.user._id.toString()) {
      throw new AppError('You do not own this campaign.', 403);
    }

    // Check invalid transition
    if (application.status === 'accepted' && status !== 'accepted') {
      throw new AppError('Cannot alter status of an already accepted application.', 400);
    }

    application.status = status;
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    let collaboration: any = null;

    // When accepted, automatically instantiate the collaboration workspace
    if (status === 'accepted') {
      // 1. Build milestones from campaign deliverables or default to 1 deliverable
      const milestones = (campaign.deliverables && campaign.deliverables.length > 0)
        ? campaign.deliverables.map((del: any, idx: number) => ({
            title: del.title || `Milestone ${idx + 1}`,
            description: del.guidelines || `${del.format} deliverable`,
            amount: Math.round(application.proposedRate / campaign.deliverables.length),
            dueDate: del.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'pending',
          }))
        : [
            {
              title: 'Full Campaign Deliverables',
              description: 'Complete deliverables as specified in brief',
              amount: application.proposedRate,
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
          ];

      collaboration = await Collaboration.create({
        campaignId: campaign._id,
        brandId: req.user._id,
        creatorId: application.creatorId,
        status: 'active',
        totalAmount: application.proposedRate,
        currency: campaign.budget?.currency || 'USD',
        milestones,
      });

      // Update campaign counters
      campaign.acceptedApplicationsCount = (campaign.acceptedApplicationsCount || 0) + 1;
      if (campaign.status === 'published') {
        campaign.status = 'in_progress';
      }
      await campaign.save();
    }

    // Notify the Creator of status change (accepted, shortlisted, or rejected)
    const notifType = status === 'accepted' ? 'collaboration_started' : 'application_status_updated';
    const notifTitle = status === 'accepted' ? 'Proposal Accepted!' : `Proposal ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const notifMsg = status === 'accepted'
      ? `Congratulations! Your proposal for "${campaign.title}" was accepted. The collaboration workspace is now active.`
      : `Your proposal for "${campaign.title}" has been updated to ${status}.`;

    await NotificationService.createAndEmit({
      recipientId: application.creatorId,
      senderId: req.user._id,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      data: {
        campaignId: campaign._id.toString(),
        applicationId: application._id.toString(),
        collaborationId: collaboration ? collaboration._id.toString() : undefined,
      },
      io: req.app.get('io'),
      sendEmail: true,
      actionUrl: collaboration ? `/collaborations/${collaboration._id}` : `/campaigns/${campaign._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Application marked as ${status}.`,
      application,
      collaboration,
    });
  }

  public static async withdrawApplication(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'creator') {
      throw new AppError('Only creators can withdraw proposals.', 403);
    }

    const application = await Application.findById(id);
    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    if (application.creatorId.toString() !== req.user._id.toString()) {
      throw new AppError('You do not own this application.', 403);
    }

    if (application.status === 'accepted') {
      throw new AppError('Cannot withdraw an already accepted proposal.', 400);
    }

    application.status = 'withdrawn';
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully.',
    });
  }
}
