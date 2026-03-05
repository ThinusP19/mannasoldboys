import { Router, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import Notification from '../models/Notification';
import sequelize from '../db/connection';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import logger from '../utils/logger';
import { sendPushToUsers } from '../utils/push';
import { sendExpoPushNotifications } from '../utils/expoPush';
import ExpoPushToken from '../models/ExpoPushToken';

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications (admin only) or user's notifications with pagination
 * Uses raw SQL to avoid getter/setter circular issues
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let notifications: any[];
    let total: number;

    if (userRole === 'admin') {
      // Admin can see all notifications - use raw SQL query
      // Note: [read] is escaped because 'read' is a reserved keyword in SQL Server
      notifications = await sequelize.query(`
        SELECT
          n.id,
          n.userId,
          n.type,
          n.title,
          n.message,
          n.[read] as isRead,
          n.timestamp,
          n.createdAt,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email
        FROM notifications n
        LEFT JOIN users u ON n.userId = u.id
        ORDER BY n.timestamp DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `, {
        replacements: { offset, limit },
        type: QueryTypes.SELECT,
      }) as any[];

      const [[{ count }]] = await sequelize.query(`
        SELECT COUNT(*) as count FROM notifications
      `) as [[{ count: number }], unknown];
      total = count;
    } else {
      // Regular users see only their notifications
      // Note: [read] is escaped because 'read' is a reserved keyword in SQL Server
      notifications = await sequelize.query(`
        SELECT
          n.id,
          n.userId,
          n.type,
          n.title,
          n.message,
          n.[read] as isRead,
          n.timestamp,
          n.createdAt,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email
        FROM notifications n
        LEFT JOIN users u ON n.userId = u.id
        WHERE n.userId = :userId
        ORDER BY n.timestamp DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `, {
        replacements: { userId, offset, limit },
        type: QueryTypes.SELECT,
      }) as any[];

      const [[{ count }]] = await sequelize.query(`
        SELECT COUNT(*) as count FROM notifications WHERE userId = :userId
      `, { replacements: { userId } }) as [[{ count: number }], unknown];
      total = count;
    }

    // Format the response
    const notificationsData = notifications.map((notification: any) => {
      // Format dates
      const timestampStr = notification.timestamp instanceof Date
        ? notification.timestamp.toISOString()
        : notification.timestamp ? String(notification.timestamp)
        : new Date().toISOString();
      
      const createdAtStr = notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : notification.createdAt ? String(notification.createdAt)
        : new Date().toISOString();
      
      return {
        id: String(notification.id),
        userId: String(notification.userId),
        userName: notification.user_name || null,
        userEmail: notification.user_email || null,
        type: String(notification.type),
        title: String(notification.title || ''),
        message: String(notification.message || ''),
        read: Boolean(notification.isRead),
        timestamp: timestampStr,
        createdAt: createdAtStr,
      };
    });

    return res.json({
      data: notificationsData,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Get notifications error:', error);
    logger.error('Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Failed to get notifications',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/notifications/unread
 * Get unread notifications count
 */
router.get('/unread', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let unreadCount;
    
    if (userRole === 'admin') {
      // Admin sees all unread notifications
      unreadCount = await Notification.count({
        where: { read: false },
      });
    } else {
      // Regular users see only their unread notifications
      unreadCount = await Notification.count({
        where: { userId, read: false },
      });
    }

    return res.json({ count: unreadCount });
  } catch (error: any) {
    logger.error('Get unread count error:', error);
    return res.status(500).json({
      error: 'Failed to get unread count',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        details: 'Notification does not exist',
      });
    }

    // Regular users can only mark their own notifications as read
    if (userRole !== 'admin' && notification.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'You can only mark your own notifications as read',
      });
    }

    notification.read = true;
    await notification.save();

    return res.json({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    logger.error('Mark notification as read error:', error);
    return res.status(500).json({
      error: 'Failed to mark notification as read',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole === 'admin') {
      // Admin can mark all notifications as read
      await Notification.update({ read: true }, { where: {} });
    } else {
      // Regular users can only mark their own notifications as read
      await Notification.update({ read: true }, { where: { userId } });
    }

    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    logger.error('Mark all as read error:', error);
    return res.status(500).json({
      error: 'Failed to mark all notifications as read',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification (users can delete their own, admins can delete any)
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        details: 'Notification does not exist',
      });
    }

    // Regular users can only delete their own notifications
    if (userRole !== 'admin' && notification.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'You can only delete your own notifications',
      });
    }

    await notification.destroy();

    return res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    logger.error('Delete notification error:', error);
    return res.status(500).json({
      error: 'Failed to delete notification',
      details: error.message || 'Internal server error',
    });
  }
});

// Validation schema for creating notifications
const createNotificationSchema = z.object({
  userId: z.string().optional(), // Optional - if not provided, send to all users
  userIds: z.array(z.string()).optional(), // Optional - send to multiple specific users
  type: z.enum(['reunion', 'story', 'member', 'project', 'general', 'admin_action']),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  sendPush: z.boolean().optional().default(true), // Whether to send push notification
});

/**
 * POST /api/notifications
 * Create a notification (admin only)
 * Can target a specific user, multiple users, or all users
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);

    let targetUserIds: string[] = [];

    if (validatedData.userId) {
      // Single user target
      targetUserIds = [validatedData.userId];
    } else if (validatedData.userIds && validatedData.userIds.length > 0) {
      // Multiple users target
      targetUserIds = validatedData.userIds;
    } else {
      // All users - get all user IDs
      const User = (await import('../models/User')).default;
      const allUsers = await User.findAll({ attributes: ['id'] });
      targetUserIds = allUsers.map((u) => String(u.id));
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      targetUserIds.map((userId) =>
        Notification.create({
          userId,
          type: validatedData.type,
          title: validatedData.title,
          message: validatedData.message,
          read: false,
          timestamp: new Date(),
        } as any)
      )
    );

    // Send push notifications if enabled
    if (validatedData.sendPush) {
      // Send web push notifications
      sendPushToUsers(targetUserIds, {
        title: validatedData.title,
        body: validatedData.message,
        data: {
          type: validatedData.type,
          url: '/notifications',
        },
      }).catch((err) => logger.warn('Failed to send web push notifications:', err.message));

      // Send Expo push notifications to mobile users
      try {
        const whereClause = targetUserIds.length > 0
          ? { userId: targetUserIds }
          : {};
        const expoTokens = await ExpoPushToken.findAll({ where: whereClause });

        if (expoTokens.length > 0) {
          const tokenStrings = expoTokens.map(t => t.token);
          sendExpoPushNotifications({
            tokens: tokenStrings,
            title: validatedData.title,
            body: validatedData.message,
            data: {
              type: validatedData.type,
              url: '/notifications',
            },
          }).catch((err) => logger.warn('Failed to send Expo push notifications:', err.message));
        }
      } catch (err: any) {
        logger.warn('Failed to send Expo push notifications:', err.message);
      }
    }

    logger.info(`Created ${notifications.length} notification(s) for ${targetUserIds.length} user(s)`);

    return res.status(201).json({
      message: `Notification sent to ${targetUserIds.length} user(s)`,
      count: notifications.length,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }
    logger.error('Create notification error:', error);
    return res.status(500).json({
      error: 'Failed to create notification',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;

