import { SetMetadata } from '@nestjs/common';

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditMetadata {
  entity: string;
  action: AuditAction;
}

export const AUDIT_METADATA_KEY = 'audit:metadata';

export const Audit = (entity: string, action: AuditAction) =>
  SetMetadata(AUDIT_METADATA_KEY, { entity, action } satisfies AuditMetadata);
