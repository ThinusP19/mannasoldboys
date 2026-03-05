import jwt from 'jsonwebtoken';
import logger from './logger';

// JWT_SECRET is REQUIRED - no default fallback for security
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error('🚨 CRITICAL: JWT_SECRET environment variable is not set!');
    logger.error('🚨 Generate a strong secret: openssl rand -base64 64');
    throw new Error('CRITICAL: JWT_SECRET must be set. Cannot start server without JWT secret.');
  }

  if (secret.length < 64) {
    logger.warn('⚠️  WARNING: JWT_SECRET should be at least 64 characters for security.');
    logger.warn('⚠️  Generate a stronger secret: openssl rand -base64 64');
  }

  return secret;
}

const JWT_SECRET: string = getJwtSecret();

// Shorter expiration for better security (1 hour instead of 7 days)
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as string;

logger.info('✅ JWT_SECRET is configured');
logger.info(`✅ JWT tokens expire in: ${JWT_EXPIRES_IN}`);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as any, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as any);
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as JWTPayload;
    }
    throw new Error('Invalid token format');
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

