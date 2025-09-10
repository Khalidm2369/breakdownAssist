import test from 'node:test';
import assert from 'node:assert/strict';
import { JwtRequiredGuard } from '../jwt-required.guard';
import { UnauthorizedException } from '@nestjs/common';

class MockAuth {
  calledWith: string | null = null;
  constructor(private readonly payload: any, private readonly shouldThrow = false) {}
  verify(token: string) {
    this.calledWith = token;
    if (this.shouldThrow) throw new Error('bad');
    return this.payload;
  }
}

test('JwtRequiredGuard relies on AuthService.verify and sets req.userId', async () => {
  const auth = new MockAuth({ sub: 'user-1' });
  const guard = new JwtRequiredGuard(auth as any);
  const req: any = { headers: { authorization: 'Bearer token123' } };
  const ctx: any = { switchToHttp: () => ({ getRequest: () => req }) };
  const ok = await guard.canActivate(ctx);
  assert.equal(ok, true);
  assert.equal(auth.calledWith, 'token123');
  assert.equal(req.userId, 'user-1');
});

test('JwtRequiredGuard throws UnauthorizedException when verify fails', async () => {
  const auth = new MockAuth(null, true);
  const guard = new JwtRequiredGuard(auth as any);
  const req: any = { headers: { authorization: 'Bearer token123' } };
  const ctx: any = { switchToHttp: () => ({ getRequest: () => req }) };
  await assert.rejects(guard.canActivate(ctx), UnauthorizedException);
});