import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { generateToken } from '../../utils/jwt';

// Helper to create mock request
function createMockRequest(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

// Helper to create mock response
function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis() as any,
    json: vi.fn().mockReturnThis() as any,
  };
  return res;
}

describe('requireAdmin middleware', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
  });

  it('should reject request without authorization header', () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;

    requireAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      details: 'No token provided',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', () => {
    const req = createMockRequest('Bearer invalid-token') as Request;
    const res = createMockResponse() as Response;

    requireAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject non-admin user', () => {
    const token = generateToken({
      userId: 'user-123',
      email: 'user@example.com',
      role: 'alumni',
    });
    const req = createMockRequest(`Bearer ${token}`) as Request;
    const res = createMockResponse() as Response;

    requireAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      details: 'Admin access required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow admin user', () => {
    const token = generateToken({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });
    const req = createMockRequest(`Bearer ${token}`) as Request;
    const res = createMockResponse() as Response;

    requireAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.role).toBe('admin');
  });

  it('should reject user with different role than admin', () => {
    // Test with various non-admin roles
    const roles = ['alumni', 'moderator', 'user', 'guest', ''];

    for (const role of roles) {
      const token = generateToken({
        userId: 'user-123',
        email: 'user@example.com',
        role: role,
      });
      const req = createMockRequest(`Bearer ${token}`) as Request;
      const res = createMockResponse() as Response;
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('should set user on request when admin is authenticated', () => {
    const token = generateToken({
      userId: 'admin-456',
      email: 'superadmin@example.com',
      role: 'admin',
    });
    const req = createMockRequest(`Bearer ${token}`) as Request;
    const res = createMockResponse() as Response;

    requireAdmin(req, res, mockNext);

    expect(req.user).toEqual({
      userId: 'admin-456',
      email: 'superadmin@example.com',
      role: 'admin',
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });
});
