import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Note: JWT_SECRET is set in setup.ts before these imports
import { generateToken, verifyToken, JWTPayload } from '../../utils/jwt';

describe('JWT utilities', () => {
  const validPayload: JWTPayload = {
    userId: 'test-user-id-123',
    email: 'test@example.com',
    role: 'alumni',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(validPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // JWT format: header.payload.signature
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(validPayload);
      const token2 = generateToken({
        ...validPayload,
        userId: 'different-user-id',
      });

      expect(token1).not.toBe(token2);
    });

    it('should include payload data in token', () => {
      const token = generateToken(validPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
      expect(decoded.role).toBe(validPayload.role);
    });

    it('should handle admin role', () => {
      const adminPayload: JWTPayload = {
        userId: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
      };

      const token = generateToken(adminPayload);
      const decoded = verifyToken(token);

      expect(decoded.role).toBe('admin');
    });

    it('should handle special characters in email', () => {
      const specialPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test+special@sub.example.com',
        role: 'alumni',
      };

      const token = generateToken(specialPayload);
      const decoded = verifyToken(token);

      expect(decoded.email).toBe(specialPayload.email);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(validPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
      expect(decoded.role).toBe(validPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('not-a-jwt')).toThrow('Invalid or expired token');
    });

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong signature', () => {
      const token = generateToken(validPayload);
      // Tamper with the signature (last part)
      const parts = token.split('.');
      parts[2] = 'tampered-signature';
      const tamperedToken = parts.join('.');

      expect(() => verifyToken(tamperedToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for token with tampered payload', () => {
      const token = generateToken(validPayload);
      const parts = token.split('.');
      // Tamper with the payload (middle part)
      parts[1] = Buffer.from(JSON.stringify({ userId: 'hacked' })).toString('base64');
      const tamperedToken = parts.join('.');

      expect(() => verifyToken(tamperedToken)).toThrow('Invalid or expired token');
    });
  });

  describe('token expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create token that expires based on JWT_EXPIRES_IN', () => {
      // Token should be valid immediately after creation
      const token = generateToken(validPayload);
      expect(() => verifyToken(token)).not.toThrow();
    });

    it('should reject expired token', () => {
      const token = generateToken(validPayload);

      // Advance time by 2 hours (beyond the 1h expiration set in setup.ts)
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);

      expect(() => verifyToken(token)).toThrow('Invalid or expired token');
    });

    it('should accept token within expiration window', () => {
      const token = generateToken(validPayload);

      // Advance time by 30 minutes (within the 1h expiration)
      vi.advanceTimersByTime(30 * 60 * 1000);

      expect(() => verifyToken(token)).not.toThrow();
    });
  });

  describe('payload validation', () => {
    it('should include standard JWT claims', () => {
      const token = generateToken(validPayload);
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Should have expiration claim
      expect(payload.exp).toBeDefined();
      // Should have issued at claim
      expect(payload.iat).toBeDefined();
      // Should have our custom claims
      expect(payload.userId).toBe(validPayload.userId);
      expect(payload.email).toBe(validPayload.email);
      expect(payload.role).toBe(validPayload.role);
    });
  });
});
