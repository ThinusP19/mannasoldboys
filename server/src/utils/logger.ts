/**
 * Structured Logging Utility with Winston
 * Provides JSON-formatted logs in production, human-readable in development
 * Backwards compatible with existing console.log style calls
 */
import winston from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize data before logging (remove sensitive fields)
 */
const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'authToken', 'adminAuthToken', 'jwt', 'apiKey', 'apikey', 'securityAnswer'];

const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

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

// Custom format for sanitizing sensitive data
const sanitizeFormat = winston.format((info) => {
  // Sanitize the message if it's an object
  if (info.message && typeof info.message === 'object') {
    info.message = sanitizeData(info.message);
  }
  // Sanitize any additional metadata
  const sanitizedInfo = { ...info };
  for (const key in sanitizedInfo) {
    if (key !== 'level' && key !== 'message' && key !== 'timestamp') {
      sanitizedInfo[key] = sanitizeData(sanitizedInfo[key]);
    }
  }
  return sanitizedInfo;
});

// Create Winston logger
const winstonLogger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    sanitizeFormat(),
    isProduction
      ? winston.format.json() // JSON format for production (easier to parse by log aggregators)
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${typeof message === 'object' ? JSON.stringify(message) : message}${metaStr}`;
          })
        )
  ),
  transports: [
    new winston.transports.Console(),
    // In production, also write to files
    ...(isProduction
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

/**
 * Format multiple arguments into a single log message
 * Backwards compatible with console.log style: logger.info('message', data1, data2)
 */
const formatArgs = (args: any[]): { message: string; meta?: object } => {
  if (args.length === 0) {
    return { message: '' };
  }

  // First arg is always the message
  const [first, ...rest] = args;
  const message = typeof first === 'string' ? first : JSON.stringify(sanitizeData(first));

  // If there are additional args, combine them into meta
  if (rest.length === 0) {
    return { message };
  }

  if (rest.length === 1 && typeof rest[0] === 'object' && rest[0] !== null && !(rest[0] instanceof Error)) {
    return { message, meta: sanitizeData(rest[0]) };
  }

  // Multiple args - combine into an array in meta
  const meta = { data: rest.map((arg: any) => {
    if (arg instanceof Error) {
      return { error: arg.message, stack: isDevelopment ? arg.stack : undefined };
    }
    return sanitizeData(arg);
  })};

  return { message, meta };
};

/**
 * Logger utility that wraps Winston
 * Maintains backwards compatibility with existing console.log style calls
 */
export const logger = {
  /**
   * Log info messages
   */
  info: (...args: any[]) => {
    const { message, meta } = formatArgs(args);
    if (meta) {
      winstonLogger.info(message, meta);
    } else {
      winstonLogger.info(message);
    }
  },

  /**
   * Log error messages
   */
  error: (...args: any[]) => {
    const { message, meta } = formatArgs(args);
    if (meta) {
      winstonLogger.error(message, meta);
    } else {
      winstonLogger.error(message);
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args: any[]) => {
    const { message, meta } = formatArgs(args);
    if (meta) {
      winstonLogger.warn(message, meta);
    } else {
      winstonLogger.warn(message);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    const { message, meta } = formatArgs(args);
    if (meta) {
      winstonLogger.debug(message, meta);
    } else {
      winstonLogger.debug(message);
    }
  },

  /**
   * Log with custom level
   */
  log: (level: 'info' | 'error' | 'warn' | 'debug', ...args: any[]) => {
    const { message, meta } = formatArgs(args);
    if (meta) {
      winstonLogger.log(level, message, meta);
    } else {
      winstonLogger.log(level, message);
    }
  },

  /**
   * Get the underlying Winston logger for advanced usage
   */
  getWinstonLogger: () => winstonLogger,
};

export default logger;
