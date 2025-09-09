const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const [, , email, password, nameArg] = process.argv;
  if (!email || !password) {
    console.error('\nUsage: node apps/api/scripts/create-admin.js <email> <password> [name]\n');
    process.exit(1);
  }
  const name = nameArg || 'Super Admin';

  const passwordHash = await bcrypt.hash(password, 10);

  // Create or update the user
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  // Ensure ADMIN role exists for this user
  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: 'ADMIN' } }, // compound unique
    update: {},
    create: { userId: user.id, role: 'ADMIN' },
  });

  // Optional: give them CUSTOMER too so the app UI has customer view
  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: 'CUSTOMER' } },
    update: {},
    create: { userId: user.id, role: 'CUSTOMER' },
  });

  console.log('\n✅ Superuser ready:');
  console.log(`   email: ${email}`);
  console.log(`   name : ${name}`);
  console.log('   roles: ADMIN, CUSTOMER\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });