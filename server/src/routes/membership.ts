import express, { Request, Response } from 'express';
import { z } from 'zod';
import { QueryTypes } from 'sequelize';
import MembershipRequest from '../models/MembershipRequest';
import User from '../models/User';
import Notification from '../models/Notification';
import sequelize from '../db/connection';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import logger from '../utils/logger';
import { sendPushToUser, sendPushToAdmins } from '../utils/push';

const router = express.Router();

// Validation schemas
const phoneRegex = /^[+]?[\d\s-]{10,20}$/;

const membershipRequestSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number too long')
    .regex(phoneRegex, 'Phone must contain only digits, spaces, dashes, or + prefix'),
  whatsapp: z.string()
    .min(10, 'WhatsApp number must be at least 10 digits')
    .max(20, 'WhatsApp number too long')
    .regex(phoneRegex, 'WhatsApp must contain only digits, spaces, dashes, or + prefix'),
  monthlyAmount: z.number()
    .min(75, 'Minimum budget is ZAR 75 per month')
    .max(100000, 'Maximum budget is ZAR 100,000 per month'),
});

const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500, 'Rejection reason too long').optional(),
  monthlyAmount: z.number()
    .min(75)
    .max(100000, 'Maximum budget is ZAR 100,000')
    .optional(), // Final amount admin enters
});

