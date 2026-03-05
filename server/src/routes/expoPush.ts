import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import ExpoPushToken from '../models/ExpoPushToken';
import { sendExpoPushNotifications, isValidExpoPushToken } from '../utils/expoPush';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /expo-push/register
 * Register an Expo push token for the authenticated user
 */
router.post('/register', authenticate, async (req: Request, res: Response) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!token) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Push token is required',
      });
    }

    if (!platform || !['ios', 'android'].includes(platform)) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Platform must be "ios" or "android"',
      });
    }

    // Validate Expo push token format
    if (!isValidExpoPushToken(token)) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Invalid Expo push token format',
      });
    }

    // Check if token already exists
    const existingToken = await ExpoPushToken.findOne({ where: { token } });

    if (existingToken) {
      // If token belongs to a different user, update ownership
      if (existingToken.userId !== userId) {
        await existingToken.update({ userId, platform });
        logger.info(`Expo push token transferred to user ${userId}`);
      } else if (existingToken.platform !== platform) {
        // Same user, but platform changed
        await existingToken.update({ platform });
      }

      return res.json({
        message: 'Push token updated successfully',
        tokenId: existingToken.id,
      });
    }

    // Create new token
    const newToken = await ExpoPushToken.create({
      userId,
      token,
      platform,
    });

    logger.info(`Expo push token registered for user ${userId}`);

    return res.status(201).json({
      message: 'Push token registered successfully',
      tokenId: newToken.id,
    });
  } catch (error: any) {
    logger.error('Error registering Expo push token:', error);
    return res.status(500).json({
      error: 'Failed to register push token',
      details: error.message,
    });
  }
});

/**
 * DELETE /expo-push/unregister
 * Remove an Expo push token for the authenticated user
 */
router.delete('/unregister', authenticate, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user!.userId;

    if (!token) {
      // Remove all tokens for this user
      const deleted = await ExpoPushToken.destroy({ where: { userId } });
      logger.info(`Removed ${deleted} Expo push tokens for user ${userId}`);

      return res.json({
        message: `Removed ${deleted} push token(s)`,
        count: deleted,
      });
    }

    // Remove specific token
    const deleted = await ExpoPushToken.destroy({
      where: { token, userId },
    });

    if (deleted === 0) {
      return res.status(404).json({
        error: 'Not found',
        details: 'Push token not found or does not belong to this user',
      });
    }

    logger.info(`Expo push token unregistered for user ${userId}`);

    return res.json({
      message: 'Push token unregistered successfully',
    });
  } catch (error: any) {
    logger.error('Error unregistering Expo push token:', error);
    return res.status(500).json({
      error: 'Failed to unregister push token',
      details: error.message,
    });
  }
});

/**
 * POST /expo-push/send
 * Send push notifications to users (admin only)
 */
router.post('/send', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userIds, title, body, data } = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Title and body are required',
      });
    }

    // Get tokens for specified users, or all users if no userIds provided
    const whereClause = userIds && userIds.length > 0
      ? { userId: userIds }
      : {};

    const tokens = await ExpoPushToken.findAll({ where: whereClause });

    if (tokens.length === 0) {
      return res.status(404).json({
        error: 'No recipients',
        details: 'No push tokens found for the specified users',
      });
    }

    // Send notifications
    const tokenStrings = tokens.map(t => t.token);
    const result = await sendExpoPushNotifications({
      tokens: tokenStrings,
      title,
      body,
      data,
    });

    // Clean up invalid tokens
    if (result.invalidTokens.length > 0) {
      await ExpoPushToken.destroy({
        where: { token: result.invalidTokens },
      });
      logger.info(`Cleaned up ${result.invalidTokens.length} invalid Expo push tokens`);
    }

    return res.json({
      message: 'Push notifications sent',
      sent: result.sent,
      failed: result.failed,
      invalidTokensCleaned: result.invalidTokens.length,
    });
  } catch (error: any) {
    logger.error('Error sending Expo push notifications:', error);
    return res.status(500).json({
      error: 'Failed to send push notifications',
      details: error.message,
    });
  }
});

/**
 * GET /expo-push/tokens
 * Get all push tokens for the current user (for debugging)
 */
router.get('/tokens', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const tokens = await ExpoPushToken.findAll({
      where: { userId },
      attributes: ['id', 'platform', 'createdAt'],
    });

    return res.json({
      tokens,
      count: tokens.length,
    });
  } catch (error: any) {
    logger.error('Error fetching Expo push tokens:', error);
    return res.status(500).json({
      error: 'Failed to fetch push tokens',
      details: error.message,
    });
  }
});

export default router;
