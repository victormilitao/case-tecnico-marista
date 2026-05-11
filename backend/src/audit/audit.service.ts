import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Database, DRIZZLE } from '../database/database.module';
import { auditLogs } from '../database/schema';
import { AuditAction } from './audit.decorator';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

export interface RecordAuditEntry {
  userId: string | null;
  userEmail: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  payload: unknown;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async record(entry: RecordAuditEntry) {
    try {
      await this.db.insert(auditLogs).values({
        userId: entry.userId,
        userEmail: entry.userEmail,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        payload: entry.payload as never,
      });
    } catch (err) {
      this.logger.error('Falha ao registrar auditoria', err as Error);
    }
  }

  async list(query: ListAuditLogsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const filters = [];
    if (query.entity) filters.push(eq(auditLogs.entity, query.entity));
    if (query.action) filters.push(eq(auditLogs.action, query.action));
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [{ total }] = await this.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(auditLogs)
      .where(where);

    const items = await this.db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, page, pageSize, total };
  }
}
