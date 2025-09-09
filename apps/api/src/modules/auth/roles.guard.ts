import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { PrismaService } from '../../prisma.service';
import { AuthService } from './auth.service';
import type { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService, private auth: AuthService) {}

  async canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles || roles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const authz = (req.headers['authorization'] || '') as string;
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!token) throw new UnauthorizedException('Missing token');

    let userId: string;
    try {
      userId = this.auth.verify(token).sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    const userRoles = await this.prisma.userRole.findMany({ where: { userId }, select: { role: true } });
    const ok = userRoles.some((ur) => roles.includes(ur.role));
    if (!ok) throw new ForbiddenException('Insufficient role');

    // expose userId downstream
    req.userId = userId;
    return true;
  }
}
