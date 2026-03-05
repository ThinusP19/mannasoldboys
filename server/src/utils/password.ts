import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Compare a security answer with its hash
 * Security answers are normalized (lowercased, trimmed) before hashing
 * This function handles both hashed and legacy plain-text answers
 */
export async function compareSecurityAnswer(answer: string, storedAnswer: string): Promise<boolean> {
  // Check if the stored answer looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[aby]\$/.test(storedAnswer);

  if (isBcryptHash) {
    // New format: compare with bcrypt
    return bcrypt.compare(answer, storedAnswer);
  } else {
    // Legacy format: plain text comparison (case-insensitive)
    // This handles existing users who set their security answer before hashing was implemented
    return storedAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
  }
}

