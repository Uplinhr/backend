import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function cleanupIncorrectPlans() {
  console.log('🧹 Cleaning up incorrect plans...');
  
  // These are the ONLY correct plan names for "Planes de Créditos"
  const correctPlanNames = ['Single Hire', 'Pro', 'Premium', 'Platinum'];
  
  // Get all plans
  const allPlans = await prisma.plan.findMany();
  
  console.log(`Found ${allPlans.length} total plans`);
  
  // Deactivate all plans that are NOT in the correct list
  for (const plan of allPlans) {
    if (!correctPlanNames.includes(plan.name)) {
      console.log(`Deactivating incorrect plan: "${plan.name}" (${plan.id})`);
      await prisma.plan.update({
        where: { id: plan.id },
        data: { isActive: false }
      });
    }
  }
  
  console.log('✅ Cleanup completed!');
  
  // Show remaining active plans
  const activePlans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });
  
  console.log('\n📋 Active plans:');
  for (const plan of activePlans) {
    console.log(`  - ${plan.name}: $${plan.price}`);
  }
}

cleanupIncorrectPlans()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
