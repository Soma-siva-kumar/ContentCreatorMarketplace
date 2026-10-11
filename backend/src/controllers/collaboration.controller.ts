import { Request, Response } from 'express';
import { Collaboration } from '../models/Collaboration';
import { CreatorProfile } from '../models/CreatorProfile';
import { BrandProfile } from '../models/BrandProfile';
import { Review } from '../models/Review';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';

export class CollaborationController {
  public static async getMyCollaborations(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const query = {
      $or: [{ brandId: req.user._id }, { creatorId: req.user._id }],
    };

    const collaborations = await Collaboration.find(query)
      .populate('campaignId', 'title category deliverables')
      .populate('brandId', 'email')
      .populate('creatorId', 'email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      collaborations,
    });
  }

  public static async getCollaborationById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const collaboration = await Collaboration.findById(id)
      .populate('campaignId')
      .populate('brandId', 'email')
      .populate('creatorId', 'email');

    if (!collaboration) {
      throw new AppError('Collaboration not found.', 404);
    }

    // Authorization check: only brand or creator participant can view
    const isBrand = collaboration.brandId._id.toString() === req.user._id.toString();
    const isCreator = collaboration.creatorId._id.toString() === req.user._id.toString();

    if (!isBrand && !isCreator && req.user.role !== 'admin') {
      throw new AppError('You do not have access to this collaboration workspace.', 403);
    }

    const [brandProfile, creatorProfile] = await Promise.all([
      BrandProfile.findOne({ userId: collaboration.brandId._id }),
      CreatorProfile.findOne({ userId: collaboration.creatorId._id }),
    ]);

    // Check if review has already been submitted
    const existingReview = await Review.findOne({ collaborationId: collaboration._id });

    res.status(200).json({
      success: true,
      collaboration,
      brandProfile,
      creatorProfile,
      isBrand,
      isCreator,
      hasReviewed: Boolean(existingReview),
      review: existingReview || null,
    });
  }

  public static async submitMilestoneDeliverable(req: Request, res: Response): Promise<void> {
    const { id, milestoneId } = req.params;
    const { fileUrl, fileName, fileSize, mimeType, caption, notes } = req.body;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found.', 404);
    }

    if (collaboration.creatorId.toString() !== req.user._id.toString()) {
      throw new AppError('Only the assigned creator can submit deliverables.', 403);
    }

    const milestone = (collaboration.milestones as any).id(milestoneId);
    if (!milestone) {
      throw new AppError('Milestone not found in collaboration.', 404);
    }

    milestone.deliverable = {
      fileUrl,
      fileName: fileName || 'deliverable-file',
      fileSize,
      mimeType,
      caption: caption || '',
      notes: notes || '',
      submittedAt: new Date(),
    };
    milestone.status = 'submitted';
    milestone.revisionNotes = undefined;

    await collaboration.save();

    // Notify client brand of deliverable submission
    await NotificationService.createAndEmit({
      recipientId: collaboration.brandId,
      senderId: req.user._id,
      type: 'milestone_submitted',
      title: 'Milestone Deliverable Submitted',
      message: `Creator submitted deliverable for milestone "${milestone.title}".`,
      data: { collaborationId: collaboration._id.toString(), milestoneId },
      io: req.app.get('io'),
      sendEmail: true,
      actionUrl: `/collaborations/${collaboration._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Deliverable submitted for brand review.',
      collaboration,
    });
  }

  public static async reviewMilestoneDeliverable(req: Request, res: Response): Promise<void> {
    const { id, milestoneId } = req.params;
    const { action, revisionNotes } = req.body;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found.', 404);
    }

    if (collaboration.brandId.toString() !== req.user._id.toString()) {
      throw new AppError('Only the client brand can review deliverables.', 403);
    }

    const milestone = (collaboration.milestones as any).id(milestoneId);
    if (!milestone) {
      throw new AppError('Milestone not found in collaboration.', 404);
    }

    if (action === 'approve') {
      milestone.status = 'approved';
      milestone.approvedAt = new Date();

      // Check if all milestones are now approved
      const allApproved = collaboration.milestones.every(
        (m: any) => m.status === 'approved' || m._id.toString() === milestoneId
      );

      if (allApproved) {
        collaboration.status = 'completed';
        collaboration.completedAt = new Date();

        // Increment creator's completed count
        await CreatorProfile.updateOne(
          { userId: collaboration.creatorId },
          { $inc: { completedCollaborationsCount: 1 } }
        );
      }
    } else if (action === 'request_revision') {
      milestone.status = 'revision_requested';
      milestone.revisionNotes = revisionNotes || 'Revision requested by brand.';
    }

    await collaboration.save();

    // Notify creator of review decision (approval or revision request)
    const notifType = action === 'approve' ? 'milestone_approved' : 'revision_requested';
    const notifTitle = action === 'approve' ? 'Milestone Deliverable Approved!' : 'Milestone Revision Requested';
    const notifMsg = action === 'approve'
      ? `Brand approved deliverable for milestone "${milestone.title}".`
      : `Brand requested adjustments for milestone "${milestone.title}": ${milestone.revisionNotes}`;

    await NotificationService.createAndEmit({
      recipientId: collaboration.creatorId,
      senderId: req.user._id,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      data: { collaborationId: collaboration._id.toString(), milestoneId },
      io: req.app.get('io'),
      sendEmail: true,
      actionUrl: `/collaborations/${collaboration._id}`,
    });

    res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Milestone deliverable approved.' : 'Revision requested.',
      collaboration,
    });
  }

  public static async submitReview(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { rating, reviewText, communicationRating, qualityRating, timelinessRating } = req.body;

    if (!req.user || req.user.role !== 'brand') {
      throw new AppError('Only the client brand can submit a review.', 403);
    }

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found.', 404);
    }

    if (collaboration.brandId.toString() !== req.user._id.toString()) {
      throw new AppError('You do not own this collaboration.', 403);
    }

    if (collaboration.status !== 'completed') {
      throw new AppError('Reviews can only be submitted for completed collaborations.', 400);
    }

    const existing = await Review.findOne({ collaborationId: collaboration._id });
    if (existing) {
      throw new AppError('A review has already been submitted for this collaboration.', 409);
    }

    const review = await Review.create({
      creatorId: collaboration.creatorId,
      brandId: req.user._id,
      collaborationId: collaboration._id,
      rating,
      reviewText,
      communicationRating,
      qualityRating,
      timelinessRating,
    });

    // Recalculate creator average rating and reviewCount
    const allReviews = await Review.find({ creatorId: collaboration.creatorId });
    const count = allReviews.length;
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

    await CreatorProfile.updateOne(
      { userId: collaboration.creatorId },
      {
        $set: {
          rating: Number(avgRating.toFixed(1)),
          reviewCount: count,
        },
      }
    );

    // Notify creator that a verified review was received
    await NotificationService.createAndEmit({
      recipientId: collaboration.creatorId,
      senderId: req.user._id,
      type: 'review_received',
      title: 'Verified Review Received',
      message: `Client left a verified review (${rating} stars) for your collaboration!`,
      data: { collaborationId: collaboration._id.toString(), reviewId: review._id.toString() },
      io: req.app.get('io'),
      sendEmail: true,
      actionUrl: `/collaborations/${collaboration._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Verified review submitted successfully.',
      review,
    });
  }
}
