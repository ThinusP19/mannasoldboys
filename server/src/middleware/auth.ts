import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        details: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (error: any) {
      res.status(401).json({
        error: 'Unauthorized',
        details: error.message || 'Invalid token',
      });
      return;
    }
  } catch (error: any) {
    res.status(401).json({
      error: 'Unauthorized',
      details: error.message || 'Authentication failed',
    });
    return;
  }
}

/**
 * Optional authentication - adds user if token exists, but doesn't require it
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyToken(token);
        req.user = payload;
      } catch {
        // Token invalid, but continue without user
      }
    }
    next();
  } catch {
    next();
  }
}

