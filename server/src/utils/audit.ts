/**
 * Audit Logging Utility
 * Logs sensitive operations for compliance and debugging
 */
import logger from './logger';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'
  | 'SECURITY_ANSWER_VERIFIED'
  | 'SECURITY_ANSWER_FAILED'
  | 'MEMBERSHIP_APPROVED'
  | 'MEMBERSHIP_REJECTED'
  | 'MEMBERSHIP_REQUEST'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'ADMIN_ACTION';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  targetUserId?: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

/**
 * Log an audit event
 * In production, these should also be written to a database or external service
 */
export function logAudit(entry: AuditLogEntry): void {
  const timestamp = new Date().toISOString();

  const logEntry = {
    type: 'AUDIT',
    timestamp,
    ...entry,
  };

  // Log based on success/failure
  if (entry.success) {
    logger.info('AUDIT', logEntry);
  } else {
    logger.warn('AUDIT', logEntry);
  }

  // TODO: In production, also write to:
  // - Audit database table
  // - External logging service (Splunk, DataDog, etc.)
  // - SIEM system for security monitoring
}

/**
 * Helper function to log admin actions
 */
export function logAdminAction(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>,
  ipAddress?: string
): void {
  logAudit({
    action: 'ADMIN_ACTION',
    userId: adminUserId,
    targetType,
    targetId,
    details: { adminAction: action, ...details },
    ipAddress,
    success: true,
  });
}

/**
 * Helper function to log login attempts
 */
export function logLoginAttempt(
  email: string,
  success: boolean,
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  failureReason?: string
): void {
  logAudit({
    action: success ? 'LOGIN' : 'LOGIN_FAILED',
    userId,
    details: {
      email,
      ...(failureReason && { reason: failureReason }),
    },
    ipAddress,
    userAgent,
    success,
  });
}

/**
 * Helper function to log password changes
 */
export function logPasswordChange(
  userId: string,
  changedByUserId: string,
  isReset: boolean,
  ipAddress?: string
): void {
  logAudit({
    action: isReset ? 'PASSWORD_RESET' : 'PASSWORD_CHANGE',
    userId: changedByUserId,
    targetUserId: userId,
    targetType: 'user',
    targetId: userId,
    details: {
      isAdminReset: changedByUserId !== userId,
    },
    ipAddress,
    success: true,
  });
}

/**
 * Helper function to log membership status changes
 */
export function logMembershipChange(
  adminUserId: string,
  targetUserId: string,
  status: 'approved' | 'rejected',
  monthlyAmount?: number,
  rejectionReason?: string,
  ipAddress?: string
): void {
  logAudit({
    action: status === 'approved' ? 'MEMBERSHIP_APPROVED' : 'MEMBERSHIP_REJECTED',
    userId: adminUserId,
    targetUserId,
    targetType: 'membership',
    targetId: targetUserId,
    details: {
      status,
      ...(monthlyAmount && { monthlyAmount }),
      ...(rejectionReason && { reason: rejectionReason }),
    },
    ipAddress,
    success: true,
  });
}

export default {
  logAudit,
  logAdminAction,
  logLoginAttempt,
  logPasswordChange,
  logMembershipChange,
};
