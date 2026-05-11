/**
 * Helpers to bootstrap a Nest instance for integration tests.
 *
 * - Mocks the DRIZZLE provider
 * - Replaces JwtAuthGuard with a test guard that injects req.user from the X-Test-User header
 * - Keeps RolesGuard, ValidationPipe and Reflector real
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Database, DRIZZLE } from '../src/database/database.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { IS_PUBLIC_KEY } from '../src/auth/public.decorator';

@Injectable()
export class TestJwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const req = context.switchToHttp().getRequest();
    const header = req.headers['x-test-user'];
    if (!header) throw new UnauthorizedException();
    const parsed = JSON.parse(
      Buffer.from(String(header), 'base64').toString('utf8'),
    );
    req.user = parsed;
    return true;
  }
}

export function asTestUser(user: { id: string; email?: string; role: 'admin' | 'student' }) {
  return Buffer.from(
    JSON.stringify({ email: 'test@x.com', ...user }),
  ).toString('base64');
}

export interface AppHandle {
  app: INestApplication;
  db: Database;
  close: () => Promise<void>;
}

export async function createTestApp(opts: {
  controllers: any[];
  providers?: any[];
  db: Partial<Database>;
}): Promise<AppHandle> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
    ],
    controllers: opts.controllers,
    providers: [
      ...(opts.providers ?? []),
      { provide: DRIZZLE, useValue: opts.db },
      { provide: APP_GUARD, useClass: TestJwtAuthGuard },
      { provide: APP_GUARD, useClass: RolesGuard },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(TestJwtAuthGuard)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  return {
    app,
    db: opts.db as Database,
    close: () => app.close(),
  };
}
