# Security Documentation - Potchefstroom Gymnasium Alumni Connect

## Overview
This document outlines the comprehensive security measures implemented in the Potchefstroom Gymnasium Alumni Connect platform to protect user data and prevent common web vulnerabilities.

## Security Features Implemented

### 1. **Content Security Policy (CSP)**
**Location:** `index.html:16-27`

Implemented strict Content Security Policy headers to prevent:
- Cross-Site Scripting (XSS) attacks
- Code injection attacks
- Clickjacking attempts
- Data exfiltration

**Features:**
- `default-src 'self'` - Only allow resources from same origin
- `frame-ancestors 'none'` - Prevent clickjacking
- `upgrade-insecure-requests` - Force HTTPS
- Restricted script and style sources

### 2. **Security Headers**
**Location:** `index.html:8-13`

Essential HTTP security headers:
- `X-Content-Type-Options: nosniff` - Prevent MIME-type sniffing
- `X-Frame-Options: DENY` - Block iframe embedding
- `X-XSS-Protection: 1; mode=block` - Enable browser XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer information
- `Permissions-Policy` - Restrict access to geolocation, microphone, camera

### 3. **Input Sanitization & XSS Protection**
**Location:** `src/lib/security.ts`

Comprehensive input sanitization using DOMPurify:
- `sanitizeHTML()` - Sanitize HTML content with allowed tags
- `sanitizeText()` - Remove all HTML from text input
- `sanitizeURL()` - Prevent javascript: and data: URL injection
- `detectSuspiciousInput()` - Pattern matching for malicious input

### 4. **Authentication & Authorization**
**Location:** `src/contexts/AuthContext.tsx`, `src/lib/api.ts`

**Features:**
- JWT token-based authentication
- Separate admin and user authentication systems
- Token validation on every request
- Automatic token expiry handling
- Secure localStorage with quota handling
- Role-based access control

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$% etc.)

### 5. **Rate Limiting**
**Location:** `src/lib/security.ts:93-126`

Client-side rate limiting to prevent:
- Brute force attacks
- Credential stuffing
- API abuse

**Default Settings:**
- 5 attempts per 60 seconds
- Configurable per action
- Automatic cleanup of old attempts

### 6. **Secure File Upload**
**Location:** `src/lib/security.ts:241-285`

File upload validation:
- File size limits (5MB default)
- MIME type validation
- File extension verification
- Filename sanitization
- Prevention of directory traversal attacks

**Allowed File Types:**
- Images: JPEG, JPG, PNG, WebP

### 7. **Form Validation**
**Location:** Multiple pages

All forms implement comprehensive validation:
- Email format validation (RFC 5321 compliant)
- Phone number validation (South African format)
- Input length restrictions
- Required field enforcement
- Password strength validation
- Confirmation field matching

### 8. **API Security**
**Location:** `src/lib/api.ts`

**Features:**
- Bearer token authentication
- Automatic token attachment
- Error handling for auth failures
- Separate admin API endpoints
- Request/response validation
- CORS protection

### 9. **Clickjacking Prevention**
**Location:** `src/lib/security.ts:222-232`

Automatic detection and prevention:
- Frame-busting code
- X-Frame-Options header
- CSP frame-ancestors directive

### 10. **Secure Storage**
**Location:** `src/lib/security.ts:147-180`

Wrapper for localStorage with:
- Error handling
- Quota exceeded handling
- Access error recovery
- Automatic cleanup

## Security Best Practices

### For Developers

1. **Never store sensitive data in localStorage**
   - Use sanitizeUserForStorage() to remove large data
   - Don't store passwords or tokens in plain text

2. **Always sanitize user input**
   ```typescript
   import { sanitizeText, sanitizeHTML } from '@/lib/security';
   const clean = sanitizeText(userInput);
   ```

3. **Validate all file uploads**
   ```typescript
   import { validateFile } from '@/lib/security';
   const result = validateFile(file);
   if (!result.valid) {
     alert(result.error);
   }
   ```

4. **Use rate limiting for sensitive operations**
   ```typescript
   import { rateLimiter } from '@/lib/security';
   if (!rateLimiter.isAllowed('login', 5, 60000)) {
     alert('Too many attempts. Try again later.');
   }
   ```

5. **Always use HTTPS in production**
   - Configured via CSP upgrade-insecure-requests

### For Administrators

1. **Regular Security Audits**
   - Review access logs weekly
   - Monitor failed login attempts
   - Check CSP violation reports

2. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Environment Variables**
   - Never commit `.env` files
   - Use secure values in production
   - Rotate tokens regularly

4. **Database Security**
   - Use parameterized queries (Sequelize ORM)
   - Implement row-level security
   - Regular backups

## Vulnerability Response

### Reporting Security Issues
If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email: security@potchgim.co.za
3. Include: Description, steps to reproduce, potential impact
4. Wait for acknowledgment before disclosure

### Security Incident Response Plan
1. **Detection** - Log analysis, monitoring alerts
2. **Containment** - Isolate affected systems
3. **Investigation** - Determine scope and impact
4. **Remediation** - Patch vulnerabilities, update systems
5. **Communication** - Notify affected users
6. **Prevention** - Implement additional safeguards

## Compliance

### Data Protection
- User data encrypted at rest and in transit
- HTTPS enforced for all connections
- Minimal data collection principle
- User consent for data processing

### Privacy
- User profile visibility controls
- Opt-in/opt-out preferences respected
- Data retention policies enforced
- Right to deletion honored

## Security Testing Checklist

- [ ] XSS Prevention - All user input sanitized
- [ ] SQL Injection - Using ORM with parameterized queries
- [ ] CSRF Protection - Token validation on state-changing operations
- [ ] Authentication - Strong password requirements enforced
- [ ] Authorization - Role-based access control working
- [ ] Session Management - Tokens expire appropriately
- [ ] File Upload - Validation and size limits enforced
- [ ] Rate Limiting - Brute force protection active
- [ ] HTTPS - Enforced in production
- [ ] Security Headers - All headers present
- [ ] CSP - Content Security Policy configured
- [ ] Dependency Audit - No critical vulnerabilities

## Security Monitoring

### Logs to Monitor
1. Failed login attempts (>3 per user per hour)
2. CSP violations
3. 401/403 errors
4. Rate limit triggers
5. File upload rejections
6. Unusual API patterns

### Alerting Thresholds
- Failed logins: >10 per minute (possible brute force)
- CSP violations: >5 per minute (possible XSS attempt)
- Large file uploads: >10MB (quota bypass attempt)
- API errors: >50 per minute (possible DDoS)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Last Updated
December 12, 2025

---

**Note:** Security is an ongoing process. This document should be reviewed and updated regularly as new threats emerge and new security measures are implemented.
