import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { QueryTypes } from 'sequelize';
import YearGroup from '../models/YearGroup';
import sequelize from '../db/connection';
import { optionalAuth, authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { processImages } from '../middleware/imageProcessor';
import logger from '../utils/logger';

const router = Router();

// Validation schema for year group creation/update
const yearGroupSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  groupPhoto: z.string().optional().nullable(), // Backward compatibility
  photos: z.array(z.string()).max(10, 'Maximum 10 photos allowed').optional().nullable(),
  yearInfo: z.string().optional().nullable(),
  whatsappLink: z.union([
    z.string().url(),
    z.literal(""),
    z.null(),
  ]).optional().nullable().transform((val) => val === "" ? null : val),
});

/**
 * GET /api/year-groups
 * Get all year groups (public)
 * Uses raw SQL for reliability and performance - includes first photo only for thumbnails
 */
router.get('/', optionalAuth, async (_req: Request, res: Response) => {
  try {
    // Use raw SQL query for reliability and to avoid getter/setter issues
    const yearGroups = await sequelize.query(`
      SELECT
        id,
        year,
        yearInfo,
        whatsappLink,
        photos,
        groupPhoto,
        createdAt,
        updatedAt
      FROM year_groups
      ORDER BY year DESC
    `, {
      type: QueryTypes.SELECT,
    }) as any[];

    // Format the response - include first photo for thumbnail display
    const yearGroupsData = yearGroups.map((yg: any) => {
      // Parse photos if it's a JSON string
      let photos: string[] | null = null;
      if (yg.photos) {
        if (typeof yg.photos === 'string') {
          try {
            photos = JSON.parse(yg.photos);
          } catch {
            photos = null;
          }
        } else if (Array.isArray(yg.photos)) {
          photos = yg.photos;
        }
      }

      return {
        id: String(yg.id),
        year: Number(yg.year),
        yearInfo: yg.yearInfo || null,
        whatsappLink: yg.whatsappLink || null,
        createdAt: yg.createdAt instanceof Date
          ? yg.createdAt.toISOString()
          : yg.createdAt ? String(yg.createdAt)
          : new Date().toISOString(),
        updatedAt: yg.updatedAt instanceof Date
          ? yg.updatedAt.toISOString()
          : yg.updatedAt ? String(yg.updatedAt)
          : new Date().toISOString(),
        photos: photos && photos.length > 0 ? [photos[0]] : null, // Only first photo for thumbnail
        groupPhoto: yg.groupPhoto || null,
      };
    });

    return res.json(yearGroupsData);
  } catch (error: any) {
    logger.error('Get year groups error:', error);
    logger.error('Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Failed to get year groups',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/year-groups/:year/members
 * Get all members for a specific year group (public)
 * NOTE: This route must be defined BEFORE /:year to avoid route conflicts
 */
router.get('/:year/members', optionalAuth, async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({
        error: 'Invalid year',
        details: 'Year must be a valid number',
      });
    }

    // Get requesting user's year (if authenticated)
    const requestingUserId = req.user?.userId;
    let requestingUserYear: number | null = null;
    
    if (requestingUserId) {
      const requestingUserProfile = await sequelize.query(`
        SELECT year FROM profiles WHERE userId = :userId
      `, {
        replacements: { userId: requestingUserId },
        type: QueryTypes.SELECT,
      }) as any[];
      
      if (requestingUserProfile && requestingUserProfile.length > 0) {
        requestingUserYear = requestingUserProfile[0].year;
      }
    }

    // Use raw SQL query to avoid getter/setter circular issues
    const profiles = await sequelize.query(`
      SELECT 
        p.id,
        p.userId,
        p.name,
        p.year,
        p.nowPhoto,
        p.thenPhoto,
        p.bio,
        p.phone,
        p.email,
        p.linkedin,
        p.instagram,
        p.facebook,
        p.contactPermission,
        p.verificationStatus,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.isMember,
        u.createdAt as user_createdAt
      FROM profiles p
      LEFT JOIN users u ON p.userId = u.id
      WHERE p.year = :year
      ORDER BY p.name ASC
    `, {
      replacements: { year },
      type: QueryTypes.SELECT,
    }) as any[];

    // Format the response with contact permission enforcement
    const members = profiles.map((profile: any) => {
      const contactPermission = profile.contactPermission || 'all';
      
      // Base member info (always visible)
      const member: any = {
        id: profile.user_id || profile.userId,
        name: profile.user_name || profile.name || 'Unknown',
        year: profile.year,
        isMember: Boolean(profile.isMember),
        nowPhoto: profile.nowPhoto,
        thenPhoto: profile.thenPhoto,
        bio: profile.bio,
        contactPermission: contactPermission,
        createdAt: profile.user_createdAt ? (profile.user_createdAt instanceof Date ? profile.user_createdAt.toISOString() : String(profile.user_createdAt)) : null,
      };

      // Enforce contact permissions
      if (contactPermission === 'none') {
        // Ghost Mode - hide all contact info
        member.email = null;
        member.phone = null;
        member.linkedin = null;
        member.instagram = null;
        member.facebook = null;
      } else if (contactPermission === 'year-group') {
        // Year-group only - show contact info only to same year
        if (requestingUserYear === profile.year) {
          member.email = profile.user_email || profile.email;
          member.phone = profile.phone;
          member.linkedin = profile.linkedin;
          member.instagram = profile.instagram;
          member.facebook = profile.facebook;
        } else {
          // Different year - hide contact info
          member.email = null;
          member.phone = null;
          member.linkedin = null;
          member.instagram = null;
          member.facebook = null;
        }
      } else {
        // 'all' - show everything
        member.email = profile.user_email || profile.email;
        member.phone = profile.phone;
        member.linkedin = profile.linkedin;
        member.instagram = profile.instagram;
        member.facebook = profile.facebook;
      }

      return member;
    });

    // Filter out ghost mode members from count (but still include them in list with hidden contact info)
    const visibleMembers = members.filter((m: any) => m.contactPermission !== 'none');

    return res.json({
      year,
      totalMembers: visibleMembers.length,
      members,
    });
  } catch (error: any) {
    logger.error('Get year group members error:', error);
    logger.error('Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Failed to get year group members',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/year-groups/:year
 * Get year group by year (public)
 * Uses raw SQL for reliability and performance
 */
router.get('/:year', optionalAuth, async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({
        error: 'Invalid year',
        details: 'Year must be a valid number',
      });
    }

    // Use raw SQL query for reliability
    const yearGroups = await sequelize.query(`
      SELECT 
        id,
        year,
        yearInfo,
        whatsappLink,
        photos,
        groupPhoto,
        createdAt,
        updatedAt
      FROM year_groups
      WHERE year = :year
    `, {
      replacements: { year },
      type: QueryTypes.SELECT,
    }) as any[];

    if (!yearGroups || yearGroups.length === 0) {
      return res.status(404).json({
        error: 'Year group not found',
        details: `Year group for ${year} does not exist`,
      });
    }

    const yearGroup = yearGroups[0];
    
    // Parse photos if it's a JSON string
    let photos: string[] | null = null;
    if (yearGroup.photos) {
      if (typeof yearGroup.photos === 'string') {
        try {
          photos = JSON.parse(yearGroup.photos);
        } catch {
          photos = null;
        }
      } else if (Array.isArray(yearGroup.photos)) {
        photos = yearGroup.photos;
      }
    }

    // Format the response
    return res.json({
      id: String(yearGroup.id),
      year: Number(yearGroup.year),
      yearInfo: yearGroup.yearInfo || null,
      whatsappLink: yearGroup.whatsappLink || null,
      photos: photos,
      groupPhoto: yearGroup.groupPhoto || null,
      createdAt: yearGroup.createdAt instanceof Date
        ? yearGroup.createdAt.toISOString()
        : yearGroup.createdAt ? String(yearGroup.createdAt)
        : new Date().toISOString(),
      updatedAt: yearGroup.updatedAt instanceof Date
        ? yearGroup.updatedAt.toISOString()
        : yearGroup.updatedAt ? String(yearGroup.updatedAt)
        : new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Get year group error:', error);
    return res.status(500).json({
      error: 'Failed to get year group',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/year-groups
 * Create a new year group (admin only)
 */
router.post('/', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const validatedData = yearGroupSchema.parse(req.body);
    
    // Check if year group already exists
    const existing = await YearGroup.findOne({ where: { year: validatedData.year } });
    if (existing) {
      return res.status(400).json({
        error: 'Year group already exists',
        details: `Year group for ${validatedData.year} already exists`,
      });
    }

    const yearGroup = await YearGroup.create({
      year: validatedData.year,
      groupPhoto: validatedData.groupPhoto || validatedData.photos?.[0] || undefined, // Use first photo as groupPhoto for backward compatibility
      photos: validatedData.photos || undefined,
      yearInfo: validatedData.yearInfo || undefined,
      whatsappLink: validatedData.whatsappLink || undefined,
    });

    return res.status(201).json(yearGroup);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Create year group error:', error);
    return res.status(500).json({
      error: 'Failed to create year group',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/year-groups/:year
 * Update a year group (admin only)
 */
router.patch('/:year', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({
        error: 'Invalid year',
        details: 'Year must be a valid number',
      });
    }

    const yearGroup = await YearGroup.findOne({ where: { year } });
    if (!yearGroup) {
      return res.status(404).json({
        error: 'Year group not found',
        details: `Year group for ${year} does not exist`,
      });
    }

    // Validate update data (make all fields optional for update)
    const updateSchema = yearGroupSchema.partial();
    const validatedData = updateSchema.parse(req.body);

    // Update year group
    const updateData: any = {};
    if (validatedData.photos !== undefined) {
      updateData.photos = validatedData.photos || [];
      // Also update groupPhoto with first photo for backward compatibility
      updateData.groupPhoto = validatedData.photos?.[0] || validatedData.groupPhoto || undefined;
    } else if (validatedData.groupPhoto !== undefined) {
      updateData.groupPhoto = validatedData.groupPhoto || undefined;
    }
    if (validatedData.yearInfo !== undefined) {
      updateData.yearInfo = validatedData.yearInfo || undefined;
    }
    if (validatedData.whatsappLink !== undefined) {
      updateData.whatsappLink = validatedData.whatsappLink || undefined;
    }
    await yearGroup.update(updateData);

    // Reload to get updated data
    await yearGroup.reload();

    return res.json(yearGroup);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Update year group error:', error);
    return res.status(500).json({
      error: 'Failed to update year group',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/year-groups/:year
 * Delete a year group (admin only)
 */
router.delete('/:year', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({
        error: 'Invalid year',
        details: 'Year must be a valid number',
      });
    }

    const yearGroup = await YearGroup.findOne({ where: { year } });
    if (!yearGroup) {
      return res.status(404).json({
        error: 'Year group not found',
        details: `Year group for ${year} does not exist`,
      });
    }

    await yearGroup.destroy();

    return res.json({ message: 'Year group deleted successfully' });
  } catch (error: any) {
    logger.error('Delete year group error:', error);
    return res.status(500).json({
      error: 'Failed to delete year group',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

