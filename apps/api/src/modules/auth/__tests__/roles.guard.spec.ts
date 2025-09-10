import test from 'node:test';
import assert from 'node:assert/strict';
import { RolesGuard } from '../roles.guard';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

class MockReflector {
  constructor(private readonly roles: any[]) {}
  getAllAndOverride() { return this.roles; }
}

class MockPrisma {
  constructor(private readonly roles: any[]) {}
  userRole = { findMany: async (args: any) => this.roles.map(role => ({ role })) };
}

class MockAuth {
  calledWith: string | null = null;
  constructor(private readonly payload: any, private readonly shouldThrow = false) {}
  verify(token: string) {
    this.calledWith = token;
    if (this.shouldThrow) throw new Error('bad');
    return this.payload;
  }
}

test('RolesGuard uses AuthService.verify, checks roles, and sets req.userId', async () => {
  const reflector = new MockReflector(['ADMIN']);
  const prisma = new MockPrisma(['ADMIN']);
  const auth = new MockAuth({ sub: 'user-1' });
  const guard = new RolesGuard(reflector as any, prisma as any, auth as any);
  const req: any = { headers: { authorization: 'Bearer token123' } };
  const ctx: any = { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => null, getClass: () => null };
  const ok = await guard.canActivate(ctx);
  assert.equal(ok, true);
  assert.equal(auth.calledWith, 'token123');
  assert.equal(req.userId, 'user-1');
});

test('RolesGuard throws UnauthorizedException when verify fails', async () => {
  const reflector = new MockReflector(['ADMIN']);
  const prisma = new MockPrisma([]);
  const auth = new MockAuth(null, true);
  const guard = new RolesGuard(reflector as any, prisma as any, auth as any);
  const req: any = { headers: { authorization: 'Bearer token123' } };
  const ctx: any = { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => null, getClass: () => null };
  await assert.rejects(guard.canActivate(ctx), UnauthorizedException);
});

test('RolesGuard throws ForbiddenException when roles do not match', async () => {
  const reflector = new MockReflector(['ADMIN']);
  const prisma = new MockPrisma(['USER']);
  const auth = new MockAuth({ sub: 'user-1' });
  const guard = new RolesGuard(reflector as any, prisma as any, auth as any);
  const req: any = { headers: { authorization: 'Bearer token123' } };
  const ctx: any = { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => null, getClass: () => null };
  await assert.rejects(guard.canActivate(ctx), ForbiddenException);
});