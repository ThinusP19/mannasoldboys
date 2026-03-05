import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import logger from './logger';

// Create a new Expo SDK client
const expo = new Expo();

export interface SendPushNotificationOptions {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

/**
 * Send push notifications to Expo push tokens
 * Handles batching and error handling automatically
 */
export async function sendExpoPushNotifications(options: SendPushNotificationOptions): Promise<{
  sent: number;
  failed: number;
  invalidTokens: string[];
}> {
  const { tokens, title, body, data = {}, sound = 'default', badge, channelId } = options;

  // Filter for valid Expo push tokens
  const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
  const invalidTokens: string[] = tokens.filter(token => !Expo.isExpoPushToken(token));

  if (invalidTokens.length > 0) {
    logger.warn(`Found ${invalidTokens.length} invalid Expo push tokens`);
  }

  if (validTokens.length === 0) {
    logger.info('No valid Expo push tokens to send to');
    return { sent: 0, failed: tokens.length, invalidTokens };
  }

  // Create messages for each token
  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to: token,
    sound,
    title,
    body,
    data,
    ...(badge !== undefined && { badge }),
    ...(channelId && { channelId }),
  }));

  // Chunk messages to respect Expo's rate limits
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  let sent = 0;
  let failed = invalidTokens.length;

  // Send each chunk
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);

      // Count successes and failures
      for (const ticket of ticketChunk) {
        if (ticket.status === 'ok') {
          sent++;
        } else {
          failed++;
          if (ticket.details?.error === 'DeviceNotRegistered') {
            // Token is no longer valid, should be removed
            const index = ticketChunk.indexOf(ticket);
            if (index >= 0 && index < chunk.length) {
              const invalidToken = chunk[index].to;
              if (typeof invalidToken === 'string') {
                invalidTokens.push(invalidToken);
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error sending Expo push notification chunk:', error);
      failed += chunk.length;
    }
  }

  logger.info(`Expo push notifications: ${sent} sent, ${failed} failed`);

  return { sent, failed, invalidTokens };
}

/**
 * Send a push notification to a single user
 */
export async function sendExpoPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  const result = await sendExpoPushNotifications({
    tokens: [token],
    title,
    body,
    data,
  });

  return result.sent > 0;
}

/**
 * Check if a string is a valid Expo push token
 */
export function isValidExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}

export { expo };
