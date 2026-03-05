/**
 * Security Utilities
 * Provides input sanitization, XSS protection, and security helpers
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated content that will be rendered as HTML
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize plain text input
 * Removes all HTML tags and dangerous characters
 */
export const sanitizeText = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize URL to prevent javascript: and data: URL injection
 */
export const sanitizeURL = (url: string): string => {
  const trimmed = url.trim();

  // Block dangerous protocols
  if (
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:') ||
    trimmed.toLowerCase().startsWith('vbscript:') ||
    trimmed.toLowerCase().startsWith('file:')
  ) {
    return '';
  }

  // Ensure URLs start with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
};

/**
 * Validate phone number (South African format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^0[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Validate password strength
 * Returns validation result with specific requirements
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
} => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  };
};

/**
 * Escape special regex characters in strings
 */
export const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Rate limiting tracker for client-side
 * Helps prevent brute force attacks
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed
   * @param key - Unique identifier for the action
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(key: string, maxAttempts: number = 5, windowMs: number = 60000): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    return Math.max(0, maxAttempts - recentAttempts.length);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Secure localStorage wrapper with error handling
 */
export const secureStorage = {
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
      }
      return false;
    }
  },

  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage access error');
      return null;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage access error');
      return false;
    }
  },

  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('localStorage access error');
      return false;
    }
  }
};

/**
 * Prevent timing attacks by using constant-time comparison
 */
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Generate a secure random string (for CSRF tokens, etc.)
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Content Security Policy violation reporter
 */
export const setupCSPReporting = () => {
  if (typeof document !== 'undefined') {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('CSP Violation:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
      });

      // In production, you could send this to your logging service
      // fetch('/api/csp-report', {
      //   method: 'POST',
      //   body: JSON.stringify({ ... })
      // });
    });
  }
};

/**
 * Detect and prevent clickjacking
 */
export const preventClickjacking = () => {
  if (typeof window !== 'undefined') {
    if (window.self !== window.top) {
      // Page is in an iframe - potential clickjacking attack
      console.warn('Potential clickjacking detected');
      // Prevent rendering in iframe
      window.top!.location = window.self.location;
    }
  }
};

/**
 * Secure file upload validation
 */
export const validateFile = (file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): { valid: boolean; error?: string } => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Sanitize filename to prevent directory traversal
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9._-]/gi, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
};

/**
 * Detect suspicious patterns in user input
 */
export const detectSuspiciousInput = (input: string): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // event handlers like onclick=
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};
