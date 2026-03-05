import { Router, Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Profile from '../models/Profile';
import { authenticate } from '../middleware/auth';
import { processImages } from '../middleware/imageProcessor';
import logger from '../utils/logger';

const router = Router();

// Helper to transform empty strings to null and validate URLs
const optionalUrl = z.string().optional().nullable()
  .transform(val => !val || val.trim() === '' ? null : val.trim())
  .refine(val => val === null || z.string().url().safeParse(val).success, {
    message: 'Invalid URL format'
  });

// Validation schema for profile update
const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  bio: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  contactPermission: z.enum(['all', 'year-group', 'none']).optional(),
  linkedin: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  thenPhoto: z.string().optional().nullable(), // Base64 string
  nowPhoto: z.string().optional().nullable(), // Base64 string
  verificationStatus: z.enum(['pending', 'verified']).optional().nullable(),
  // REMOVED: securityQuestion and securityAnswer - no longer needed
});

/**
 * GET /api/alumni/me
 * Get current user's profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Find user - explicitly specify attributes
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'name', 'role', 'isMember', 'monthlyAmount', 'createdAt', 'updatedAt']
    });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account does not exist',
      });
    }

    // Get profile - explicitly specify attributes (security fields removed)
    const profile = await Profile.findOne({
      where: { userId: user.id },
      attributes: ['id', 'userId', 'name', 'year', 'bio', 'thenPhoto', 'nowPhoto', 'linkedin', 'instagram', 'facebook', 'email', 'phone', 'contactPermission', 'verificationStatus', 'createdAt', 'updatedAt']
    });

    // Build user data - ensure all values are JSON-serializable
    const userData: any = {
      id: String(user.id),
      email: String(user.email),
      name: String(user.name),
      role: String(user.role),
      isMember: Boolean(user.isMember),
      monthlyAmount: user.monthlyAmount != null ? parseFloat(String(user.monthlyAmount)) : null,
    };

    if (profile) {
      userData.profile = {
        id: String(profile.id),
        name: profile.name || null,
        year: profile.year != null ? Number(profile.year) : null,
        bio: profile.bio || null,
        thenPhoto: profile.thenPhoto || null,
        nowPhoto: profile.nowPhoto || null,
        linkedin: profile.linkedin || null,
        instagram: profile.instagram || null,
        facebook: profile.facebook || null,
        email: profile.email || null,
        phone: profile.phone || null,
        contactPermission: profile.contactPermission || null,
        verificationStatus: profile.verificationStatus || null,
      };
    } else {
      userData.profile = null;
    }

    return res.json(userData);
  } catch (error: any) {
    logger.error('Get user error:', error);
    return res.status(500).json({
      error: 'Failed to get user',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/alumni/me/profile
 * Get current user's profile only
 */
