import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
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

describe('authenticate middleware', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
  });

  it('should reject request without authorization header', () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      details: 'No token provided',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject request with non-Bearer authorization', () => {
    const req = createMockRequest('Basic sometoken') as Request;
    const res = createMockResponse() as Response;

    authenticate(req, res, mockNext);

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

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      details: 'Invalid or expired token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should accept request with valid token', () => {
    const token = generateToken({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'alumni',
    });
    const req = createMockRequest(`Bearer ${token}`) as Request;
    const res = createMockResponse() as Response;

    authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('user-123');
    expect(req.user?.email).toBe('test@example.com');
    expect(req.user?.role).toBe('alumni');
  });

  it('should handle admin token', () => {
    const token = generateToken({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });
    const req = createMockRequest(`Bearer ${token}`) as Request;
    const res = createMockResponse() as Response;

    authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user?.role).toBe('admin');
  });

  it('should reject empty Bearer token', () => {
    const req = createMockRequest('Bearer ') as Request;
    const res = createMockResponse() as Response;

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject Bearer with only whitespace', () => {
    const req = createMockRequest('Bearer    ') as Request;
    const res = createMockResponse() as Response;

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('optionalAuth middleware', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
  });

  it('should continue without user when no authorization header', () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;

    optionalAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should continue without user when non-Bearer authorization', () => {
    const req = createMockRequest('Basic sometoken') as Request;
    const res = createMockResponse() as Response;

    optionalAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should continue without user when invalid token', () => {
    const req = createMockRequest('Bearer invalid-token') as Request;
    const res = createMockResponse() as Response;

    optionalAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should set user when valid token provided', () => {
    const token = generateToken({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'alumni',
    });
    const req = createMockRequest(`Bearer ${token}`) as Request;
    const res = createMockResponse() as Response;

    optionalAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('user-123');
  });

  it('should handle admin token', () => {
    const token = generateToken({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });
    const req = createMockRequest(`Bearer ${token}`) as Request;
    const res = createMockResponse() as Response;

    optionalAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user?.role).toBe('admin');
  });
});
