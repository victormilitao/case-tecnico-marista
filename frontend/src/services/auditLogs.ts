import { api } from './api';
import { AuditLogPage } from '../types';

export interface AuditLogsQuery {
  entity?: string;
  action?: 'create' | 'update' | 'delete';
  page?: number;
  pageSize?: number;
}

export const auditLogsApi = {
  list: (query: AuditLogsQuery = {}) =>
    api
      .get<AuditLogPage>('/audit-logs', { params: query })
      .then((r) => r.data),
};
