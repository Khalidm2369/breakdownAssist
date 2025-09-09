import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService, SignupInput } from './auth.service';

const COOKIE_NAME = 'vb_session';
const ROLES_COOKIE = 'vb_roles';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setCookies(res: Response, token: string, rolesCsv: string) {
    const secure = !!(process.env.NODE_ENV === 'production'); // set true in prod (HTTPS)
    // httpOnly session token for API calls
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    // non-httpOnly roles (web middleware reads this)
    res.cookie(ROLES_COOKIE, rolesCsv, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  }

  @Post('signup')
  @HttpCode(201)
  async signup(
    @Body()
    dto: SignupInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.auth.signup(dto);

    // also set cookies for browser
    this.setCookies(res, out.token, out.roles.join(','));

    // return both token (for SPA) and user/roles (for UI)
    return { token: out.token, user: out.user, roles: out.roles };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.auth.login(dto.email, dto.password);

    this.setCookies(res, out.token, out.roles.join(','));

    return { token: out.token, user: out.user, roles: out.roles };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.clearCookie(ROLES_COOKIE, { path: '/' });
    return { ok: true };
  }
}
