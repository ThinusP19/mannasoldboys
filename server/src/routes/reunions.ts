import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Reunion from '../models/Reunion';
import ReunionRegistration from '../models/ReunionRegistration';
import User from '../models/User';
import Profile from '../models/Profile';
import Notification from '../models/Notification';
import { optionalAuth, authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import logger from '../utils/logger';
import { sendPushToYearGroups } from '../utils/push';

const router = Router();

// Validation schema
const reunionSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  location: z.string().min(1),
  description: z.string().optional().nullable(),
  targetYearGroups: z.array(z.number()).optional().nullable(),
});

/**
 * GET /api/reunions
 * Get all reunions (public)
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    let userYear: number | null = null;
    
    // Admins see all reunions, no filtering
    if (userRole === 'admin') {
      const allReunions = await Reunion.findAll({
        order: [['date', 'DESC']],
      });
      // Serialize properly for admin
      const serializedReunions = allReunions.map((reunion: any) => {
        const reunionJson = reunion.toJSON ? reunion.toJSON() : reunion;
        let targetYears: number[] = [];
        if (reunionJson.targetYearGroups) {
          if (typeof reunionJson.targetYearGroups === 'string') {
            try {
              targetYears = JSON.parse(reunionJson.targetYearGroups);
            } catch {
              targetYears = [];
            }
          } else if (Array.isArray(reunionJson.targetYearGroups)) {
            targetYears = reunionJson.targetYearGroups;
          }
        }
        return {
          id: String(reunionJson.id),
          title: String(reunionJson.title),
          date: reunionJson.date ? (reunionJson.date instanceof Date ? reunionJson.date.toISOString() : String(reunionJson.date)) : new Date().toISOString(),
          location: String(reunionJson.location),
          description: reunionJson.description || null,
          targetYearGroups: targetYears,
          createdAt: reunionJson.createdAt ? (reunionJson.createdAt instanceof Date ? reunionJson.createdAt.toISOString() : String(reunionJson.createdAt)) : new Date().toISOString(),
          updatedAt: reunionJson.updatedAt ? (reunionJson.updatedAt instanceof Date ? reunionJson.updatedAt.toISOString() : String(reunionJson.updatedAt)) : new Date().toISOString(),
        };
      });
      return res.json(serializedReunions);
    }
    
    // If user is authenticated, get their year group
    if (userId) {
      const profile = await Profile.findOne({
        where: { userId },
        attributes: ['year'],
      });
      if (profile && profile.year) {
        userYear = profile.year;
      }
    }

    const allReunions = await Reunion.findAll({
      order: [['date', 'DESC']],
    });

    logger.info(`Found ${allReunions.length} total reunions. User authenticated: ${!!userId}, User year: ${userYear || 'not set'}`);

    // Filter reunions based on targetYearGroups
    // If no targetYearGroups specified, show to all
    // If targetYearGroups specified, only show if user's year is in the list
    const filteredReunions = allReunions.filter((reunion: any) => {
      // Get targetYearGroups from reunion - use getter if available, otherwise parse
      let targetYears: number[] = [];
      const reunionJson = reunion.toJSON ? reunion.toJSON() : reunion;
      
      if (reunionJson.targetYearGroups) {
        if (typeof reunionJson.targetYearGroups === 'string') {
          try {
            const parsed = JSON.parse(reunionJson.targetYearGroups);
            targetYears = Array.isArray(parsed) ? parsed : [];
          } catch {
            targetYears = [];
          }
        } else if (Array.isArray(reunionJson.targetYearGroups)) {
          targetYears = reunionJson.targetYearGroups;
        }
      }
      
      // If no target years specified (empty array), show to everyone
      if (!targetYears || targetYears.length === 0) {
        return true;
      }
      
      // If user is not authenticated or doesn't have a year, don't show targeted reunions
      if (!userYear) {
        return false;
      }
      
      // Show if user's year is in target list
      return targetYears.includes(userYear);
    });

    logger.info(`Returning ${filteredReunions.length} filtered reunions (out of ${allReunions.length} total)`);

    // Serialize reunions properly
    const serializedReunions = filteredReunions.map((reunion: any) => {
      const reunionJson = reunion.toJSON ? reunion.toJSON() : reunion;
      return {
        id: String(reunionJson.id),
        title: String(reunionJson.title),
        date: reunionJson.date ? (reunionJson.date instanceof Date ? reunionJson.date.toISOString() : String(reunionJson.date)) : new Date().toISOString(),
        location: String(reunionJson.location),
        description: reunionJson.description || null,
        targetYearGroups: reunionJson.targetYearGroups ? (typeof reunionJson.targetYearGroups === 'string' ? JSON.parse(reunionJson.targetYearGroups) : reunionJson.targetYearGroups) : [],
        createdAt: reunionJson.createdAt ? (reunionJson.createdAt instanceof Date ? reunionJson.createdAt.toISOString() : String(reunionJson.createdAt)) : new Date().toISOString(),
        updatedAt: reunionJson.updatedAt ? (reunionJson.updatedAt instanceof Date ? reunionJson.updatedAt.toISOString() : String(reunionJson.updatedAt)) : new Date().toISOString(),
      };
    });
    
    return res.json(serializedReunions);
  } catch (error: any) {
    logger.error('Get reunions error:', error);
    return res.status(500).json({
      error: 'Failed to get reunions',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/reunions/:id
 * Get a single reunion (public)
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const reunion = await Reunion.findByPk(req.params.id);

    if (!reunion) {
      return res.status(404).json({
        error: 'Reunion not found',
        details: 'Reunion does not exist',
      });
    }

    return res.json(reunion);
  } catch (error: any) {
    logger.error('Get reunion error:', error);
    return res.status(500).json({
      error: 'Failed to get reunion',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/reunions
 * Create a reunion (admin only)
 */
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('Creating reunion with data:', req.body);
    const validatedData = reunionSchema.parse(req.body);
    logger.info('Validated data:', validatedData);

    const reunion = await Reunion.create({
      title: validatedData.title,
      date: new Date(validatedData.date),
      location: validatedData.location,
      description: validatedData.description || undefined,
      targetYearGroups: validatedData.targetYearGroups && validatedData.targetYearGroups.length > 0 
        ? JSON.stringify(validatedData.targetYearGroups) 
        : '[]',
    });

    logger.info(`Reunion created successfully: ${reunion.id} - ${reunion.title}`);

    // Send notifications to users in target year groups
    const targetYears = validatedData.targetYearGroups || [];
    const formattedDate = new Date(validatedData.date).toLocaleDateString('af-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create in-app notifications for users in target year groups
    try {
      const { Op } = await import('sequelize');
      let profiles: any[] = [];

      if (targetYears.length === 0) {
        // No specific year groups - notify all users
        profiles = await Profile.findAll({
          attributes: ['userId'],
        });
      } else {
        // Get profiles in target year groups
        profiles = await Profile.findAll({
          where: {
            year: { [Op.in]: targetYears },
          },
          attributes: ['userId'],
        });
      }

      // Create notifications for each user
      const notificationPromises = profiles.map((profile: any) =>
        Notification.create({
          userId: String(profile.userId),
          type: 'reunion',
          title: 'Nuwe Reünie Aangekondig! 🎉',
          message: `${validatedData.title} op ${formattedDate} by ${validatedData.location}. Bespreek nou jou plek!`,
          read: false,
          timestamp: new Date(),
        } as any)
      );

      await Promise.allSettled(notificationPromises);
      logger.info(`Created ${profiles.length} in-app notifications for reunion`);
    } catch (notifError: any) {
      logger.warn('Failed to create in-app notifications:', notifError.message);
    }

    // Send push notifications
    sendPushToYearGroups(targetYears, {
      title: 'Nuwe Reünie Aangekondig!',
      body: `${validatedData.title} op ${formattedDate}`,
      data: {
        type: 'reunion',
        reunionId: String(reunion.id),
        url: '/reunions',
      },
    }).catch((err) => logger.warn('Failed to send push notifications:', err.message));

    // Return properly serialized reunion
    const reunionJson = reunion.toJSON ? reunion.toJSON() : reunion;
    return res.status(201).json({
      id: String(reunionJson.id),
      title: String(reunionJson.title),
      date: reunionJson.date ? (reunionJson.date instanceof Date ? reunionJson.date.toISOString() : String(reunionJson.date)) : new Date().toISOString(),
      location: String(reunionJson.location),
      description: reunionJson.description || null,
      targetYearGroups: reunionJson.targetYearGroups ? (typeof reunionJson.targetYearGroups === 'string' ? JSON.parse(reunionJson.targetYearGroups) : reunionJson.targetYearGroups) : [],
      createdAt: reunionJson.createdAt ? (reunionJson.createdAt instanceof Date ? reunionJson.createdAt.toISOString() : String(reunionJson.createdAt)) : new Date().toISOString(),
      updatedAt: reunionJson.updatedAt ? (reunionJson.updatedAt instanceof Date ? reunionJson.updatedAt.toISOString() : String(reunionJson.updatedAt)) : new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Create reunion error:', error);
    return res.status(500).json({
      error: 'Failed to create reunion',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/reunions/:id
 * Update a reunion (admin only)
 */
router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateSchema = reunionSchema.partial();
    const validatedData = updateSchema.parse(req.body);

    const reunion = await Reunion.findByPk(id);
    if (!reunion) {
      return res.status(404).json({
        error: 'Reunion not found',
        details: 'Reunion does not exist',
      });
    }

    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || undefined;
    
    await reunion.update(updateData);

    return res.json(reunion);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Update reunion error:', error);
    return res.status(500).json({
      error: 'Failed to update reunion',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/reunions/:id
 * Delete a reunion (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reunion = await Reunion.findByPk(id);
    if (!reunion) {
      return res.status(404).json({
        error: 'Reunion not found',
        details: 'Reunion does not exist',
      });
    }

    await reunion.destroy();

    return res.json({ message: 'Reunion deleted successfully' });
  } catch (error: any) {
    logger.error('Delete reunion error:', error);
    return res.status(500).json({
      error: 'Failed to delete reunion',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/reunions/:id/register
 * Register for a reunion (authenticated users only)
 */
router.post('/:id/register', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: reunionId } = req.params;
    const { status = 'coming' } = req.body; // Default to 'coming' if not provided
    const userId = req.user!.userId;

    logger.info(`RSVP request: reunionId=${reunionId}, userId=${userId}, status=${status}`);

    // Validate status
    if (!['coming', 'maybe', 'not_coming'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: 'Status must be one of: coming, maybe, not_coming',
      });
    }

    // Check if reunion exists
    const reunion = await Reunion.findByPk(reunionId);
    if (!reunion) {
      return res.status(404).json({
        error: 'Reunion not found',
        details: 'The requested reunion does not exist',
      });
    }

    // Check if already registered - if so, update status
    const existingRegistration = await ReunionRegistration.findOne({
      where: { reunionId, userId },
    });

    if (existingRegistration) {
      // Update existing registration status
      await existingRegistration.update({ status });
      // Reload to get updated status
      await existingRegistration.reload();
      const regJson = existingRegistration.toJSON ? existingRegistration.toJSON() : existingRegistration;
      logger.info(`Updated registration: id=${regJson.id}, status=${regJson.status}`);
      return res.json({
        message: 'RSVP status updated successfully',
        registration: {
          id: String(regJson.id),
          reunionId: String(regJson.reunionId),
          userId: String(regJson.userId),
          status: regJson.status || status, // Ensure status is included
          createdAt: regJson.createdAt ? (regJson.createdAt instanceof Date ? regJson.createdAt.toISOString() : String(regJson.createdAt)) : new Date().toISOString(),
        },
      });
    }

    // Create new registration
    const registration = await ReunionRegistration.create({
      reunionId,
      userId,
      status,
    });

    const regJson = registration.toJSON ? registration.toJSON() : registration;
    logger.info(`Created registration: id=${regJson.id}, status=${regJson.status}`);
    return res.status(201).json({
      message: 'Successfully registered for reunion',
      registration: {
        id: String(regJson.id),
        reunionId: String(regJson.reunionId),
        userId: String(regJson.userId),
        status: regJson.status || status, // Ensure status is included
        createdAt: regJson.createdAt ? (regJson.createdAt instanceof Date ? regJson.createdAt.toISOString() : String(regJson.createdAt)) : new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Register for reunion error:', error);
    return res.status(500).json({
      error: 'Failed to register for reunion',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/reunions/:id/register
 * Unregister from a reunion (authenticated users only)
 */
router.delete('/:id/register', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: reunionId } = req.params;
    const userId = req.user!.userId;

    const registration = await ReunionRegistration.findOne({
      where: { reunionId, userId },
    });

    if (!registration) {
      return res.status(404).json({
        error: 'Not registered',
        details: 'You are not registered for this reunion',
      });
    }

    await registration.destroy();

    return res.json({
      message: 'Successfully unregistered from reunion',
    });
  } catch (error: any) {
    logger.error('Unregister from reunion error:', error);
    return res.status(500).json({
      error: 'Failed to unregister from reunion',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/reunions/:id/registrations
 * Get all registrations for a reunion (admin only)
 */
router.get('/:id/registrations', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id: reunionId } = req.params;

    // Verify reunion exists
    const reunion = await Reunion.findByPk(reunionId);
    if (!reunion) {
      return res.status(404).json({
        error: 'Reunion not found',
        details: 'The requested reunion does not exist',
      });
    }

    // Get registrations with user info - use raw query to avoid circular references
    const registrations = await ReunionRegistration.findAll({
      where: { reunionId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      raw: false, // Get model instances
    });

    // Safely serialize registrations to avoid circular references
    const formattedRegistrations = registrations.map((reg: any) => {
      // Safely access user without causing circular reference
      const user = reg.get ? reg.get('user') : reg.user;
      
      // Extract user data safely
      let userName = 'Unknown';
      let userEmail = null;
      if (user && typeof user === 'object') {
        userName = user.get ? String(user.get('name') || 'Unknown') : String(user.name || 'Unknown');
        userEmail = user.get ? (user.get('email') ? String(user.get('email')) : null) : (user.email ? String(user.email) : null);
      }
      
      // Extract registration data safely
      const createdAtValue = reg.get ? reg.get('createdAt') : reg.createdAt;
      const createdAtStr = createdAtValue instanceof Date
        ? createdAtValue.toISOString()
        : createdAtValue ? String(createdAtValue)
        : new Date().toISOString();
      
      return {
        id: String(reg.get ? reg.get('id') : reg.id),
        reunionId: String(reg.get ? reg.get('reunionId') : reg.reunionId),
        userId: String(reg.get ? reg.get('userId') : reg.userId),
        userName: userName,
        userEmail: userEmail,
        status: String(reg.get ? reg.get('status') : reg.status || 'coming'),
        createdAt: createdAtStr,
      };
    });

    // Safely serialize reunion
    const reunionJson = reunion.toJSON ? reunion.toJSON() : reunion;

    return res.json({
      reunion: {
        id: String(reunionJson.id),
        title: String(reunionJson.title),
        date: reunionJson.date ? (reunionJson.date instanceof Date ? reunionJson.date.toISOString() : String(reunionJson.date)) : new Date().toISOString(),
        location: String(reunionJson.location),
      },
      registrations: formattedRegistrations,
      totalRegistrations: formattedRegistrations.length,
    });
  } catch (error: any) {
    logger.error('Get reunion registrations error:', error);
    return res.status(500).json({
      error: 'Failed to get registrations',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/reunions/:id/check-registration
 * Check if current user is registered for a reunion (authenticated users only)
 */
router.get('/:id/check-registration', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: reunionId } = req.params;
    const userId = req.user!.userId;

    const registration = await ReunionRegistration.findOne({
      where: { reunionId, userId },
    });

    const regJson = registration ? (registration.toJSON ? registration.toJSON() : registration) : null;
    return res.json({
      isRegistered: !!registration,
      registration: regJson ? {
        id: String(regJson.id),
        status: regJson.status || 'coming',
        createdAt: regJson.createdAt ? (regJson.createdAt instanceof Date ? regJson.createdAt.toISOString() : String(regJson.createdAt)) : new Date().toISOString(),
      } : null,
    });
  } catch (error: any) {
    logger.error('Check registration error:', error);
    return res.status(500).json({
      error: 'Failed to check registration',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

