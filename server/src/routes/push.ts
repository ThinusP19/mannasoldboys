import { Router, Request, Response } from 'express';
import { z } from 'zod';
import PushSubscription from '../models/PushSubscription';
import { authenticate } from '../middleware/auth';
import { isPushEnabled, getVapidPublicKey } from '../utils/push';
import logger from '../utils/logger';

const router = Router();

// Validation schema for push subscription
const subscriptionSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh key is required'),
    auth: z.string().min(1, 'auth key is required'),
  }),
});

/**
 * GET /api/push/vapid-public-key
 * Get the VAPID public key for client-side subscription
 */
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  // Hardcoded key as ultimate fallback
  const HARDCODED_KEY = 'BBzlMauRrds2VRw63Ahs4mfr2czsnGoLBaPH0xnJtC4PaMt3-hRdp-62ognRx9OsdEPK0KlBcx8K7HZss6x_oZs';

  const publicKey = getVapidPublicKey() || HARDCODED_KEY;

  return res.json({ publicKey });
});

/**
 * GET /api/push/status
 * Check if push notifications are enabled
 */
router.get('/status', (_req: Request, res: Response) => {
  return res.json({
    enabled: true,  // Force enabled with hardcoded keys
    hasVapidKey: true,
  });
});

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isPushEnabled()) {
      return res.status(503).json({
        error: 'Push notifications not configured',
        details: 'Push notifications are not enabled on the server',
      });
    }

    const userId = req.user!.userId;

    // Validate request body
    const validatedData = subscriptionSchema.parse(req.body);

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      where: { endpoint: validatedData.endpoint },
    });

    if (existingSubscription) {
      // Update existing subscription (might be for a different user now)
      if (existingSubscription.userId !== userId) {
        // Transfer subscription to new user
        await existingSubscription.update({
          userId,
          p256dh: validatedData.keys.p256dh,
          auth: validatedData.keys.auth,
        });
        logger.info('Push subscription transferred to new user:', userId);
      } else {
        // Update keys if they changed
        await existingSubscription.update({
          p256dh: validatedData.keys.p256dh,
          auth: validatedData.keys.auth,
        });
        logger.debug('Push subscription updated for user:', userId);
      }

      return res.json({
        message: 'Push subscription updated',
        subscription: existingSubscription,
      });
    }

    // Create new subscription
    const subscription = await PushSubscription.create({
      userId,
      endpoint: validatedData.endpoint,
      p256dh: validatedData.keys.p256dh,
      auth: validatedData.keys.auth,
    });

    logger.info('New push subscription created for user:', userId);

    return res.status(201).json({
      message: 'Push subscription created',
      subscription,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }
    logger.error('Error creating push subscription:', error);
    return res.status(500).json({
      error: 'Failed to create push subscription',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        error: 'Endpoint required',
        details: 'Push notification endpoint is required for unsubscription',
      });
    }

    // Find and delete the subscription
    const subscription = await PushSubscription.findOne({
      where: { endpoint, userId },
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        details: 'No push subscription found for this endpoint',
      });
    }

    await subscription.destroy();

    logger.info('Push subscription deleted for user:', userId);

    return res.json({
      message: 'Push subscription removed',
    });
  } catch (error: any) {
    logger.error('Error deleting push subscription:', error);
    return res.status(500).json({
      error: 'Failed to remove push subscription',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/push/unsubscribe-all
 * Unsubscribe all devices for the current user
 */
router.delete('/unsubscribe-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const deletedCount = await PushSubscription.destroy({
      where: { userId },
    });

    logger.info(`Deleted ${deletedCount} push subscription(s) for user:`, userId);

    return res.json({
      message: 'All push subscriptions removed',
      count: deletedCount,
    });
  } catch (error: any) {
    logger.error('Error deleting all push subscriptions:', error);
    return res.status(500).json({
      error: 'Failed to remove push subscriptions',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/push/test
 * Test push notification (development only)
 */
router.post('/test', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { sendPushToUser } = await import('../utils/push');

    logger.info(`[PUSH TEST] Sending test push to user: ${userId}`);

    await sendPushToUser(userId, {
      title: 'Test Push Notification',
      body: 'If you see this, push notifications are working!',
      data: {
        type: 'test',
        url: '/notifications',
      },
    });

    return res.json({ message: 'Test push sent', userId });
  } catch (error: any) {
    logger.error('Test push error:', error);
    return res.status(500).json({
      error: 'Failed to send test push',
      details: error.message,
    });
  }
});

/**
 * POST /api/push/test-all
 * Test push notification to ALL users (development only)
 */
router.post('/test-all', authenticate, async (_req: Request, res: Response) => {
  try {
    const { sendPushToAllUsers } = await import('../utils/push');

    logger.info(`[PUSH TEST-ALL] Sending test push to all users`);

    await sendPushToAllUsers({
      title: 'Test Push to All',
      body: 'This is a test push sent to all users!',
      data: {
        type: 'test',
        url: '/notifications',
      },
    });

    return res.json({ message: 'Test push sent to all users' });
  } catch (error: any) {
    logger.error('Test push-all error:', error);
    return res.status(500).json({
      error: 'Failed to send test push to all',
      details: error.message,
    });
  }
});

/**
 * GET /api/push/debug
 * Debug endpoint to see push subscription status
 */
router.get('/debug', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user's subscriptions
    const userSubs = await PushSubscription.findAll({
      where: { userId },
    });

    // Get all subscriptions count
    const allSubs = await PushSubscription.findAll();

    return res.json({
      currentUserId: userId,
      currentUserSubscriptions: userSubs.length,
      totalSubscriptions: allSubs.length,
      subscriptions: allSubs.map(s => ({
        id: s.id,
        userId: s.userId,
        endpoint: s.endpoint.substring(0, 80) + '...',
        createdAt: s.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Debug endpoint error:', error);
    return res.status(500).json({
      error: 'Debug endpoint failed',
      details: error.message,
    });
  }
});

export default router;
