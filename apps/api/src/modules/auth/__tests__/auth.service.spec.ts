import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

test('verify returns payload for valid tokens', () => {
  const auth = new AuthService({} as any);
  const token = jwt.sign({ sub: 'u1' }, JWT_SECRET, { expiresIn: '1h' });
  const payload = auth.verify(token);
  assert.equal(payload.sub, 'u1');
});

test('verify throws UnauthorizedException for malformed tokens', () => {
  const auth = new AuthService({} as any);
  assert.throws(() => auth.verify('bad.token'), UnauthorizedException);
});

test('verify throws UnauthorizedException for expired tokens', () => {
  const auth = new AuthService({} as any);
  const token = jwt.sign({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 10 }, JWT_SECRET);
  assert.throws(() => auth.verify(token), UnauthorizedException);
});