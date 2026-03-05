import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';
import logger from './logger';

// Lazy initialization
let pushInitialized = false;

// Hardcoded VAPID keys as fallback
const VAPID_PUBLIC_KEY_FALLBACK = 'BBzlMauRrds2VRw63Ahs4mfr2czsnGoLBaPH0xnJtC4PaMt3-hRdp-62ognRx9OsdEPK0KlBcx8K7HZss6x_oZs';
const VAPID_PRIVATE_KEY_FALLBACK = 'UnRVorgiKSBhRSzI_T6sUW4jjGDYfiOYmnqUTIl-na8';
const VAPID_EMAIL_FALLBACK = 'mailto:admin@potchgim.co.za';

function ensureInitialized() {
  if (pushInitialized) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY_FALLBACK;
  const privateKey = process.env.VAPID_PRIVATE_KEY || VAPID_PRIVATE_KEY_FALLBACK;
  const email = process.env.VAPID_EMAIL || VAPID_EMAIL_FALLBACK;

  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(email, publicKey, privateKey);
      pushInitialized = true;
      logger.info('Push notifications enabled with VAPID keys');
    } catch (error: any) {
      logger.error('Failed to initialize web-push:', error.message);
    }
  }
}

export function isPushEnabled(): boolean {
  ensureInitialized();
  return pushInitialized;
}

export function getVapidPublicKey(): string {
  ensureInitialized();
  return process.env.VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY_FALLBACK;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send push notification to a specific user
 * @param userId - The user ID to send the notification to
 * @param payload - The notification payload
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  ensureInitialized();

  if (!pushInitialized) {
    logger.warn('[PUSH] Push notifications disabled, skipping push to user:', userId);
    return;
  }

  try {
    // Find all subscriptions for this user
    const subscriptions = await PushSubscription.findAll({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      // This is normal - most users won't have push subscriptions
      return;
    }

    logger.info(`[PUSH] User ${userId} has ${subscriptions.length} subscription(s)`);

    // Build the notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/cropped-skool-wapen.png',
      badge: payload.badge || '/cropped-skool-wapen.png',
      tag: payload.tag,
      data: payload.data || {},
      actions: payload.actions || [],
    });

    logger.info(`[PUSH] Payload: ${notificationPayload}`);

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        logger.info(`[PUSH] Sending to endpoint: ${subscription.endpoint.substring(0, 80)}...`);
        const result = await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload
        );
        logger.info(`[PUSH] ✅ Push sent! Status: ${result.statusCode}, Body: ${result.body}`);
      } catch (error: any) {
        // If subscription is invalid (410 Gone or 404), remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          logger.info('[PUSH] Subscription expired/invalid, removing:', subscription.id);
          await subscription.destroy();
        } else {
          logger.error(`[PUSH] ❌ Failed to send push: ${error.message}`);
          logger.error(`[PUSH] Status code: ${error.statusCode}`);
          logger.error(`[PUSH] Body: ${error.body}`);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error: any) {
    logger.error('[PUSH] Error in sendPushToUser:', error.message);
    logger.error('[PUSH] Stack:', error.stack);
  }
}

/**
 * Send push notification to multiple users
 * @param userIds - Array of user IDs to send the notification to
 * @param payload - The notification payload
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  ensureInitialized();
  if (!pushInitialized) {
    logger.debug('Push notifications disabled, skipping push to users');
    return;
  }

  logger.info(`[PUSH] sendPushToUsers: Processing ${userIds.length} user(s)`);
  const sendPromises = userIds.map((userId) => sendPushToUser(userId, payload));
  const results = await Promise.allSettled(sendPromises);

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  logger.info(`[PUSH] sendPushToUsers complete: ${succeeded} succeeded, ${failed} failed`);
}

/**
 * Send push notification to all admin users
 * @param payload - The notification payload
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  ensureInitialized();
  if (!pushInitialized) {
    logger.debug('Push notifications disabled, skipping push to admins');
    return;
  }

  try {
    // Import User model here to avoid circular dependency
    const User = (await import('../models/User')).default;

    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id'],
    });

    const adminIds = admins.map((admin) => String(admin.id));
    await sendPushToUsers(adminIds, payload);

    logger.info(`Push notifications sent to ${adminIds.length} admin(s)`);
  } catch (error: any) {
    logger.error('Error sending push to admins:', error.message);
  }
}

/**
 * Send push notification to users in specific year groups
 * @param yearGroups - Array of year groups to target (empty = all users)
 * @param payload - The notification payload
 */
export async function sendPushToYearGroups(yearGroups: number[], payload: PushPayload): Promise<void> {
  ensureInitialized();
  if (!pushInitialized) {
    logger.debug('Push notifications disabled, skipping push to year groups');
    return;
  }

  try {
    // Import models here to avoid circular dependency
    const Profile = (await import('../models/Profile')).default;
    const { Op } = await import('sequelize');

    let userIds: string[] = [];

    if (yearGroups.length === 0) {
      // If no year groups specified, send to all users with profiles
      const profiles = await Profile.findAll({
        attributes: ['userId'],
      });
      userIds = profiles.map((profile: any) => String(profile.userId));
    } else {
      // Get users in specified year groups
      const profiles = await Profile.findAll({
        where: {
          year: { [Op.in]: yearGroups },
        },
        attributes: ['userId'],
      });
      userIds = profiles.map((profile: any) => String(profile.userId));
    }

    if (userIds.length === 0) {
      logger.debug('No users found in specified year groups');
      return;
    }

    await sendPushToUsers(userIds, payload);
    logger.info(`Push notifications sent to ${userIds.length} user(s) in year groups: ${yearGroups.length > 0 ? yearGroups.join(', ') : 'all'}`);
  } catch (error: any) {
    logger.error('Error sending push to year groups:', error.message);
  }
}

/**
 * Send push notification to all users
 * @param payload - The notification payload
 */
export async function sendPushToAllUsers(payload: PushPayload): Promise<void> {
  logger.info('[PUSH] ========================================');
  logger.info('[PUSH] sendPushToAllUsers called with title:', payload.title);
  logger.info('[PUSH] pushInitialized before ensureInitialized:', pushInitialized);
  ensureInitialized();
  logger.info('[PUSH] pushInitialized after ensureInitialized:', pushInitialized);

  if (!pushInitialized) {
    logger.warn('[PUSH] Push notifications disabled, skipping push to all users');
    return;
  }

  try {
    const User = (await import('../models/User')).default;

    const users = await User.findAll({
      attributes: ['id'],
    });

    const userIds = users.map((user: any) => String(user.id));
    logger.info(`[PUSH] Found ${userIds.length} total user(s) in database`);
    logger.info(`[PUSH] User IDs: ${userIds.join(', ')}`);

    // Check how many actually have push subscriptions
    const allSubs = await PushSubscription.findAll();
    logger.info(`[PUSH] Total push subscriptions in database: ${allSubs.length}`);
    allSubs.forEach(sub => {
      logger.info(`[PUSH] - Subscription for userId: ${sub.userId}, endpoint: ${sub.endpoint.substring(0, 60)}...`);
    });

    await sendPushToUsers(userIds, payload);

    logger.info(`[PUSH] Push notifications process completed for all users`);
    logger.info('[PUSH] ========================================');
  } catch (error: any) {
    logger.error('[PUSH] Error sending push to all users:', error.message);
    logger.error('[PUSH] Stack:', error.stack);
  }
}

export default {
  isPushEnabled,
  getVapidPublicKey,
  sendPushToUser,
  sendPushToUsers,
  sendPushToAdmins,
  sendPushToYearGroups,
  sendPushToAllUsers,
};
