import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function cleanDuplicatePlans() {
  console.log('🧹 Cleaning duplicate plans...');
  
  // Get all plans
  const allPlans = await prisma.plan.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`Found ${allPlans.length} total plans`);
  
  // Group by name
  const plansByName = {};
  for (const plan of allPlans) {
    if (!plansByName[plan.name]) {
      plansByName[plan.name] = [];
    }
    plansByName[plan.name].push(plan);
  }
  
  // For each plan name, keep only the latest one and deactivate the rest
  for (const [name, plans] of Object.entries(plansByName)) {
    if (plans.length > 1) {
      console.log(`Found ${plans.length} plans named "${name}". Keeping the latest, deactivating ${plans.length - 1}...`);
      
      // Sort by createdAt descending (newest first)
      plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Keep the first one (newest), deactivate the rest
      for (let i = 1; i < plans.length; i++) {
        await prisma.plan.update({ 
          where: { id: plans[i].id },
          data: { isActive: false }
        });
        console.log(`  Deactivated duplicate: ${plans[i].id}`);
      }
    }
  }
  
  console.log('✅ Cleanup completed!');
  
  // Show remaining plans
  const remaining = await prisma.plan.findMany({
    orderBy: { name: 'asc' }
  });
  
  console.log('\n📋 Remaining plans:');
  for (const plan of remaining) {
    console.log(`  - ${plan.name}: $${plan.price} (${plan.isActive ? 'Active' : 'Inactive'})`);
  }
}

cleanDuplicatePlans()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
