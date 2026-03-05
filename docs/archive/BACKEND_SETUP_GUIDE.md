# Complete Backend Setup Guide
## Database, JWT Authentication, Admin Roles & Security

This guide provides a complete step-by-step breakdown of setting up a production-ready backend with:
- **MSSQL Database** with Sequelize ORM
- **JWT Authentication** system
- **Admin Role Management**
- **Security Headers & Middleware**
- **Password Hashing**
- **Rate Limiting**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Step 1: Install Dependencies](#step-1-install-dependencies)
4. [Step 2: Environment Variables](#step-2-environment-variables)
5. [Step 3: Database Connection Setup](#step-3-database-connection-setup)
6. [Step 4: User Model](#step-4-user-model)
7. [Step 5: Password Utilities](#step-5-password-utilities)
8. [Step 6: JWT Utilities](#step-6-jwt-utilities)
9. [Step 7: Authentication Middleware](#step-7-authentication-middleware)
10. [Step 8: Admin Middleware](#step-8-admin-middleware)
11. [Step 9: Security Headers](#step-9-security-headers)
12. [Step 10: Auth Routes](#step-10-auth-routes)
13. [Step 11: Express App Setup](#step-11-express-app-setup)
14. [Step 12: Testing](#step-12-testing)

---

## Prerequisites

- Node.js (v18+)
- MSSQL Server (SQL Server 2019+)
- TypeScript knowledge
- Basic Express.js knowledge

---

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   └── connection.ts          # Database connection & health checks
│   ├── models/
│   │   ├── User.ts                 # User model with roles
│   │   └── index.ts                # Model associations
│   ├── middleware/
│   │   ├── auth.ts                 # JWT authentication middleware
│   │   ├── admin.ts                # Admin role middleware
│   │   └── security.ts             # Security headers
│   ├── routes/
│   │   └── auth.ts                 # Authentication routes
│   ├── utils/
│   │   ├── jwt.ts                  # JWT token generation/verification
│   │   ├── password.ts             # Password hashing utilities
│   │   └── logger.ts               # Logging utility
│   └── index.ts                    # Express app entry point
├── .env                            # Environment variables
├── .env.example                    # Example env file
├── package.json
└── tsconfig.json
```

---

## Step 1: Install Dependencies

```bash
npm install express cors dotenv express-rate-limit jsonwebtoken bcryptjs sequelize tedious zod
npm install -D @types/express @types/cors @types/jsonwebtoken @types/bcryptjs @types/node @types/tedious typescript ts-node nodemon
```

**Key Dependencies:**
- `sequelize` + `tedious`: MSSQL database ORM
- `jsonwebtoken`: JWT token handling
- `bcryptjs`: Password hashing
- `zod`: Input validation
- `express-rate-limit`: Rate limiting
- `cors`: Cross-origin resource sharing

---

## Step 2: Environment Variables

Create `.env` file in your `server/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (MSSQL)
DB_HOST=localhost
DB_PORT=1433
DB_NAME=your_database_name
DB_USER=your_username
DB_PASS=your_password
DB_ENCRYPT=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-long-for-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Logging (optional)
LOG_LEVEL=info
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 64
```

**Important:** Never commit `.env` to git. Add to `.gitignore`:
```
.env
```

---

## Step 3: Database Connection Setup

Create `src/db/connection.ts`:

```typescript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

// Load .env from server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Database configuration from environment variables
const dbConfig = {
  dialect: 'mssql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || '',
  username: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  dialectOptions: {
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: true,
      connectTimeout: 30000,
      requestTimeout: 30000,
      enableArithAbort: true,
      // For IP addresses, disable encryption
      ...(process.env.DB_HOST?.match(/^\d+\.\d+\.\d+\.\d+$/) && {
        encrypt: false,
        trustServerCertificate: true,
      }),
    },
  },
  logging: process.env.NODE_ENV === 'development' ? logger.debug : false,
  pool: {
    max: 20,
    min: 2,
    acquire: 60000,
    idle: 30000,
    evict: 10000,
    handleDisconnects: true,
  },
  retry: {
    max: 3,
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeConnectionTimedOutError/,
    ],
  },
  isolationLevel: 'READ_COMMITTED',
};

// Create Sequelize instance
export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    retry: dbConfig.retry,
    isolationLevel: dbConfig.isolationLevel,
  }
);

// Connection health check with retry logic
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry(): Promise<boolean> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await sequelize.authenticate();
      connectionRetries = 0;
      return true;
    } catch (error: any) {
      connectionRetries++;
      logger.warn(`Database connection attempt ${connectionRetries}/${MAX_RETRIES} failed:`, error.message);
      
      if (i < MAX_RETRIES - 1) {
        logger.info(`Retrying database connection in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        logger.error('❌ Unable to connect to database after all retry attempts');
        return false;
      }
    }
  }
  return false;
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const connected = await connectWithRetry();
    if (connected) {
      logger.info('✅ Database connection established successfully.');
      try {
        await sequelize.query('SELECT 1 AS test');
        logger.info('✅ Database query test successful');
      } catch (queryError: any) {
        logger.warn('⚠️  Database connection established but query test failed:', queryError.message);
      }
      return true;
    }
    return false;
  } catch (error: any) {
    logger.error('❌ Database connection error:', error.message);
    return false;
  }
}

// Connection health monitor
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startHealthCheck(intervalMs: number = 60000): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      await sequelize.query('SELECT 1 AS health_check');
      logger.debug('✅ Database health check passed');
    } catch (error: any) {
      logger.error('❌ Database health check failed:', error.message);
      await connectWithRetry();
    }
  }, intervalMs);
  
  logger.info(`✅ Database health check started (interval: ${intervalMs / 1000}s)`);
}

export function stopHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Database health check stopped');
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  stopHealthCheck();
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed gracefully');
  } catch (error: any) {
    logger.error('❌ Error closing database connection:', error.message);
  }
}

export default sequelize;
```

---

## Step 4: User Model

Create `src/models/User.ts`:

```typescript
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'alumni'; // or 'user' for your project
  isMember?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isMember'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'admin' | 'alumni';
  public isMember!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'alumni', // or 'user'
      validate: {
        isIn: [['admin', 'alumni']], // or ['admin', 'user']
      },
    },
    isMember: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
```

---

## Step 5: Logger Utility

Create `src/utils/logger.ts`:

```typescript
/**
 * Secure Logging Utility
 * Prevents sensitive data exposure in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize data before logging (remove sensitive fields)
 */
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'authToken', 'adminAuthToken', 'jwt', 'apiKey', 'apikey'];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Logger utility that respects NODE_ENV
 */
export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      const sanitized = args.map(arg => sanitizeData(arg));
      console.log(...sanitized);
    }
  },

  /**
   * Log error messages (always logged, but sanitized in production)
   */
  error: (...args: any[]) => {
    const sanitized = isProduction ? args.map(arg => sanitizeData(arg)) : args;
    console.error(...sanitized);
  },

  /**
   * Log warning messages (always logged, but sanitized in production)
   */
  warn: (...args: any[]) => {
    const sanitized = isProduction ? args.map(arg => sanitizeData(arg)) : args;
    console.warn(...sanitized);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      const sanitized = args.map(arg => sanitizeData(arg));
      console.debug(...sanitized);
    }
  },

  /**
   * Log with custom level
   */
  log: (level: 'info' | 'error' | 'warn' | 'debug', ...args: any[]) => {
    logger[level](...args);
  },
};

export default logger;
```

---

## Step 6: Password Utilities

Create `src/utils/password.ts`:

```typescript
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
```

---

## Step 7: JWT Utilities

Create `src/utils/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';
import logger from './logger';

// Ensure JWT_SECRET is always a string
const DEFAULT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
const JWT_SECRET = (process.env.JWT_SECRET || DEFAULT_SECRET) as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string;

// Validate JWT secret on startup
if (JWT_SECRET === DEFAULT_SECRET) {
  logger.error('🚨 CRITICAL SECURITY WARNING: Using default JWT secret!');
  logger.error('🚨 Change JWT_SECRET in .env file immediately!');
  logger.error('🚨 Generate a strong secret: openssl rand -base64 64');
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_SECRET must be set in production environment.');
  }
} else if (JWT_SECRET.length < 32) {
  logger.warn('⚠️  WARNING: JWT_SECRET is too short. Recommended minimum: 64 characters');
} else {
  logger.info('✅ JWT_SECRET is properly configured');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload as any, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as any);
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as JWTPayload;
    }
    throw new Error('Invalid token format');
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

---

## Step 8: Authentication Middleware

Create `src/middleware/auth.ts`:

```typescript
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
 * Use this for protected routes
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
 * Use this for public routes that can show different content for logged-in users
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
```

---

## Step 9: Admin Middleware

Create `src/middleware/admin.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth';

/**
 * Admin-only middleware - requires authentication and admin role
 * Use this for admin-only routes
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
```

---

## Step 10: Security Headers

Create `src/middleware/security.ts`:

```typescript
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
  const cspDirectives = process.env.NODE_ENV === 'production'
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self'",
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
        "connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:5173 ws://localhost:*",
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

  // Cross-Origin-Opener-Policy - Isolate browsing context
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }

  // Cross-Origin-Resource-Policy - Control resource loading
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
```

---

## Step 11: Auth Routes

Create `src/routes/auth.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name } = validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email']
    });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        details: 'An account with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'alumni', // or 'user' for your project
      isMember: false,
    });

    // Generate token
    const token = generateToken({
      userId: String(user.id),
      email: user.email,
      role: user.role,
    });

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isMember: user.isMember,
    };

    return res.status(201).json({
      user: userData,
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Registration error:', error);
    return res.status(500).json({
      error: 'Failed to register user',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    
    // Find user
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'name', 'role', 'isMember']
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect',
      });
    }
    
    // Generate token
    const token = generateToken({
      userId: String(user.id),
      email: user.email,
      role: user.role,
    });

    // Return user data (without password)
    const userData = {
      id: String(user.id),
      email: String(user.email),
      name: String(user.name),
      role: String(user.role),
      isMember: Boolean(user.isMember),
    };

    return res.json({
      user: userData,
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Login error:', error);
    return res.status(500).json({
      error: 'Failed to login',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Find user
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'name', 'role', 'isMember']
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account does not exist',
      });
    }

    // Return user data
    const userData = {
      id: String(user.id),
      email: String(user.email),
      name: String(user.name),
      role: String(user.role),
      isMember: Boolean(user.isMember),
    };

    return res.json(userData);
  } catch (error: any) {
    logger.error('Get user error:', error);
    return res.status(500).json({
      error: 'Failed to get user',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;
```

---

## Step 12: Express App Setup

Create `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { testConnection, startHealthCheck, closeConnection } from './db/connection';
import logger from './utils/logger';
import { securityHeaders, requestId } from './middleware/security';
import './models'; // Import to register model associations
import authRoutes from './routes/auth';
import { requireAdmin } from './middleware/admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Request ID middleware - Apply first
app.use(requestId);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Security headers - Apply after CORS
app.use(securityHeaders);

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({
      error: 'Request timeout',
      details: 'Request took too long to process',
    });
  });
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests',
    details: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    details: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbConnected = await testConnection();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'unhealthy',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Example protected route
app.get('/api/protected', authenticate, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
  });
});

// Example admin-only route
app.get('/api/admin', requireAdmin, (req, res) => {
  res.json({
    message: 'This is an admin-only route',
    user: req.user,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    details: 'Route not found',
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('❌ Failed to connect to database. Server will not start.');
      process.exit(1);
    }

    // Start database health check
    startHealthCheck(60000); // Check every 60 seconds

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error: any) {
    logger.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

// Start the server
startServer();
```

**Don't forget to import `requireAdmin` in `index.ts`:**
```typescript
import { requireAdmin } from './middleware/admin';
```

---

## Step 13: Testing

### 1. Test Database Connection

Create `src/test-connection.ts`:

```typescript
import { testConnection } from './db/connection';

testConnection()
  .then((connected) => {
    if (connected) {
      console.log('✅ Database connection successful!');
      process.exit(0);
    } else {
      console.log('❌ Database connection failed!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

Run: `npm run test-connection`

### 2. Create Database Tables

Create `src/sync-database.ts`:

```typescript
import sequelize from './db/connection';
import './models'; // Import all models

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: true }); // Use { force: true } to drop and recreate
    console.log('✅ Database tables synced successfully.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();
```

Add to `package.json`:
```json
{
  "scripts": {
    "sync-db": "ts-node src/sync-database.ts"
  }
}
```

Run: `npm run sync-db`

### 3. Create Admin User

Create `src/create-admin.ts`:

```typescript
import User from './models/User';
import { hashPassword } from './utils/password';
import sequelize from './db/connection';

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin User';

    // Check if admin exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('❌ Admin user already exists with this email.');
      process.exit(1);
    }

    // Create admin
    const hashedPassword = await hashPassword(password);
    const admin = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      isMember: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
```

Add to `package.json`:
```json
{
  "scripts": {
    "create-admin": "ts-node src/create-admin.ts"
  }
}
```

Run: `npm run create-admin admin@example.com admin123 "Admin Name"`

### 4. Test API Endpoints

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get Current User (Protected):**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Test Protected Route:**
```bash
curl -X GET http://localhost:3001/api/protected \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Test Admin Route:**
```bash
curl -X GET http://localhost:3001/api/admin \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

---

## Usage Examples

### Protecting Routes

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// Public route
router.get('/public', (req, res) => {
  res.json({ message: 'This is public' });
});

// Protected route (requires authentication)
router.get('/protected', authenticate, (req, res) => {
  res.json({ 
    message: 'This is protected',
    user: req.user // Access user from token
  });
});

// Admin-only route
router.get('/admin-only', requireAdmin, (req, res) => {
  res.json({ 
    message: 'This is admin only',
    user: req.user
  });
});

// Optional auth (works with or without token)
router.get('/optional', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: 'You are logged in', user: req.user });
  } else {
    res.json({ message: 'You are not logged in' });
  }
});

export default router;
```

### Accessing User in Routes

```typescript
router.get('/my-data', authenticate, async (req, res) => {
  const userId = req.user!.userId; // From JWT token
  const userRole = req.user!.role;
  const userEmail = req.user!.email;

  // Use userId to fetch user-specific data
  const userData = await User.findByPk(userId);
  
  res.json({ user: userData });
});
```

---

## Frontend Integration

### Storing Token

```typescript
// After login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { user, token } = await response.json();

// Store token
localStorage.setItem('token', token);
```

### Using Token in Requests

```typescript
const token = localStorage.getItem('token');

const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong JWT secrets** - Minimum 64 characters, use `openssl rand -base64 64`
3. **Hash passwords** - Always use bcrypt, never store plain text
4. **Validate input** - Use Zod for all user input
5. **Rate limiting** - Prevent brute force attacks
6. **HTTPS in production** - Always use HTTPS in production
7. **Security headers** - Implement all recommended headers
8. **Connection pooling** - Configure database connection pool
9. **Error handling** - Don't expose sensitive error details in production
10. **Token expiration** - Set reasonable token expiration times

---

## Troubleshooting

### Database Connection Issues

1. **Check MSSQL is running:**
   ```bash
   # Windows
   net start MSSQLSERVER
   
   # Check if port 1433 is open
   telnet localhost 1433
   ```

2. **Verify credentials in `.env`**
3. **Check firewall settings**
4. **Verify SQL Server allows remote connections**

### JWT Issues

1. **Token expired** - Check `JWT_EXPIRES_IN` in `.env`
2. **Invalid secret** - Ensure `JWT_SECRET` matches across restarts
3. **Token format** - Ensure frontend sends `Bearer TOKEN`

### CORS Issues

1. **Add frontend URL to `CORS_ORIGIN` in `.env`**
2. **Check credentials flag** - Ensure `credentials: true` in CORS config

---

## Summary

This setup provides:

✅ **Secure Database Connection** with retry logic and health checks  
✅ **JWT Authentication** with token generation and verification  
✅ **Role-Based Access Control** (Admin vs User)  
✅ **Password Security** with bcrypt hashing  
✅ **Security Headers** following OWASP guidelines  
✅ **Rate Limiting** to prevent abuse  
✅ **Input Validation** with Zod  
✅ **Error Handling** with proper logging  
✅ **Type Safety** with TypeScript  

You can now use this foundation in any project and extend it with your specific models and routes!

---

## Next Steps

1. Create additional models (Profile, Posts, etc.)
2. Add more routes (CRUD operations)
3. Implement file uploads
4. Add email notifications
5. Set up logging service
6. Add API documentation (Swagger/OpenAPI)

---

**Questions?** This setup is production-ready and follows industry best practices. Customize the role names (`admin`/`alumni` → `admin`/`user`) and add your project-specific models as needed.