// POST /api/membership/request - Submit a membership request (authenticated users only)
router.post('/request', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Validate request body
    const validatedData = membershipRequestSchema.parse(req.body);

    // Check if user already has a pending request
    const pendingRequest = await MembershipRequest.findOne({
      where: {
        userId,
        status: 'pending'
      },
      attributes: ['id', 'userId', 'status']
    });

    if (pendingRequest) {
      return res.status(400).json({
        error: 'You already have a pending membership request'
      });
    }

    // Check if user is currently an active member
    // This allows deactivated members (isMember = false) to re-apply
    const user = await User.findByPk(userId, {
      attributes: ['id', 'isMember']
    });

    if (user?.isMember) {
      return res.status(400).json({
        error: 'You already have an active membership'
      });
    }

    // Create membership request
    const membershipRequest = await MembershipRequest.create({
      userId,
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      whatsapp: validatedData.whatsapp,
      requestedPlan: 'custom' as any, // Default to 'custom' since we're using custom amounts
      monthlyAmount: validatedData.monthlyAmount,
      status: 'pending',
      requestedDate: new Date(),
    });

    // Notify admins about new membership request via push
    sendPushToAdmins({
      title: 'New Membership Request',
      body: `${validatedData.fullName} has submitted a membership request.`,
      data: {
        type: 'membership-request',
        url: '/admin?tab=membership',
      },
    }).catch((err) => logger.warn('Failed to send push to admins:', err.message));

    return res.status(201).json({
      message: 'Membership request submitted successfully! An admin will contact you soon.',
      request: membershipRequest,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
    logger.error('Error creating membership request:', error);
    logger.error('Error message:', error?.message);
    logger.error('Error name:', error?.name);
    logger.error('SQL Error:', (error as any)?.original?.message);
    logger.error('SQL Query:', (error as any)?.sql);
    logger.error('Error stack:', error?.stack);
    
    // Check if table doesn't exist
    if (error?.original?.message?.includes('Invalid object name') || 
        error?.message?.includes('Invalid object name')) {
      return res.status(500).json({ 
        error: 'Database table not found',
        details: 'The membership_requests table does not exist. Please run database sync.',
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to submit membership request',
      details: error?.message || 'Internal server error',
    });
  }
});

// GET /api/membership/requests - Get all membership requests (admin only)
// Uses raw SQL to avoid getter/setter circular issues
router.get('/requests', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    // Build WHERE clause for status filter
    let whereClause = '';
    const replacements: any = {};
    
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      whereClause = 'WHERE mr.status = :status';
      replacements.status = status;
    }

    // Check if table exists first, if not return empty array
    try {
      // Use raw SQL query to avoid getter/setter circular issues
      const requests = await sequelize.query(`
        SELECT 
          mr.id,
          mr.userId,
          mr.fullName,
          mr.email,
          mr.phone,
          mr.whatsapp,
          mr.requestedPlan,
          mr.monthlyAmount,
          mr.status,
          mr.requestedDate,
          mr.approvedDate,
          mr.approvedBy,
          mr.rejectionReason,
          mr.createdAt,
          mr.updatedAt,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.role as user_role,
          u.isMember as user_isMember
        FROM membership_requests mr
        LEFT JOIN users u ON mr.userId = u.id
        ${whereClause}
        ORDER BY mr.requestedDate DESC
      `, {
        replacements,
        type: QueryTypes.SELECT,
      }) as any[];

      // Format the response
      const requestsData = requests.map((request: any) => {
        // Format dates
        const requestedDateStr = request.requestedDate instanceof Date
          ? request.requestedDate.toISOString()
          : request.requestedDate ? String(request.requestedDate)
          : null;
        
        const approvedDateStr = request.approvedDate instanceof Date
          ? request.approvedDate.toISOString()
          : request.approvedDate ? String(request.approvedDate)
          : null;
        
        const createdAtStr = request.createdAt instanceof Date
          ? request.createdAt.toISOString()
          : request.createdAt ? String(request.createdAt)
          : new Date().toISOString();
        
        const updatedAtStr = request.updatedAt instanceof Date
          ? request.updatedAt.toISOString()
          : request.updatedAt ? String(request.updatedAt)
          : new Date().toISOString();
        
        // Build user data object
        const userData = request.user_id ? {
          id: String(request.user_id),
          name: request.user_name || '',
          email: request.user_email || '',
          role: request.user_role || '',
          isMember: Boolean(request.user_isMember),
        } : null;
        
        return {
          id: String(request.id),
          userId: request.userId ? String(request.userId) : null,
          fullName: String(request.fullName || ''),
          email: String(request.email || ''),
          phone: request.phone ? String(request.phone) : null,
          whatsapp: request.whatsapp ? String(request.whatsapp) : null,
          requestedPlan: request.requestedPlan ? String(request.requestedPlan) : null,
          monthlyAmount: request.monthlyAmount != null ? Number(request.monthlyAmount) : null,
          status: String(request.status || 'pending'),
          requestedDate: requestedDateStr,
          approvedDate: approvedDateStr,
          approvedBy: request.approvedBy ? String(request.approvedBy) : null,
          rejectionReason: request.rejectionReason ? String(request.rejectionReason) : null,
          createdAt: createdAtStr,
          updatedAt: updatedAtStr,
          user: userData,
        };
      });

      return res.json(requestsData);
    } catch (tableError: any) {
      // If table doesn't exist, return empty array instead of error
      if (tableError?.original?.message?.includes('Invalid object name') || 
          tableError?.message?.includes('Invalid object name')) {
        logger.warn('Membership requests table does not exist yet. Returning empty array.');
        return res.json([]);
      }
      throw tableError; // Re-throw if it's a different error
    }
  } catch (error: any) {
    logger.error('Error fetching membership requests:', error);
    logger.error('Error message:', error?.message);
    logger.error('Error name:', error?.name);
    logger.error('SQL Error:', (error as any)?.original?.message);
    logger.error('SQL Query:', (error as any)?.sql);
    logger.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch membership requests',
      details: error?.message || 'Internal server error',
    });
  }
});

// GET /api/membership/my-request - Get current user's membership request
router.get('/my-request', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const request = await MembershipRequest.findOne({
      where: { userId },
      attributes: ['id', 'userId', 'fullName', 'email', 'phone', 'whatsapp', 'requestedPlan', 'monthlyAmount', 'status', 'requestedDate', 'approvedDate', 'approvedBy', 'rejectionReason', 'createdAt', 'updatedAt'],
      order: [['requestedDate', 'DESC']],
    });

    if (!request) {
      return res.status(404).json({ error: 'No membership request found' });
    }

    return res.json(request);
  } catch (error: any) {
    logger.error('Error fetching user membership request:', error);
    return res.status(500).json({ error: 'Failed to fetch membership request' });
  }
});

