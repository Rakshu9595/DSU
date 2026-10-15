import { AuditLog } from '../models/AuditLog.js';

export class AuditLogService {
  async log(userId, projectId, action, resource, resourceId = null, details = {}, ip = null) {
    try {
      await AuditLog.create({
        userId,
        projectId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: ip
      });
    } catch (err) {
      // Do not fail user requests if audit logging encounters an error
      console.warn('Audit log write failed:', err.message);
    }
  }
}

export const auditLogService = new AuditLogService();
