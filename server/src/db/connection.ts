import { Sequelize } from 'sequelize';
import logger from '../utils/logger';

// Note: dotenv is loaded in env.ts which must be imported first in index.ts

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
      // Connection timeout (10 seconds - fail fast)
      connectTimeout: 10000,
      // Request timeout (10 seconds - fail fast)
      requestTimeout: 10000,
      // Enable connection retry
      enableArithAbort: true,
      // For IP addresses, disable encryption
      ...(process.env.DB_HOST?.match(/^\d+\.\d+\.\d+\.\d+$/) && {
        encrypt: false,
        trustServerCertificate: true,
      }),
    },
  },
  logging: process.env.NODE_ENV === 'development' ? (sql: string) => logger.debug('SQL:', sql) : false,
  // Enhanced connection pool for heavy traffic
  pool: {
    max: 20, // Increased from 5 to handle more concurrent connections
    min: 0, // Don't keep connections alive if DB is down
    acquire: 10000, // Reduced timeout for acquiring connection (10 seconds - fail fast)
    idle: 10000, // Reduced idle timeout (10 seconds)
    evict: 5000, // Check for idle connections every 5 seconds
    handleDisconnects: true, // Automatically reconnect on disconnect
  },
  // Retry configuration
  retry: {
    max: 3, // Maximum retry attempts
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
    ],
  },
  // Transaction isolation level
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
      connectionRetries = 0; // Reset on success
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

// Test connection function with retry
export async function testConnection(): Promise<boolean> {
  try {
    const connected = await connectWithRetry();
    if (connected) {
      logger.info('✅ Database connection has been established successfully.');
      
      // Test query to ensure connection is working
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
    logger.error('Error details:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      error: error.message,
    });
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
      // Attempt to reconnect
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

