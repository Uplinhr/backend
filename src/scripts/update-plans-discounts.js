import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function updatePlansWithDiscounts() {
  console.log('💰 Updating plans with discount information...');
  
  const updates = [
    {
      name: 'Single Hire',
      price: 720,
      originalPrice: null, // No discount
      discountPercentage: 0
    },
    {
      name: 'Pro',
      price: 3762,
      originalPrice: 3960,
      discountPercentage: 5
    },
    {
      name: 'Premium',
      price: 5346,
      originalPrice: 5940,
      discountPercentage: 10
    },
    {
      name: 'Platinum',
      price: 6732,
      originalPrice: 7920,
      discountPercentage: 15
    }
  ];
  
  for (const update of updates) {
    const plan = await prisma.plan.findFirst({
      where: { 
        name: update.name,
        isActive: true
      }
    });
    
    if (plan) {
      // Get current features
      const currentFeatures = plan.features || {};
      
      // Update features with discount info
      const updatedFeatures = {
        ...currentFeatures,
        oldPrice: update.originalPrice,
        descuento: update.discountPercentage > 0 ? `${update.discountPercentage}% OFF` : null
      };
      
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          price: update.price,
          features: updatedFeatures
        }
      });
      
      console.log(`✅ Updated ${update.name}: $${update.price} (${update.discountPercentage}% off from $${update.originalPrice || update.price})`);
    } else {
      console.log(`❌ Plan not found: ${update.name}`);
    }
  }
  
  console.log('\n✅ All plans updated!');
}

updatePlansWithDiscounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
