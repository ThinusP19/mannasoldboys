import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import Profile from '../models/Profile';
import Notification from '../models/Notification';
import MembershipRequest from '../models/MembershipRequest';
import Story from '../models/Story';
import Memorial from '../models/Memorial';
import Reunion from '../models/Reunion';
import Project from '../models/Project';
import YearGroup from '../models/YearGroup';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { hashPassword } from '../utils/password';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/admin/verify
 * Verify admin token is valid - called by frontend to validate admin session
 * This endpoint verifies the token AND checks if user is still an admin
 */
router.get('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Invalid or expired token',
      });
    }

    // Check if user exists and is still an admin
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'name', 'role']
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'User not found',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'Admin access revoked',
      });
    }

    // Admin session is valid
    return res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    logger.error('Admin verify error:', error);
    return res.status(500).json({
      error: 'Failed to verify admin session',
      details: 'Internal server error',
    });
  }
});

// All subsequent routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics (admin only)
 * Returns accurate counts directly from the database
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Get all counts in parallel from database
    const [
      totalUsers,
      totalMembers,
      pendingMembers,
      totalStories,
      totalMemorials,
      totalReunions,
      totalProjects,
      totalYearGroups,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isMember: true } }),
      MembershipRequest.count({ where: { status: 'pending' } }),
      Story.count(),
      Memorial.count(),
      Reunion.count(),
      Project.count(),
      YearGroup.count(),
    ]);

    return res.json({
      totalUsers,
      totalMembers,
      pendingMembers,
      totalStories,
      totalMemorials,
      totalReunions,
      totalProjects,
      totalYearGroups,
    });
  } catch (error: any) {
    logger.error('Get stats error:', error);
    return res.status(500).json({
      error: 'Failed to get stats',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users (admin only) with pagination
 * Fixed N+1 query by using eager loading with include
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    // Pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Use eager loading to avoid N+1 query problem
    const { rows: users, count: total } = await User.findAndCountAll({
      attributes: ['id', 'email', 'name', 'role', 'isMember', 'monthlyAmount', 'hasPasswordResetRequest', 'createdAt', 'updatedAt'],
      include: [{
        model: Profile,
        as: 'profile',
        attributes: ['id', 'name', 'year', 'phone'],
        required: false, // LEFT JOIN - users without profiles still returned
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Format the response
    const usersData = users.map((user: any) => {
      const userData: any = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isMember: user.isMember,
        monthlyAmount: user.monthlyAmount ? parseFloat(user.monthlyAmount.toString()) : undefined,
        hasPasswordResetRequest: user.hasPasswordResetRequest || false,
        createdAt: user.createdAt,
      };

      if (user.profile) {
        userData.profile = {
          id: user.profile.id,
          year: user.profile.year,
          name: user.profile.name,
          phone: user.profile.phone,
        };
      }

      return userData;
    });

    return res.json({
      data: usersData,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Get users error:', error);
    return res.status(500).json({
      error: 'Failed to get users',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/admin/users/:id/member
 * Update user membership status (admin only)
 */
router.patch('/users/:id/member', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isMember, monthlyAmount } = req.body;

    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role', 'isMember', 'monthlyAmount', 'createdAt', 'updatedAt']
    });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User does not exist',
      });
    }

    const updateData: any = {
      isMember: isMember === true || isMember === 'true',
    };
    if (monthlyAmount) {
      const amount = parseFloat(monthlyAmount);
      // Validate amount range
      if (isNaN(amount) || amount < 0 || amount > 1000000) {
        return res.status(400).json({
          error: 'Invalid amount',
          details: 'Monthly amount must be between 0 and 1,000,000',
        });
      }
      updateData.monthlyAmount = amount;
    } else {
      updateData.monthlyAmount = undefined;
    }
    await user.update(updateData);

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isMember: user.isMember,
      monthlyAmount: user.monthlyAmount ? parseFloat(user.monthlyAmount.toString()) : undefined,
    });
  } catch (error: any) {
    logger.error('Update user membership error:', error);
    return res.status(500).json({
      error: 'Failed to update user membership',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/admin/users/:id/reset-password
 * Reset user password (admin only)
 */
router.patch('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate password length
    if (!newPassword || newPassword.length < 12) {
      return res.status(400).json({
        error: 'Invalid password',
        details: 'Password must be at least 12 characters long',
      });
    }

    // Validate password complexity
    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordComplexityRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Invalid password',
        details: 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)',
      });
    }

    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'hasPasswordResetRequest']
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User does not exist',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset request flag
    await user.update({
      password: hashedPassword,
      hasPasswordResetRequest: false,
    });

    // Create notification for user
    await Notification.create({
      userId: String(user.id),
      type: 'password-reset',
      title: 'Password Reset',
      message: 'Your password has been reset by an administrator. Please log in with your new password.',
      read: false,
      timestamp: new Date(),
    } as any);

    // Delete password reset notifications for admins related to this user
    await Notification.destroy({
      where: {
        type: 'password-reset',
        message: {
          [Op.like]: `%${user.email}%`
        }
      }
    });

    logger.info(`Password reset by admin for user: ${user.email}`);

    return res.json({
      message: 'Password reset successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    logger.error('Reset password error:', error);
    return res.status(500).json({
      error: 'Failed to reset password',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user from the database (admin only)
 * Cannot delete admin users
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role'],
      include: [{
        model: Profile,
        as: 'profile',
        required: false,
      }],
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User does not exist',
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        error: 'Cannot delete admin',
        details: 'Admin users cannot be deleted',
      });
    }

    const userEmail = user.email;
    const userName = user.name;

    // Delete associated profile first if exists
    if ((user as any).profile) {
      await Profile.destroy({ where: { userId: id } });
    }

    // Delete associated notifications
    await Notification.destroy({ where: { userId: id } });

    // Delete the user
    await user.destroy();

    logger.info(`User deleted by admin: ${userEmail}`);

    return res.json({
      message: 'User deleted successfully',
      user: {
        id,
        email: userEmail,
        name: userName,
      },
    });
  } catch (error: any) {
    logger.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Failed to delete user',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