// PATCH /api/membership/requests/:id - Approve or reject a membership request (admin only)
router.patch('/requests/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.userId;

    // Validate request body
    const validatedData = approvalSchema.parse(req.body);

    // Find the membership request
    const membershipRequest = await MembershipRequest.findByPk(id, {
      attributes: ['id', 'userId', 'fullName', 'email', 'phone', 'whatsapp', 'requestedPlan', 'monthlyAmount', 'status', 'requestedDate', 'approvedDate', 'approvedBy', 'rejectionReason', 'createdAt', 'updatedAt']
    });

    if (!membershipRequest) {
      return res.status(404).json({ error: 'Membership request not found' });
    }

    if (membershipRequest.status !== 'pending') {
      return res.status(400).json({
        error: `This request has already been ${membershipRequest.status}`
      });
    }

    // Update membership request status
    membershipRequest.status = validatedData.status;
    membershipRequest.approvedBy = adminId;
    membershipRequest.approvedDate = new Date();

    if (validatedData.status === 'rejected' && validatedData.rejectionReason) {
      membershipRequest.rejectionReason = validatedData.rejectionReason;
    }

    await membershipRequest.save();

    // If approved, update the User model and create notification
    if (validatedData.status === 'approved') {
      const user = await User.findByPk(membershipRequest.userId, {
        attributes: ['id', 'email', 'name', 'role', 'isMember', 'monthlyAmount', 'createdAt', 'updatedAt']
      });

      if (user) {
        // Use the final amount entered by admin, or fall back to requested amount
        const finalAmount = validatedData.monthlyAmount || membershipRequest.monthlyAmount;
        
        // Update user membership status
        await user.update({
          isMember: true,
          monthlyAmount: finalAmount,
        });

        // Create notification for the user
        await Notification.create({
          userId: String(user.id),
          type: 'member',
          title: 'Membership Approved! 🎉',
          message: `Congratulations! Your membership request has been approved. You now have full access to all member features. Your monthly contribution is ZAR ${validatedData.monthlyAmount || membershipRequest.monthlyAmount}.`,
          read: false,
          timestamp: new Date(),
        } as any);

        // Send push notification to user
        sendPushToUser(String(user.id), {
          title: 'Membership Approved!',
          body: 'Congratulations! Your membership request has been approved.',
          data: {
            type: 'membership-approved',
            url: '/notifications',
          },
        }).catch((err) => logger.warn('Failed to send push to user:', err.message));

        logger.info(`User ${user.email} membership approved and notification sent`);
      }
    } else if (validatedData.status === 'rejected') {
      // Create rejection notification
      const user = await User.findByPk(membershipRequest.userId, {
        attributes: ['id', 'email', 'name', 'role', 'isMember', 'monthlyAmount', 'createdAt', 'updatedAt']
      });

      if (user) {
        await Notification.create({
          userId: String(user.id),
          type: 'member',
          title: 'Membership Request Update',
          message: `Your membership request has been ${validatedData.status}. ${validatedData.rejectionReason ? `Reason: ${validatedData.rejectionReason}` : 'Please contact us for more information.'}`,
          read: false,
          timestamp: new Date(),
        } as any);

        // Send push notification to user
        sendPushToUser(String(user.id), {
          title: 'Membership Request Update',
          body: `Your membership request has been ${validatedData.status}.`,
          data: {
            type: 'membership-rejected',
            url: '/notifications',
          },
        }).catch((err) => logger.warn('Failed to send push to user:', err.message));
      }
    }

    return res.json({
      message: `Membership request ${validatedData.status} successfully`,
      request: membershipRequest,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
    logger.error('Error updating membership request:', error);
    logger.error('Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      body: req.body,
      params: req.params,
    });
    return res.status(500).json({ 
      error: 'Failed to update membership request',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// DELETE /api/membership/requests/:id - Delete a membership request (admin only)
router.delete('/requests/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const membershipRequest = await MembershipRequest.findByPk(id, {
      attributes: ['id', 'userId', 'fullName', 'email', 'phone', 'whatsapp', 'requestedPlan', 'monthlyAmount', 'status', 'requestedDate', 'approvedDate', 'approvedBy', 'rejectionReason', 'createdAt', 'updatedAt']
    });

    if (!membershipRequest) {
      return res.status(404).json({ error: 'Membership request not found' });
    }

    await membershipRequest.destroy();

    return res.json({ message: 'Membership request deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting membership request:', error);
    return res.status(500).json({ error: 'Failed to delete membership request' });
  }
});

export default router;
