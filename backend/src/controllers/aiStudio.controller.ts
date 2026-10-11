import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { aiAdapter, GenerateContentRequest } from '../services/aiAdapter';
import { ContentDraft, IContentDraft } from '../models/ContentDraft';
import { getUserUsageStats } from '../middleware/aiRateLimit';
import { AppError } from '../middleware/errorHandler';

function generateRevisionId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export class AIStudioController {
  /**
   * Get current AI provider status, model info, and user rate limit usage
   */
  public static async getStatus(req: Request, res: Response): Promise<void> {
    const status = aiAdapter.getStatus();
    const userId = req.user ? req.user._id.toString() : '';
    const usage = userId
      ? getUserUsageStats(userId)
      : { minuteCount: 0, minuteRemaining: 30, dayCount: 0, dayRemaining: 150 };

    res.status(200).json({
      success: true,
      status,
      usage,
    });
  }

  /**
   * Generate content using the pluggable AI provider / heuristic engine
   */
  public static async generate(req: Request, res: Response): Promise<void> {
    const {
      contentType,
      prompt,
      platform,
      tone,
      brandVoice,
      targetAudience,
      language,
      campaignTitle,
      brandGuidelines,
    } = req.body;

    if (!contentType || !prompt) {
      throw new AppError('contentType and prompt are required.', 400);
    }

    const validTypes = [
      'idea',
      'caption',
      'script',
      'reel_outline',
      'campaign_concept',
      'blog_outline',
      'calendar',
      'headline_cta',
      'image_prompt',
    ];

    if (!validTypes.includes(contentType)) {
      throw new AppError(`Invalid contentType. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    const generateReq: GenerateContentRequest = {
      contentType,
      prompt: prompt.trim(),
      platform,
      tone,
      brandVoice,
      targetAudience,
      language,
      campaignTitle,
      brandGuidelines,
    };

    const result = await aiAdapter.generateContent(generateReq);

    res.status(200).json({
      success: true,
      result,
    });
  }

  /**
   * Transform existing content (shorten, expand, tone change)
   */
  public static async transform(req: Request, res: Response): Promise<void> {
    const { content, action, targetTone, platform } = req.body;

    if (!content || !action) {
      throw new AppError('content and action are required.', 400);
    }

    if (!['shorten', 'expand', 'tone_change'].includes(action)) {
      throw new AppError('action must be shorten, expand, or tone_change.', 400);
    }

    const result = await aiAdapter.transformContent({
      content: content.trim(),
      action,
      targetTone,
      platform,
    });

    res.status(200).json({
      success: true,
      transformed: result,
    });
  }

  /**
   * Save a content draft or add a revision
   */
  public static async saveDraft(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const {
      draftId,
      title,
      contentType,
      platform,
      tone,
      brandVoice,
      targetAudience,
      language,
      inputPrompt,
      campaignId,
      currentContent,
      metadata,
      tags,
      revisionAction = 'edit',
      revisionNote,
    } = req.body;

    if (!currentContent) {
      throw new AppError('currentContent is required.', 400);
    }

    let draft: IContentDraft | null = null;

    if (draftId) {
      // Update existing draft with a new revision
      if (!Types.ObjectId.isValid(draftId)) {
        throw new AppError('Invalid draftId format.', 400);
      }

      draft = await ContentDraft.findOne({
        _id: draftId,
        userId: req.user._id,
      });

      if (!draft) {
        throw new AppError('Draft not found or access denied.', 404);
      }

      // Add revision record
      draft.revisions.push({
        revisionId: generateRevisionId(),
        content: currentContent,
        action: revisionAction,
        note: revisionNote || 'Updated content',
        createdAt: new Date(),
      });

      draft.currentContent = currentContent;
      if (title) draft.title = title.trim();
      if (tags) draft.tags = tags;
      if (metadata) draft.metadata = { ...draft.metadata, ...metadata };

      await draft.save();

      res.status(200).json({
        success: true,
        message: 'Draft revision saved successfully.',
        draft,
      });
      return;
    }

    // Create new draft
    if (!title || !contentType || !inputPrompt) {
      throw new AppError('title, contentType, and inputPrompt are required for new drafts.', 400);
    }

    const initialRevision = {
      revisionId: generateRevisionId(),
      content: currentContent,
      action: 'initial' as const,
      note: 'Initial generation draft',
      createdAt: new Date(),
    };

    draft = await ContentDraft.create({
      userId: req.user._id,
      title: title.trim(),
      contentType,
      platform: platform || 'general',
      tone: tone || 'casual',
      brandVoice: brandVoice || 'authentic',
      targetAudience: targetAudience || '',
      language: language || 'English',
      inputPrompt,
      campaignId: campaignId && Types.ObjectId.isValid(campaignId) ? campaignId : undefined,
      currentContent,
      revisions: [initialRevision],
      metadata: metadata || {},
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      message: 'Content draft created successfully.',
      draft,
    });
  }

  /**
   * List drafts for the logged-in user
   */
  public static async getDrafts(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { page, limit, contentType, isFavorite, search } = req.query as Record<string, any>;

    const query: any = { userId: req.user._id };

    if (contentType) {
      query.contentType = contentType;
    }

    if (isFavorite === 'true') {
      query.isFavorite = true;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { inputPrompt: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, drafts] = await Promise.all([
      ContentDraft.countDocuments(query),
      ContentDraft.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-revisions'), // exclude heavy revisions array for listing
    ]);

    res.status(200).json({
      success: true,
      drafts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  }

  /**
   * Get draft by ID with complete revision history
   */
  public static async getDraftById(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid draft ID format.', 400);
    }

    const draft = await ContentDraft.findOne({
      _id: id,
      userId: req.user._id,
    }).populate('campaignId', 'title category budget');

    if (!draft) {
      throw new AppError('Draft not found or access denied.', 404);
    }

    res.status(200).json({
      success: true,
      draft,
    });
  }

  /**
   * Delete draft
   */
  public static async deleteDraft(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid draft ID format.', 400);
    }

    const deleted = await ContentDraft.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deleted) {
      throw new AppError('Draft not found or access denied.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Draft removed successfully.',
    });
  }

  /**
   * Toggle favorite status on draft
   */
  public static async toggleFavorite(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid draft ID format.', 400);
    }

    const draft = await ContentDraft.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!draft) {
      throw new AppError('Draft not found or access denied.', 404);
    }

    draft.isFavorite = !draft.isFavorite;
    await draft.save();

    res.status(200).json({
      success: true,
      message: draft.isFavorite ? 'Draft marked as favorite.' : 'Draft unmarked as favorite.',
      isFavorite: draft.isFavorite,
    });
  }
}
