import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRole } from './jwt.strategy';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
