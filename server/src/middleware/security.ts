import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise-level security headers middleware
 * Implements OWASP recommended security headers
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Remove X-Powered-By header (information disclosure)
  res.removeHeader('X-Powered-By');

  // Strict Transport Security (HSTS) - Force HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Content-Type-Options - Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options - Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection - Enable browser XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy - Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy - Restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Content-Security-Policy - XSS and injection protection
  // More permissive in development to allow localhost connections
  const cspDirectives = process.env.NODE_ENV === 'production'
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self'",
        "frame-src https://www.google.com https://maps.google.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join('; ')
    : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:5173 http://localhost:8081 ws://localhost:*",
        "frame-src https://www.google.com https://maps.google.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // X-DNS-Prefetch-Control - Disable DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Expect-CT - Certificate Transparency
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Expect-CT', 'max-age=86400, enforce');
  }

  // Cross-Origin-Embedder-Policy - Prevent cross-origin embedding
  // res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); // Commented - may break some features

  // Cross-Origin-Opener-Policy - Isolate browsing context
  // Only apply in production to allow CORS in development
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }

  // Cross-Origin-Resource-Policy - Control resource loading
  // Only apply in production to allow CORS in development
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  }

  next();
}

/**
 * Request ID middleware for tracking and logging
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

