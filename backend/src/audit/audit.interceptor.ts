import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuthUser } from '../auth/current-user.decorator';
import {
  AUDIT_METADATA_KEY,
  AuditMetadata,
} from './audit.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMetadata | undefined>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params?: Record<string, string>;
      body?: unknown;
    }>();

    if (req.user?.role !== 'admin') return next.handle();

    return next.handle().pipe(
      tap((response) => {
        const entityId = extractEntityId(response, req.params);
        const payload = buildPayload(meta.action, req.body, response);

        void this.auditService.record({
          userId: req.user!.id,
          userEmail: req.user!.email,
          action: meta.action,
          entity: meta.entity,
          entityId,
          payload,
        });
      }),
    );
  }
}

function extractEntityId(
  response: unknown,
  params: Record<string, string> | undefined,
): string | null {
  if (response && typeof response === 'object' && 'id' in response) {
    const id = (response as { id?: unknown }).id;
    if (typeof id === 'string') return id;
  }
  if (params?.id) return params.id;
  return null;
}

function buildPayload(
  action: AuditMetadata['action'],
  body: unknown,
  response: unknown,
): unknown {
  if (action === 'delete') return null;
  if (action === 'create') return { input: body, result: response };
  return { changes: body };
}
