import { Router, Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Profile from '../models/Profile';
import sequelize from '../db/connection';
import Notification from '../models/Notification';
import '../models'; // Import to register associations
import { hashPassword, comparePassword, compareSecurityAnswer } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import { processImages } from '../middleware/imageProcessor';
import logger from '../utils/logger';
import { sendPushToAdmins } from '../utils/push';

const router = Router();

// Password complexity regex: at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(passwordComplexityRegex, 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)'),
  name: z.string().min(1, 'Name is required'),
  // Optional profile fields - allows mobile to send all profile data in single registration call
  year: z.number().int().min(1900).max(2100).optional(),
  bio: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  contactPermission: z.enum(['all', 'year-group', 'none']).optional(),
  linkedin: z.string().optional().nullable().transform(v => !v || v.trim() === '' ? null : v),
  instagram: z.string().optional().nullable().transform(v => !v || v.trim() === '' ? null : v),
  facebook: z.string().optional().nullable().transform(v => !v || v.trim() === '' ? null : v),
  thenPhoto: z.string().optional().nullable(),
  nowPhoto: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Register a new user with optional profile data
 * Mobile apps can send full profile data in a single call to avoid two-step registration issues
 */
router.post('/register', processImages, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name } = validatedData;

    // Check if user already exists with timeout (8 seconds max)
    const existingUserQuery = User.findOne({ 
      where: { email },
      attributes: ['id', 'email']
    });
    const timeoutPromise1 = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 8000)
    );
    const existingUser = await Promise.race([existingUserQuery, timeoutPromise1]) as any;
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        details: 'An account with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and profile in a transaction to ensure atomicity
    const transaction = await sequelize.transaction();
    let user: any;

    try {
      // Create user with timeout (8 seconds max)
      const createUserQuery = User.create({
          email,
          password: hashedPassword,
          name,
        role: 'alumni',
        isMember: false,
      }, { transaction });
      const createTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database create timeout')), 8000)
      );
      user = await Promise.race([createUserQuery, createTimeout]) as any;

      // Create profile with all provided data (supports single-call registration from mobile)
      // Timeout extended to 10 seconds to allow for image processing
      const profileData: any = {
        userId: String(user.id),
        name,
        year: validatedData.year || new Date().getFullYear(),
        email: email, // Use account email as profile email
        contactPermission: validatedData.contactPermission || 'all',
      };
      // Only add optional fields if they have values (avoid null assignments)
      if (validatedData.bio) profileData.bio = validatedData.bio;
      if (validatedData.phone) profileData.phone = validatedData.phone;
      if (validatedData.linkedin) profileData.linkedin = validatedData.linkedin;
      if (validatedData.instagram) profileData.instagram = validatedData.instagram;
      if (validatedData.facebook) profileData.facebook = validatedData.facebook;
      if (validatedData.thenPhoto) profileData.thenPhoto = validatedData.thenPhoto;
      if (validatedData.nowPhoto) profileData.nowPhoto = validatedData.nowPhoto;

      const createProfileQuery = Profile.create(profileData, { transaction });
      const profileCreateTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile create timeout')), 10000)
      );
      await Promise.race([createProfileQuery, profileCreateTimeout]);

      // Commit the transaction
      await transaction.commit();
    } catch (transactionError) {
      // Rollback on any error - ensures no orphaned users
      await transaction.rollback();
      throw transactionError;
    }

    // Generate token
    const token = generateToken({
      userId: String(user.id),
      email: user.email,
      role: user.role,
    });

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isMember: user.isMember,
    };

    return res.status(201).json({
      user: userData,
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    // Handle timeout errors specifically
    if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
      logger.error('❌ REGISTRATION TIMEOUT - Database connection is slow or unavailable');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Database connection timeout. Please try again in a moment.',
      });
    }

    logger.error('Registration error:', error);
    return res.status(500).json({
      error: 'Failed to register user',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    logger.info('🔐 Login attempt:', { email: req.body.email });
    
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    logger.debug('✅ Input validated, searching for user...');
    
    // Find user with timeout (8 seconds max)
    const userQuery = User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'name', 'role', 'isMember', 'monthlyAmount', 'createdAt', 'updatedAt']
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 8000)
    );
    
    const user = await Promise.race([userQuery, timeoutPromise]) as any;
    if (!user) {
      logger.warn('❌ User not found:', email);
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect',
      });
    }

    logger.debug('✅ User found:', { id: user.id, email: user.email, role: user.role });

    // Verify password
    logger.debug('🔒 Verifying password...');
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn('❌ Invalid password for user:', email);
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect',
      });
    }

    logger.debug('✅ Password verified');

    logger.debug('🎫 Generating token...');
    
    // Generate token
    const token = generateToken({
      userId: String(user.id),
      email: user.email,
      role: user.role,
    });

    logger.debug('✅ Token generated');

    // Get user profile if exists with timeout (5 seconds max)
    logger.debug('👤 Fetching profile...');
    let profile = null;
    try {
      const profileQuery = Profile.findOne({ 
        where: { userId: user.id },
        attributes: ['id', 'userId', 'name', 'year', 'bio', 'thenPhoto', 'nowPhoto', 'linkedin', 'instagram', 'facebook', 'email', 'phone', 'contactPermission', 'verificationStatus', 'securityQuestion', 'createdAt', 'updatedAt']
      });
      const profileTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 5000)
      );
      profile = await Promise.race([profileQuery, profileTimeout]) as any;
      logger.debug('✅ Profile fetched:', profile ? 'found' : 'not found');
    } catch (profileError: any) {
      logger.warn('⚠️  Profile fetch error (non-fatal):', profileError.message);
      // Continue without profile
    }

    // Return user data (without password)
    // Convert all values to JSON-serializable types
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
        year: profile.year || null,
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
        securityQuestion: profile.securityQuestion || null,
        // Don't return securityAnswer for security reasons
      };
    }

    logger.info('✅ Login successful for:', email);
    
    return res.json({
      user: userData,
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    // Handle timeout errors specifically
    if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
      logger.error('❌ LOGIN TIMEOUT - Database connection is slow or unavailable');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Database connection timeout. Please try again in a moment.',
      });
    }

    // Log the FULL error for debugging (sanitized in production)
    logger.error('❌ LOGIN ERROR:', error);
    logger.error('❌ Error message:', error?.message);
    logger.error('❌ Error name:', error?.name);
    logger.error('❌ Error code:', error?.code);
    logger.error('❌ Error number:', (error as any)?.original?.number);
    logger.error('❌ SQL Error:', (error as any)?.original?.message);
    logger.debug('❌ SQL Query:', (error as any)?.sql);
    logger.debug('❌ Error stack:', error?.stack);

    // Never expose internal error details in responses
    // All error details are logged server-side for debugging
    return res.status(500).json({
      error: 'Failed to login',
      details: 'An unexpected error occurred. Please try again.',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
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

    // Get profile separately - explicitly specify attributes
    const profile = await Profile.findOne({ 
      where: { userId: user.id },
      attributes: ['id', 'userId', 'name', 'year', 'bio', 'thenPhoto', 'nowPhoto', 'linkedin', 'instagram', 'facebook', 'email', 'phone', 'contactPermission', 'verificationStatus', 'securityQuestion', 'createdAt', 'updatedAt']
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
        securityQuestion: profile.securityQuestion || null,
        // Don't return securityAnswer for security reasons
      };
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
 * POST /api/auth/check-user
 * Check if user exists (for registration flow)
 */
router.post('/check-user', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
      return res.status(400).json({
        error: 'Email required',
        details: 'Email address is required',
      });
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email']
    });
    return res.json({ exists: !!user });
  } catch (error: any) {
    logger.error('Check user error:', error);
    return res.status(500).json({
      error: 'Failed to check user',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/forgot-password/get-question
 * Get security question for forgot password flow
 */
router.post('/forgot-password/get-question', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        details: 'Email address is required',
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email']
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(404).json({
        error: 'User not found',
        details: 'No account found with this email address',
      });
    }

    // Get profile with security question
    const profile = await Profile.findOne({
      where: { userId: user.id },
      attributes: ['id', 'securityQuestion', 'securityAnswer']
    });

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        details: 'Profile does not exist for this user',
      });
    }

    if (!profile.securityQuestion) {
      return res.status(404).json({
        error: 'Security question not set',
        details: 'Please contact admin to reset your password',
      });
    }

    return res.json({
      email: user.email,
      securityQuestion: profile.securityQuestion,
    });
  } catch (error: any) {
    logger.error('Get security question error:', error);
    logger.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to get security question',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/forgot-password/verify-answer
 * Verify security answer for forgot password
 */
router.post('/forgot-password/verify-answer', async (req: Request, res: Response) => {
  try {
    const { email, securityAnswer } = req.body;

    if (!email || !securityAnswer) {
      return res.status(400).json({
        error: 'Email and security answer required',
        details: 'Both email and security answer are required',
      });
    }

    // Find user with full details
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'name', 'role', 'isMember', 'monthlyAmount']
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'No account found with this email address',
      });
    }

    // Get profile with security answer
    const profile = await Profile.findOne({
      where: { userId: user.id },
      attributes: ['id', 'userId', 'name', 'year', 'bio', 'thenPhoto', 'nowPhoto', 'linkedin', 'instagram', 'facebook', 'email', 'phone', 'contactPermission', 'verificationStatus', 'securityAnswer']
    });

    if (!profile || !profile.securityAnswer) {
      return res.status(404).json({
        error: 'Security answer not set',
        details: 'Please contact admin to reset your password',
      });
    }

    // Compare answers using bcrypt (security answers are now hashed)
    // Normalize input: lowercase and trim before comparing
    const normalizedAnswer = securityAnswer.toLowerCase().trim();
    const isCorrect = await compareSecurityAnswer(normalizedAnswer, profile.securityAnswer);

    if (isCorrect) {
      // Answer is correct - generate token and log user in
      const token = generateToken({
        userId: String(user.id),
        email: user.email,
        role: user.role,
      });

      // Build user data (similar to login response)
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
      }

      logger.info(`Security answer verified - logging in user: ${user.email}`);

      return res.json({
        success: true,
        message: 'Security answer verified. You have been logged in successfully.',
        token,
        user: userData,
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Incorrect security answer',
        details: 'The security answer you provided is incorrect',
      });
    }
  } catch (error: any) {
    logger.error('Verify security answer error:', error);
    return res.status(500).json({
      error: 'Failed to verify security answer',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/auth/change-password
 * Change user password (requires current password)
 */
router.patch('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing information',
        details: 'Both current password and new password are required',
      });
    }

    if (newPassword.length < 12) {
      return res.status(400).json({
        error: 'Invalid password',
        details: 'New password must be at least 12 characters long',
      });
    }

    // Validate password complexity
    if (!passwordComplexityRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Invalid password',
        details: 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)',
      });
    }

    // Find user with password
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'password']
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account does not exist',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Incorrect password',
        details: 'The current password you entered is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await user.update({
      password: hashedPassword,
    });

    logger.info(`Password changed for user: ${user.email}`);

    return res.json({
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    logger.error('Change password error:', error);
    return res.status(500).json({
      error: 'Failed to change password',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/forgot-details
 * Request password reset (user forgot their details)
 */
router.post('/forgot-details', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        details: 'Email address is required',
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'name', 'hasPasswordResetRequest']
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        message: 'If an account exists with this email, an admin will be notified to reset your password.',
      });
    }

    // Set password reset request flag
    await user.update({ hasPasswordResetRequest: true });

    // Create notification for all admins
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id']
    });

    // Create notification for each admin
    await Promise.all(admins.map(admin =>
      Notification.create({
        userId: String(admin.id),
        type: 'password-reset',
        title: 'Password Reset Request',
        message: `${user.name} (${user.email}) has forgotten their login details and requested a password reset.`,
        read: false,
        timestamp: new Date(),
      } as any)
    ));

    // Send push notification to admins
    sendPushToAdmins({
      title: 'Password Reset Request',
      body: `${user.name} (${user.email}) requested a password reset.`,
      data: {
        type: 'password-reset',
        url: '/admin?tab=users',
      },
    }).catch((err) => logger.warn('Failed to send push to admins:', err.message));

    logger.info(`Password reset requested for user: ${user.email}`);

    return res.json({
      message: 'Your request has been sent to the administrators. They will send you a new password.',
    });
  } catch (error: any) {
    logger.error('Forgot details error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/auth/delete-account
 * Permanently delete user account (requires authentication)
 */
router.delete('/delete-account', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password required',
        details: 'Please enter your password to confirm account deletion',
      });
    }

    // Find user with password
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'password', 'name']
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account does not exist',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Incorrect password',
        details: 'The password you entered is incorrect',
      });
    }

    // Delete profile first (due to foreign key constraint)
    await Profile.destroy({ where: { userId: user.id } });

    // Delete notifications
    await Notification.destroy({ where: { userId: user.id } });

    // Delete the user
    await user.destroy();

    logger.info(`Account deleted for user: ${user.email}`);

    return res.json({
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete account error:', error);
    return res.status(500).json({
      error: 'Failed to delete account',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

