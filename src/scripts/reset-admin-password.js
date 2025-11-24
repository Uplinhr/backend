import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const email = 'admin@uplin.test';
  const newPassword = 'admin1234';

  try {
    console.log(`Resetting password for ${email}...`);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        emailVerified: true
      },
    });

    console.log(`✅ Password for ${email} has been reset to: ${newPassword}`);
    console.log('You can now log in with this password.');
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