router.get('/me/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const profile = await Profile.findOne({
      where: { userId },
      attributes: ['id', 'userId', 'name', 'year', 'bio', 'thenPhoto', 'nowPhoto', 'linkedin', 'instagram', 'facebook', 'email', 'phone', 'contactPermission', 'verificationStatus', 'createdAt', 'updatedAt']
    });

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        details: 'Profile does not exist for this user',
      });
    }

    return res.json({
      id: profile.id,
      name: profile.name,
      year: profile.year,
      bio: profile.bio,
      thenPhoto: profile.thenPhoto,
      nowPhoto: profile.nowPhoto,
      linkedin: profile.linkedin,
      instagram: profile.instagram,
      facebook: profile.facebook,
      email: profile.email,
      phone: profile.phone,
      contactPermission: profile.contactPermission,
      verificationStatus: profile.verificationStatus,
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    return res.status(500).json({
      error: 'Failed to get profile',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/alumni/me/profile
 * Create or update current user's profile
 */
router.post('/me/profile', authenticate, processImages, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Log incoming request for debugging
    logger.info('Profile update request:', { userId, bodyKeys: Object.keys(req.body) });

    // Validate input (allow partial updates)
    const validatedData = profileUpdateSchema.parse(req.body);
    logger.info('Validated profile data:', { userId, validatedKeys: Object.keys(validatedData) });

    // Find or create profile
    let profile = await Profile.findOne({ where: { userId } });

    if (profile) {
      // Update existing profile - convert null to undefined for Sequelize
      const updateData: any = {};
      if (validatedData.name !== undefined) updateData.name = validatedData.name;
      if (validatedData.year !== undefined) updateData.year = validatedData.year;
      if (validatedData.bio !== undefined) updateData.bio = validatedData.bio ?? null;
      if (validatedData.phone !== undefined) updateData.phone = validatedData.phone ?? null;
      if (validatedData.email !== undefined) updateData.email = validatedData.email ?? null;
      if (validatedData.contactPermission !== undefined) updateData.contactPermission = validatedData.contactPermission;
      if (validatedData.linkedin !== undefined) updateData.linkedin = validatedData.linkedin ?? null;
      if (validatedData.instagram !== undefined) updateData.instagram = validatedData.instagram ?? null;
      if (validatedData.facebook !== undefined) updateData.facebook = validatedData.facebook ?? null;
      if (validatedData.thenPhoto !== undefined) updateData.thenPhoto = validatedData.thenPhoto ?? null;
      if (validatedData.nowPhoto !== undefined) updateData.nowPhoto = validatedData.nowPhoto ?? null;
      if (validatedData.verificationStatus !== undefined) updateData.verificationStatus = validatedData.verificationStatus ?? null;

      logger.info('Profile update data:', { userId, updateKeys: Object.keys(updateData) });
      await profile.update(updateData);
    } else {
      // Create new profile
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'name', 'role', 'isMember', 'monthlyAmount']
      });
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          details: 'User account does not exist',
        });
      }

      const createData = {
        userId,
        name: validatedData.name || user.name,
        year: validatedData.year || new Date().getFullYear(),
        bio: validatedData.bio ?? undefined,
        phone: validatedData.phone ?? undefined,
        email: validatedData.email || user.email || undefined,
        contactPermission: validatedData.contactPermission || 'all',
        linkedin: validatedData.linkedin ?? undefined,
        instagram: validatedData.instagram ?? undefined,
        facebook: validatedData.facebook ?? undefined,
        thenPhoto: validatedData.thenPhoto ?? undefined,
        nowPhoto: validatedData.nowPhoto ?? undefined,
        verificationStatus: validatedData.verificationStatus ?? undefined,
      };
      logger.info('Creating new profile:', { userId, createKeys: Object.keys(createData) });
      profile = await Profile.create(createData);
    }

    // Return updated profile
    return res.json({
      id: profile.id,
      name: profile.name,
      year: profile.year,
      bio: profile.bio,
      thenPhoto: profile.thenPhoto,
      nowPhoto: profile.nowPhoto,
      linkedin: profile.linkedin,
      instagram: profile.instagram,
      facebook: profile.facebook,
      email: profile.email,
      phone: profile.phone,
      contactPermission: profile.contactPermission,
      verificationStatus: profile.verificationStatus,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Profile update error:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/alumni/me/profile
 * Partially update current user's profile
 */
router.patch('/me/profile', authenticate, processImages, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Validate input (allow partial updates)
    const validatedData = profileUpdateSchema.parse(req.body);

    // Find profile
    const profile = await Profile.findOne({
      where: { userId },
      attributes: ['id', 'userId', 'name', 'year', 'bio', 'thenPhoto', 'nowPhoto', 'linkedin', 'instagram', 'facebook', 'email', 'phone', 'contactPermission', 'verificationStatus', 'createdAt', 'updatedAt']
    });

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        details: 'Profile does not exist. Use POST to create it.',
      });
    }

    // Update profile with only provided fields - convert null to undefined for Sequelize
    const updateData: any = {};
    for (const key of Object.keys(validatedData)) {
      const value = (validatedData as any)[key];
      if (value !== undefined) {
        updateData[key] = value ?? null;
      }
    }
    logger.info('PATCH profile update:', { userId, updateKeys: Object.keys(updateData) });
    await profile.update(updateData);

    // Return updated profile
    return res.json({
      id: profile.id,
      name: profile.name,
      year: profile.year,
      bio: profile.bio,
      thenPhoto: profile.thenPhoto,
      nowPhoto: profile.nowPhoto,
      linkedin: profile.linkedin,
      instagram: profile.instagram,
      facebook: profile.facebook,
      email: profile.email,
      phone: profile.phone,
      contactPermission: profile.contactPermission,
      verificationStatus: profile.verificationStatus,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Profile update error:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

