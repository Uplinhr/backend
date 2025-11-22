import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixPremiumPlan() {
  console.log('🔧 Fixing Premium plan...');
  
  // Deactivate ALL Premium plans first
  await prisma.plan.updateMany({
    where: { name: 'Premium' },
    data: { isActive: false }
  });
  
  console.log('Deactivated all Premium plans');
  
  // Find the correct Premium plan (price 5346)
  const correctPremium = await prisma.plan.findFirst({
    where: {
      name: 'Premium',
      price: 5346
    },
    orderBy: { createdAt: 'desc' }
  });
  
  if (correctPremium) {
    await prisma.plan.update({
      where: { id: correctPremium.id },
      data: { isActive: true }
    });
    console.log(`Activated correct Premium plan: ${correctPremium.id} ($${correctPremium.price})`);
  } else {
    console.log('ERROR: Could not find Premium plan with price 5346');
  }
  
  // Show final state
  const activePlans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });
  
  console.log('\n✅ Final active plans:');
  for (const plan of activePlans) {
    console.log(`  - ${plan.name}: $${plan.price}`);
  }
}

fixPremiumPlan()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
