import { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth';

/**
 * Admin-only middleware - requires authentication and admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // First authenticate
  authenticate(req, res, () => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        details: 'Authentication required',
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        details: 'Admin access required',
      });
      return;
    }

    next();
  });
}

