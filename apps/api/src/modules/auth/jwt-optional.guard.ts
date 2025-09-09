import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtOptionalGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { userId?: string }>();
    const authz = (req.headers['authorization'] as string | undefined) ?? '';

    if (authz.startsWith('Bearer ')) {
      const token = authz.slice(7);
      try {
        const { sub } = this.auth.verify(token);
        (req as any).userId = sub;
      } catch {
        // ignore – optional
      }
    }
    return true; // always allow; just enriches the request if token is valid
  }
}
