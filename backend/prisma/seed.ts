import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superEmail = 'trackhubsports@gmail.com';
  const rawPassword = 'Trackhub@123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // Force update or create as SUPER_ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: superEmail },
    update: { passwordHash, role: 'SUPER_ADMIN', isVerified: true, fullName: 'Track Hub Super Admin' },
    create: { email: superEmail, passwordHash, fullName: 'Track Hub Super Admin', role: 'SUPER_ADMIN', isVerified: true }
  });

  console.log('Successfully enforced Super Admin:', superAdmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });