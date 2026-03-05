import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { QueryTypes } from 'sequelize';
import YearGroupPost from '../models/YearGroupPost';
import YearGroup from '../models/YearGroup';
import User from '../models/User';
import sequelize from '../db/connection';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { processImages } from '../middleware/imageProcessor';
import logger from '../utils/logger';

const router = Router();

// Validation schema for post creation/update
const postSchema = z.object({
  yearGroupId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  images: z.array(z.string()).max(3, 'Maximum 3 images per post').optional().default([]), // Array of base64 images
});

/**
 * GET /api/year-group-posts/:yearGroupId
 * Get all posts for a year group (public)
 * Uses raw SQL to avoid getter/setter circular issues with images field
 */
router.get('/:yearGroupId', async (req: Request, res: Response) => {
  try {
    const { yearGroupId } = req.params;

    // Use raw SQL query to avoid getter/setter circular issues
    const posts = await sequelize.query(`
      SELECT 
        p.id,
        p.yearGroupId,
        p.authorId,
        p.title,
        p.content,
        p.images,
        p.createdAt,
        p.updatedAt,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        yg.id as year_group_id,
        yg.year as year_group_year
      FROM year_group_posts p
      LEFT JOIN users u ON p.authorId = u.id
      LEFT JOIN year_groups yg ON p.yearGroupId = yg.id
      WHERE p.yearGroupId = :yearGroupId
      ORDER BY p.createdAt DESC
    `, {
      replacements: { yearGroupId },
      type: QueryTypes.SELECT,
    }) as any[];

    // Format the response
    const postsData = posts.map((post: any) => {
      // Parse images from raw database value
      let images: string[] = [];
      const imagesRaw = post.images;
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
      const createdAtStr = post.createdAt instanceof Date
        ? post.createdAt.toISOString()
        : post.createdAt ? String(post.createdAt)
        : new Date().toISOString();
      
      const updatedAtStr = post.updatedAt instanceof Date
        ? post.updatedAt.toISOString()
        : post.updatedAt ? String(post.updatedAt)
        : new Date().toISOString();
      
      return {
        id: String(post.id),
        yearGroupId: String(post.yearGroupId),
        authorId: String(post.authorId),
        title: String(post.title || ''),
        content: String(post.content || ''),
        images: images,
        author: {
          id: String(post.author_id || post.authorId),
          name: post.author_name || 'Unknown',
          email: post.author_email || null,
        },
        yearGroup: {
          id: String(post.year_group_id || post.yearGroupId),
          year: post.year_group_year || null,
        },
        createdAt: createdAtStr,
        updatedAt: updatedAtStr,
      };
    });

    return res.json(postsData);
  } catch (error: any) {
    logger.error('Get year group posts error:', error);
    logger.error('Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Failed to get posts',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/year-group-posts/post/:id
 * Get a single post by ID (public)
 */
router.get('/post/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await YearGroupPost.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: YearGroup,
          as: 'yearGroup',
          attributes: ['id', 'year'],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    return res.json(post);
  } catch (error: any) {
    logger.error('Get post error:', error);
    return res.status(500).json({
      error: 'Failed to get post',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/year-group-posts
 * Create a new post (admin only)
 */
router.post('/', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = postSchema.parse(req.body);

    // Verify year group exists
    const yearGroup = await YearGroup.findByPk(validatedData.yearGroupId);
    if (!yearGroup) {
      return res.status(404).json({
        error: 'Year group not found',
      });
    }

    const post = await YearGroupPost.create({
      yearGroupId: validatedData.yearGroupId,
      authorId: userId,
      title: validatedData.title,
      content: validatedData.content,
      images: validatedData.images || [],
    });

    // Reload with associations
    await post.reload({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: YearGroup,
          as: 'yearGroup',
          attributes: ['id', 'year'],
        },
      ],
    });

    return res.status(201).json(post);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Create post error:', error);
    return res.status(500).json({
      error: 'Failed to create post',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/year-group-posts/:id
 * Update a post (admin only)
 */
router.patch('/:id', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateSchema = postSchema.partial();
    const validatedData = updateSchema.parse(req.body);

    const post = await YearGroupPost.findByPk(id);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    // Update post
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.images !== undefined) updateData.images = validatedData.images;
    if (validatedData.yearGroupId !== undefined) {
      // Verify new year group exists
      const yearGroup = await YearGroup.findByPk(validatedData.yearGroupId);
      if (!yearGroup) {
        return res.status(404).json({
          error: 'Year group not found',
        });
      }
      updateData.yearGroupId = validatedData.yearGroupId;
    }

    await post.update(updateData);

    // Reload with associations
    await post.reload({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: YearGroup,
          as: 'yearGroup',
          attributes: ['id', 'year'],
        },
      ],
    });

    return res.json(post);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Update post error:', error);
    return res.status(500).json({
      error: 'Failed to update post',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/year-group-posts/:id
 * Delete a post (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await YearGroupPost.findByPk(id);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    await post.destroy();

    return res.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    logger.error('Delete post error:', error);
    return res.status(500).json({
      error: 'Failed to delete post',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

