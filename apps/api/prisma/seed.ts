import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@viabolt.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const name = 'Super Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      roles: {
        create: [{ role: 'ADMIN' }],
      },
    },
    include: { roles: true },
  });

  console.log('Seeded admin:', user.email, 'roles:', user.roles.map((r: any) => r.role));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });