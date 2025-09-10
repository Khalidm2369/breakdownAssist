import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { Role } from './roles';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export type SignupInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** primary account type the user is creating as */
  role?: Role; // defaults to CUSTOMER
  /** provider-only extras */
  businessName?: string;
  serviceTypes?: string[]; // e.g. ["Towing","Express Parcel Delivery"]
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------- helpers ------------------------------- */

  private sign(userId: string) {
    // keep `sub` for guards that read req.userId from `sub`
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  private async getRolesForUser(userId: string): Promise<RoleUpper[]> {
    const rs = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });
    return rs.map((r) => r.role) as RoleUpper[];
  }

  verify(token: string): { sub: string } {
    try {
      return jwt.verify(token, JWT_SECRET) as { sub: string };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /* -------------------------------- signup ------------------------------- */
  async signup(input: SignupInput) {
    const email = (input.email || '').trim().toLowerCase();
    if (!email || !input.password) {
      throw new BadRequestException('Email and password are required');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phone: input.phone ?? null,
      },
    });

    // Everyone gets CUSTOMER by default
    await this.prisma.userRole.create({
      data: { userId: user.id, role: 'CUSTOMER' },
    });

    // If signing up as provider, add role + profile
    if (input.role === 'PROVIDER') {
      await this.prisma.userRole.create({
        data: { userId: user.id, role: 'PROVIDER' },
      });
      await this.prisma.providerProfile.create({
        data: {
          userId: user.id,
          businessName: input.businessName ?? null,
          services: (input.serviceTypes ?? []).join(',') || null,
        },
      });
    }

    // If signing up as fleet manager, add role + profile
    if (input.role === 'FLEET_MANAGER') {
      await this.prisma.userRole.create({
        data: { userId: user.id, role: 'FLEET_MANAGER' },
      });
      await this.prisma.fleetProfile.create({
        data: { userId: user.id, orgName: null },
      });
    }

    // If signing up as admin (rare case)
    if (input.role === 'ADMIN') {
      await this.prisma.userRole.create({
        data: { userId: user.id, role: 'ADMIN' },
      });
    }

    // Always ensure a minimal customer profile (safe for your profiles controller)
    await this.prisma.customerProfile.create({
      data: { userId: user.id, stripeCustId: null },
    });

    const token = this.sign(user.id);
    const roles = await this.getRolesForUser(user.id);

    return {
      token,
      roles,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        phone: user.phone ?? undefined,
      },
    };
  }

  /* --------------------------------- login ------------------------------- */
  async login(email: string, password: string) {
    const e = (email || '').trim().toLowerCase();
    if (!e || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({ where: { email: e } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = this.sign(user.id);
    const roles = await this.getRolesForUser(user.id);

    return {
      token,
      roles,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        phone: user.phone ?? undefined,
      },
    };
  }
}
