import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtRequiredGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const authz = (req.headers?.authorization ?? '') as string;

    if (!authz.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const payload = this.auth.verify(authz.slice(7)); 
    req.userId = payload.sub;
    return true;
  }
}
