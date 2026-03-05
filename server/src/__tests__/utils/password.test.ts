import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, compareSecurityAnswer } from '../../utils/password';

describe('password utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should handle special characters', async () => {
      const password = 'P@$$w0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should handle unicode characters', async () => {
      const password = 'Pässwörd123!🔐';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const result = await comparePassword('WrongPassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for similar but different passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      // Test case sensitivity
      const result = await comparePassword('testpassword123!', hash);
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const hash = await hashPassword('');

      const resultTrue = await comparePassword('', hash);
      const resultFalse = await comparePassword('notEmpty', hash);

      expect(resultTrue).toBe(true);
      expect(resultFalse).toBe(false);
    });

    it('should handle special characters in comparison', async () => {
      const password = 'P@$$w0rd!@#$%^&*()';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });
  });

  describe('compareSecurityAnswer', () => {
    it('should return true for matching bcrypt hashed answer', async () => {
      const answer = 'my secret answer';
      const hash = await hashPassword(answer);

      const result = await compareSecurityAnswer(answer, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching bcrypt hashed answer', async () => {
      const answer = 'my secret answer';
      const hash = await hashPassword(answer);

      const result = await compareSecurityAnswer('wrong answer', hash);
      expect(result).toBe(false);
    });

    it('should handle legacy plain text answers (case-insensitive)', async () => {
      const storedAnswer = 'My Secret Answer';

      // Same case
      expect(await compareSecurityAnswer('My Secret Answer', storedAnswer)).toBe(true);
      // Different case
      expect(await compareSecurityAnswer('my secret answer', storedAnswer)).toBe(true);
      expect(await compareSecurityAnswer('MY SECRET ANSWER', storedAnswer)).toBe(true);
    });

    it('should handle legacy plain text answers with whitespace', async () => {
      const storedAnswer = '  My Secret Answer  ';

      expect(await compareSecurityAnswer('My Secret Answer', storedAnswer)).toBe(true);
      expect(await compareSecurityAnswer('  my secret answer  ', storedAnswer)).toBe(true);
    });

    it('should return false for wrong legacy plain text answer', async () => {
      const storedAnswer = 'My Secret Answer';

      const result = await compareSecurityAnswer('wrong answer', storedAnswer);
      expect(result).toBe(false);
    });

    it('should correctly identify bcrypt hash format', async () => {
      // $2a$ format
      const hash2a = '$2a$10$somehashvalue';
      expect(await compareSecurityAnswer('test', hash2a)).toBe(false); // Won't match, but should try bcrypt

      // $2b$ format
      const hash2b = '$2b$10$somehashvalue';
      expect(await compareSecurityAnswer('test', hash2b)).toBe(false);

      // $2y$ format
      const hash2y = '$2y$10$somehashvalue';
      expect(await compareSecurityAnswer('test', hash2y)).toBe(false);
    });

    it('should treat non-bcrypt strings as plain text', async () => {
      // String that starts with $ but isn't bcrypt
      const notBcrypt = '$notabcrypthash';
      expect(await compareSecurityAnswer('$notabcrypthash', notBcrypt)).toBe(true);

      // Regular string
      const plainText = 'plainanswer';
      expect(await compareSecurityAnswer('PlainAnswer', plainText)).toBe(true);
    });
  });
});
