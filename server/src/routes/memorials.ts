import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Memorial from '../models/Memorial';
import Notification from '../models/Notification';
import Profile from '../models/Profile';
import { optionalAuth, authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { processImages } from '../middleware/imageProcessor';
import logger from '../utils/logger';
import { sendPushToYearGroups } from '../utils/push';

const router = Router();

// Validation schema
const memorialSchema = z.object({
  name: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  photo: z.string().optional().nullable(),
  imageLink: z.string().url().optional().nullable().or(z.literal("").transform(() => null)),
  tribute: z.string().min(1),
  dateOfPassing: z.string(),
  funeralDate: z.string().optional().nullable(),
  funeralLocation: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
});

/**
 * GET /api/memorials
 * Get all memorials (public)
 */
router.get('/', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const memorials = await Memorial.findAll({
      order: [['dateOfPassing', 'DESC']],
    });

    return res.json(memorials);
  } catch (error: any) {
    logger.error('Get memorials error:', error);
    return res.status(500).json({
      error: 'Failed to get memorials',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/memorials/:id
 * Get a single memorial (public)
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const memorial = await Memorial.findByPk(req.params.id);

    if (!memorial) {
      return res.status(404).json({
        error: 'Memorial not found',
        details: 'Memorial does not exist',
      });
    }

    return res.json(memorial);
  } catch (error: any) {
    logger.error('Get memorial error:', error);
    return res.status(500).json({
      error: 'Failed to get memorial',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/memorials
 * Create a memorial (admin only)
 */
router.post('/', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const validatedData = memorialSchema.parse(req.body);

    const memorial = await Memorial.create({
      name: validatedData.name,
      year: validatedData.year,
      photo: validatedData.photo || undefined,
      imageLink: validatedData.imageLink || undefined,
      tribute: validatedData.tribute,
      dateOfPassing: new Date(validatedData.dateOfPassing),
      funeralDate: validatedData.funeralDate ? new Date(validatedData.funeralDate) : undefined,
      funeralLocation: validatedData.funeralLocation || undefined,
      contactNumber: validatedData.contactNumber || undefined,
    });

    // Send notifications to users in the same year group as the deceased
    const targetYear = validatedData.year;

    try {
      // Get profiles in the same year group
      const profiles = await Profile.findAll({
        where: { year: targetYear },
        attributes: ['userId'],
      });

      // Create in-app notifications for each user in the year group
      const notificationPromises = profiles.map((profile: any) =>
        Notification.create({
          userId: String(profile.userId),
          type: 'memorial',
          title: 'In Memoriam 🕯️',
          message: `Ons onthou met liefde ${validatedData.name} (Matriek ${targetYear}). Rus in vrede.`,
          read: false,
          timestamp: new Date(),
        } as any)
      );

      await Promise.allSettled(notificationPromises);
      logger.info(`Created ${profiles.length} in-app notifications for memorial (year ${targetYear})`);
    } catch (notifError: any) {
      logger.warn('Failed to create in-app notifications for memorial:', notifError.message);
    }

    // Send push notifications to users in the same year group
    sendPushToYearGroups([targetYear], {
      title: 'In Memoriam',
      body: `Ons onthou ${validatedData.name} (Matriek ${targetYear})`,
      data: {
        type: 'memorial',
        memorialId: String(memorial.id),
        url: '/memorials',
      },
    }).catch((err) => logger.warn('Failed to send push notifications for memorial:', err.message));

    return res.status(201).json(memorial);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Create memorial error:', error);
    return res.status(500).json({
      error: 'Failed to create memorial',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/memorials/:id
 * Update a memorial (admin only)
 */
router.patch('/:id', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateSchema = memorialSchema.partial();
    const validatedData = updateSchema.parse(req.body);

    const memorial = await Memorial.findByPk(id);
    if (!memorial) {
      return res.status(404).json({
        error: 'Memorial not found',
        details: 'Memorial does not exist',
      });
    }

    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.year !== undefined) updateData.year = validatedData.year;
    if (validatedData.photo !== undefined) updateData.photo = validatedData.photo || undefined;
    if (validatedData.imageLink !== undefined) updateData.imageLink = validatedData.imageLink || undefined;
    if (validatedData.tribute !== undefined) updateData.tribute = validatedData.tribute;
    if (validatedData.dateOfPassing !== undefined) updateData.dateOfPassing = new Date(validatedData.dateOfPassing);
    if (validatedData.funeralDate !== undefined) updateData.funeralDate = validatedData.funeralDate ? new Date(validatedData.funeralDate) : undefined;
    if (validatedData.funeralLocation !== undefined) updateData.funeralLocation = validatedData.funeralLocation || undefined;
    if (validatedData.contactNumber !== undefined) updateData.contactNumber = validatedData.contactNumber || undefined;
    
    await memorial.update(updateData);

    return res.json(memorial);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Update memorial error:', error);
    return res.status(500).json({
      error: 'Failed to update memorial',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/memorials/:id
 * Delete a memorial (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const memorial = await Memorial.findByPk(id);
    if (!memorial) {
      return res.status(404).json({
        error: 'Memorial not found',
        details: 'Memorial does not exist',
      });
    }

    await memorial.destroy();

    return res.json({ message: 'Memorial deleted successfully' });
  } catch (error: any) {
    logger.error('Delete memorial error:', error);
    return res.status(500).json({
      error: 'Failed to delete memorial',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

