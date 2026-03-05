// Load environment variables FIRST - this import must be first!
import './env';

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { testConnection, startHealthCheck, closeConnection, sequelize } from './db/connection';
import logger from './utils/logger';
import { securityHeaders, requestId } from './middleware/security';
import './models'; // Import to register model associations
import authRoutes from './routes/auth';
import alumniRoutes from './routes/alumni';
import yearGroupsRoutes from './routes/yearGroups';
import adminRoutes from './routes/admin';
import storiesRoutes from './routes/stories';
import memorialsRoutes from './routes/memorials';
import reunionsRoutes from './routes/reunions';
import notificationsRoutes from './routes/notifications';
import membershipRoutes from './routes/membership';
import yearGroupPostsRoutes from './routes/yearGroupPosts';
import projectsRoutes from './routes/projects';
import pushRoutes from './routes/push';
import expoPushRoutes from './routes/expoPush';

// Track database readiness for health checks
let dbReady = false;

/**
 * Validate required environment variables
 * Fail fast if critical config is missing
 */
function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  // JWT_SECRET is validated in jwt.ts, but double-check here
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  }

  // In production, require CORS_ORIGIN
  if (isProduction && !process.env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN is required in production');
  }

  // Require database configuration
  if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    errors.push('DB_HOST or DATABASE_URL is required');
  }

  if (errors.length > 0) {
    logger.error('🚨 CRITICAL: Environment validation failed!');
    errors.forEach(err => logger.error(`  - ${err}`));
    if (isProduction) {
      process.exit(1);
    } else {
      logger.warn('⚠️  Continuing in development mode despite missing config');
    }
  } else {
    logger.info('✅ Environment validation passed');
  }
}

// Validate environment on startup
validateEnvironment();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Request ID middleware - Apply first
app.use(requestId);

// Request performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Log slow requests (>1000ms) at warn level, others at debug
    const logLevel = duration > 1000 ? 'warn' : 'debug';
    logger[logLevel](`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: (req as any).requestId,
    });
  });
  next();
});

// CORS must be applied BEFORE security headers to work properly
// In production, only allow origins from CORS_ORIGIN environment variable
// In development, allow localhost origins for convenience
const isProduction = process.env.NODE_ENV === 'production';

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:8081',
  'http://192.168.0.28:3000',
  'http://192.168.0.28:5173',
  'http://192.168.0.28:3001',
];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

// In production: only use env origins. In development: merge both
const allowedOrigins = isProduction
  ? envOrigins
  : [...new Set([...developmentOrigins, ...envOrigins])];

// Warn if no CORS origins configured in production
if (isProduction && allowedOrigins.length === 0) {
  logger.warn('⚠️  WARNING: No CORS_ORIGIN configured for production! API may be inaccessible.');
}

app.use(cors({
  origin: (origin, callback) => {
    // In production, require Origin header for security
    // In development, allow requests without Origin (curl, mobile apps)
    if (!origin) {
      if (isProduction) {
        // Reject requests without Origin in production (prevents CORS bypass)
        return callback(new Error('Origin header required'));
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (!isProduction && origin.endsWith('.ngrok-free.app')) {
      // Allow ngrok tunnels in development for mobile app testing
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token', 'ngrok-skip-browser-warning'],
}));

// Security headers - Apply after CORS
app.use(securityHeaders);

// Request timeout middleware (60 seconds - allows time for image processing)
app.use((req, res, next) => {
  req.setTimeout(60000, () => {
    res.status(408).json({
      error: 'Request timeout',
      details: 'Request took too long to process',
    });
  });
  next();
});

// Rate limiting - General API limiter
// More lenient in development, stricter in production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 in dev, 100 in prod
  message: {
    error: 'Too many requests',
    details: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    details: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Very strict rate limiter for security answer verification (password reset)
// Only 3 attempts per 30 minutes to prevent brute force attacks
const securityAnswerLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // Limit each IP to 3 attempts per windowMs
  message: {
    error: 'Too many security answer attempts',
    details: 'Too many incorrect security answer attempts. Please try again after 30 minutes or contact an administrator.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password/verify-answer', securityAnswerLimiter);
// Body size limit for base64 images (10MB max to prevent storage exhaustion)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public/uploads directory
// This allows the frontend to access processed AVIF images
app.use('/uploads', express.static(`${process.cwd()}/public/uploads`));

// Health check with database verification
app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      db: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      db: 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness probe - only returns OK when fully initialized
app.get('/ready', (_req, res) => {
  if (!dbReady) {
    return res.status(503).json({ ready: false, message: 'Database not ready' });
  }
  return res.json({ ready: true });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/year-groups', yearGroupsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/memorials', memorialsRoutes);
app.use('/api/reunions', reunionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/year-group-posts', yearGroupPostsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/expo-push', expoPushRoutes);

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({
    error: 'Not found',
    details: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ UNCAUGHT EXCEPTION! Shutting down gracefully...');
  logger.error('Error:', error);
  // Don't exit - let the server keep running
  // process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('❌ UNHANDLED REJECTION! Promise:', promise, 'Reason:', reason);
  // Don't exit - let the server keep running
  // process.exit(1);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📡 API available at http://localhost:${PORT}/api`);
  logger.info(`🔒 Environment: ${isProduction ? 'PRODUCTION' : 'development'}`);
  logger.info(`🌍 CORS enabled for: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '(none configured)'}`);
  logger.info(`🛡️  Rate limiting enabled (100 req/15min general, 5 req/15min auth, 3 req/30min security answer)`);
  
  // Test database connection (non-blocking)
  logger.info('🔌 Testing database connection...');
  testConnection().then((dbConnected) => {
    if (!dbConnected) {
      logger.warn('⚠️  WARNING: Database connection failed. Some features may not work.');
      dbReady = false;
    } else {
      logger.info('✅ Database connection successful');
      dbReady = true;
      // Start health check monitoring
      startHealthCheck(60000); // Check every 60 seconds
    }
  }).catch((err) => {
    logger.error('⚠️  Database connection test error:', err.message);
    dbReady = false;
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    try {
      await closeConnection();
    } catch (error: any) {
      logger.error('Error closing database:', error.message);
    }
    
    logger.info('Process terminated');
    process.exit(0);
  });
  
  // Force shutdown after 60 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 60 seconds');
    process.exit(1);
  }, 60000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

