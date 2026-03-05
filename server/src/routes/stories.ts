import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Story from '../models/Story';
import User from '../models/User';
import Notification from '../models/Notification';
import sequelize from '../db/connection';
import { optionalAuth, authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { processImages } from '../middleware/imageProcessor';
import logger from '../utils/logger';
import { sendPushToAllUsers } from '../utils/push';

const router = Router();

// Validation schema
const storySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  images: z.array(z.string()).max(3, 'Maximum 3 images per story').optional().default([]),
  date: z.string().optional(),
});

/**
 * GET /api/stories
 * Get all stories (public) with pagination
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    // Pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Use direct SQL query to completely bypass Sequelize getters/setters
    // This avoids the circular reference issue with the images getter
    const [stories] = await sequelize.query(`
      SELECT
        s.id,
        s.title,
        s.content,
        s.authorId,
        s.images,
        s.date,
        s.createdAt,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email
      FROM stories s
      LEFT JOIN users u ON s.authorId = u.id
      ORDER BY s.date DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `, { replacements: { offset, limit } }) as [any[], unknown];

    // Get total count
    const [[{ total }]] = await sequelize.query(`
      SELECT COUNT(*) as total FROM stories
    `) as [[{ total: number }], unknown];

    const storiesData = stories.map((story: any) => {
      // Extract images safely from raw database value (bypasses getter)
      let images: string[] = [];
      const imagesRaw = story.images;
      if (Array.isArray(imagesRaw)) {
        images = imagesRaw;
      } else if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
        try {
          images = JSON.parse(imagesRaw);
        } catch {
          images = [];
        }
      }
      
      // Format dates
      const dateValue = story.date;
      const dateStr = dateValue instanceof Date 
        ? dateValue.toISOString().split('T')[0]
        : dateValue ? String(dateValue).split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      const createdAtValue = story.createdAt;
      const createdAtStr = createdAtValue instanceof Date
        ? createdAtValue.toISOString()
        : createdAtValue ? String(createdAtValue)
        : new Date().toISOString();
      
      return {
        id: String(story.id),
        title: String(story.title || ''),
        content: String(story.content || ''),
        author: story.author_name || story.author_email || 'Unknown',
        authorId: story.authorId ? String(story.authorId) : null,
        images: images,
        date: dateStr,
        createdAt: createdAtStr,
      };
    });

    return res.json({
      data: storiesData,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Get stories error:', error);
    logger.error('Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Failed to get stories',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/stories/:id
 * Get a single story (public)
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const story = await Story.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      }],
    });

    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
        details: 'Story does not exist',
      });
    }

    const storyData: any = story;
    return res.json({
      id: story.id,
      title: story.title,
      content: story.content,
      author: storyData.author?.name || 'Unknown',
      authorId: story.authorId,
      images: story.images as string[],
      date: story.date.toISOString().split('T')[0],
      createdAt: story.createdAt,
    });
  } catch (error: any) {
    logger.error('Get story error:', error);
    return res.status(500).json({
      error: 'Failed to get story',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/stories
 * Create a story (admin only)
 */
router.post('/', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const validatedData = storySchema.parse(req.body);
    const userId = req.user!.userId;

    const story = await Story.create({
      title: validatedData.title,
      content: validatedData.content,
      authorId: userId,
      images: validatedData.images || [],
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
    });

    const author = await User.findByPk(userId);

    // Send notifications to all users about new story
    try {
      // Get all users
      const allUsers = await User.findAll({
        attributes: ['id'],
      });

      // Create in-app notifications for each user (except the author)
      const notificationPromises = allUsers
        .filter((user: any) => String(user.id) !== String(userId))
        .map((user: any) =>
          Notification.create({
            userId: String(user.id),
            type: 'story',
            title: 'Nuwe Storie Geplaas! 📖',
            message: `"${validatedData.title}" deur ${author?.name || 'Admin'}. Lees die nuutste storie van ons alumni!`,
            read: false,
            timestamp: new Date(),
          } as any)
        );

      await Promise.allSettled(notificationPromises);
      logger.info(`Created ${allUsers.length - 1} in-app notifications for new story`);
    } catch (notifError: any) {
      logger.warn('Failed to create in-app notifications for story:', notifError.message);
    }

    // Send push notifications to all users
    logger.info('[STORY] About to send push notifications for new story:', validatedData.title);
    sendPushToAllUsers({
      title: 'Nuwe Storie Geplaas!',
      body: `"${validatedData.title}" deur ${author?.name || 'Admin'}`,
      data: {
        type: 'story',
        storyId: String(story.id),
        url: '/stories',
      },
    }).then(() => {
      logger.info('[STORY] Push notifications sent successfully');
    }).catch((err) => {
      logger.error('[STORY] Failed to send push notifications:', err.message);
      logger.error('[STORY] Error details:', err);
    });

    return res.status(201).json({
      id: story.id,
      title: story.title,
      content: story.content,
      author: author?.name || 'Admin',
      authorId: story.authorId,
      images: story.images as string[],
      date: story.date.toISOString().split('T')[0],
      createdAt: story.createdAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Create story error:', error);
    return res.status(500).json({
      error: 'Failed to create story',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/stories/:id
 * Update a story (admin only)
 */
router.patch('/:id', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateSchema = storySchema.partial();
    const validatedData = updateSchema.parse(req.body);

    const story = await Story.findByPk(id);
    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
        details: 'Story does not exist',
      });
    }

    await story.update({
      title: validatedData.title !== undefined ? validatedData.title : story.title,
      content: validatedData.content !== undefined ? validatedData.content : story.content,
      images: validatedData.images !== undefined ? validatedData.images : story.images,
      date: validatedData.date ? new Date(validatedData.date) : story.date,
    });

    const author = await User.findByPk(story.authorId);

    return res.json({
      id: story.id,
      title: story.title,
      content: story.content,
      author: author?.name || 'Unknown',
      authorId: story.authorId,
      images: story.images as string[],
      date: story.date.toISOString().split('T')[0],
      createdAt: story.createdAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Update story error:', error);
    return res.status(500).json({
      error: 'Failed to update story',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/stories/:id
 * Delete a story (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const story = await Story.findByPk(id);
    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
        details: 'Story does not exist',
      });
    }

    await story.destroy();

    return res.json({ message: 'Story deleted successfully' });
  } catch (error: any) {
    logger.error('Delete story error:', error);
    return res.status(500).json({
      error: 'Failed to delete story',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

